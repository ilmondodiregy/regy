#!/usr/bin/env python3
"""Lint strutturale del wiki.

Divisione del lavoro voluta: questo script controlla cio' che e' decidibile
in modo deterministico (link, frontmatter, collisioni, indice), l'agente LLM
controlla cio' che richiede giudizio (contraddizioni, duplicazioni
semantiche, pagine mancanti). Tenere le due cose separate e' il motivo per
cui il lint puo' girare in CI su ogni push senza costare token e senza
produrre risultati diversi a ogni esecuzione.

Uso:
    wiki-lint.py                 # controlla, exit 1 se ci sono errori
    wiki-lint.py --fix           # corregge cio' che e' correggibile
    wiki-lint.py --json          # output per la CI
"""

from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from wiki_common import (  # noqa: E402
    GENERATED,
    INBOX_DIR,
    INDEX_FILE,
    LOG_FILE,
    RAW_DIR,
    UNPORTABLE_RE,
    VALID_TYPES,
    WIKI_DIR,
    WIKI_SECTIONS,
    Page,
    dump_frontmatter,
    load_pages,
    nfc,
    repo_root,
)


class Report:
    def __init__(self) -> None:
        self.items: list[dict] = []

    def add(self, level: str, code: str, message: str, path: str = "", fixable: bool = False) -> None:
        self.items.append(
            {"level": level, "code": code, "message": message, "path": path, "fixable": fixable}
        )

    def error(self, code: str, message: str, path: str = "", fixable: bool = False) -> None:
        self.add("error", code, message, path, fixable)

    def warn(self, code: str, message: str, path: str = "", fixable: bool = False) -> None:
        self.add("warning", code, message, path, fixable)

    def info(self, code: str, message: str, path: str = "") -> None:
        self.add("info", code, message, path)

    @property
    def errors(self) -> list[dict]:
        return [i for i in self.items if i["level"] == "error"]

    @property
    def warnings(self) -> list[dict]:
        return [i for i in self.items if i["level"] == "warning"]


# --------------------------------------------------------------------------
# Controlli
# --------------------------------------------------------------------------

def check_frontmatter(pages: list[Page], report: Report) -> None:
    for page in pages:
        if not page.has_frontmatter:
            report.error("E001", "frontmatter assente", page.rel, fixable=True)
            continue
        if not page.meta.get("title"):
            report.error("E002", "campo obbligatorio 'title' mancante", page.rel, fixable=True)
        page_type = str(page.meta.get("type", ""))
        if not page_type:
            report.error("E002", "campo obbligatorio 'type' mancante", page.rel, fixable=True)
        elif page_type not in VALID_TYPES:
            report.error(
                "E003",
                f"type '{page_type}' non valido (ammessi: {', '.join(VALID_TYPES)})",
                page.rel,
            )
        if not page.tags:
            report.warn("W001", "pagina senza tag: sara' difficile ritrovarla da mobile", page.rel)


def check_layout(root: Path, pages: list[Page], report: Report) -> None:
    for page in pages:
        if page.section not in WIKI_SECTIONS:
            report.error(
                "E013",
                f"pagina fuori dalle sezioni previste ({', '.join(WIKI_SECTIONS)})",
                page.rel,
            )
        # Il type deve concordare con la cartella: e' cio' che permette alla
        # PWA di raggruppare senza leggere il frontmatter di ogni pagina.
        expected = {"concepts": "concept", "entities": "entity", "sources": "source"}
        want = expected.get(page.section)
        got = str(page.meta.get("type", ""))
        if want and got and got != want:
            report.error("E003", f"type '{got}' incoerente con la cartella '{page.section}/'", page.rel)


def check_slugs(pages: list[Page], report: Report) -> None:
    """Collisioni di nome.

    Tre controlli distinti che sembrano lo stesso ma non lo sono, e ognuno
    corrisponde a un modo reale in cui questo sistema si rompe:

    1. Slug duplicato in cartelle diverse: [[nome]] diventa ambiguo.
    2. Collisione case-insensitive: due file che convivono su Linux ma si
       sovrascrivono a vicenda al clone su macOS o Windows. Il PC perde dati
       silenziosamente al primo pull.
    3. Nome non NFC o non portabile: il file committato dal Mac non viene
       trovato dal runner Linux.
    """
    by_slug: dict[str, list[Page]] = defaultdict(list)
    by_lower: dict[str, list[Page]] = defaultdict(list)

    for page in pages:
        by_slug[page.slug].append(page)
        by_lower[page.slug.lower()].append(page)

    for slug, group in sorted(by_slug.items()):
        if len(group) > 1:
            paths = ", ".join(p.rel for p in group)
            report.error("E005", f"slug '{slug}' ambiguo, presente in: {paths}", group[0].rel)

    for lower, group in sorted(by_lower.items()):
        distinct = {p.slug for p in group}
        if len(group) > 1 and len(distinct) > 1:
            paths = ", ".join(p.rel for p in group)
            report.error(
                "E006",
                f"collisione case-insensitive su '{lower}' ({paths}): "
                "questi file si sovrascrivono al clone su macOS/Windows",
                group[0].rel,
            )

    for page in pages:
        stem = page.path.stem
        if unicodedata.normalize("NFC", stem) != stem:
            report.error(
                "E007",
                "nome file non normalizzato NFC (tipico dei file creati su macOS)",
                page.rel,
                fixable=True,
            )
        if UNPORTABLE_RE.search(stem):
            report.error("E007", "nome file con caratteri non portabili su Windows", page.rel)
        if " " in stem:
            report.warn("W002", "spazio nel nome file: complica URL e link", page.rel)


def check_links(pages: list[Page], report: Report) -> dict[str, int]:
    """Verifica i [[wikilink]] e conta i link entranti."""
    known = {p.slug for p in pages}
    known_lower = {p.slug.lower(): p.slug for p in pages}
    inbound: dict[str, int] = {p.slug: 0 for p in pages}

    for page in pages:
        for target in page.links:
            if target in known:
                if target != page.slug:
                    inbound[target] += 1
                continue
            hint = known_lower.get(target.lower())
            suffix = f" (forse '{hint}'?)" if hint else ""
            report.error("E004", f"link rotto [[{target}]]{suffix}", page.rel)
    return inbound


def check_orphans(pages: list[Page], inbound: dict[str, int], report: Report) -> None:
    """Pagine orfane: nessun link entrante.

    E' un warning e non un errore. Una pagina appena creata dall'ingest e'
    legittimamente orfana finche' il lint semantico non la collega; farla
    fallire in CI bloccherebbe il percorso "capture da telefono a PC spento",
    che e' proprio quello che stiamo abilitando.
    """
    for page in pages:
        if inbound.get(page.slug, 0) == 0:
            report.warn(
                "W003",
                "pagina orfana: nessuna altra pagina la collega",
                page.rel,
            )


def check_derived_from(root: Path, pages: list[Page], report: Report) -> None:
    for page in pages:
        refs = page.meta.get("derived_from", [])
        if isinstance(refs, str):
            refs = [refs] if refs else []
        for ref in refs:
            ref = str(ref).strip()
            if not ref:
                continue
            if not ref.startswith(RAW_DIR + "/"):
                report.warn("W004", f"derived_from '{ref}' non punta dentro {RAW_DIR}/", page.rel)
                continue
            if not (root / ref).exists():
                report.error("E009", f"derived_from '{ref}' non esiste", page.rel)


def check_raw_immutable(root: Path, report: Report) -> None:
    """raw/ deve contenere solo file, mai pagine con frontmatter wiki.

    Se l'agente comincia a riscrivere dentro raw/ il sistema perde la sua
    ground truth e ogni ri-ingest produce risultati diversi.
    """
    raw = root / RAW_DIR
    if not raw.is_dir():
        report.error("E014", f"cartella {RAW_DIR}/ mancante", RAW_DIR)
        return
    for path in sorted(raw.rglob("*.md")):
        rel = path.relative_to(root).as_posix()
        text = path.read_text(encoding="utf-8", errors="replace")
        if '\ntype: concept' in text or '\ntype: entity' in text:
            report.warn(
                "W005",
                "file in raw/ con frontmatter da pagina wiki: raw/ deve restare fonte grezza",
                rel,
            )


def check_inbox(root: Path, pages: list[Page], report: Report) -> list[str]:
    """Segnala le capture da smartphone non ancora ingerite.

    E' il collegamento fra i due mondi: il telefono scrive qui, e finche'
    nessuna pagina wiki dichiara derived_from su questo file, la cattura e'
    ancora in attesa. E' anche cio' che il workflow di ingest usa per sapere
    su cosa lavorare senza tenere stato aggiuntivo da qualche parte.
    """
    inbox = root / INBOX_DIR
    if not inbox.is_dir():
        return []

    ingested: set[str] = set()
    for page in pages:
        refs = page.meta.get("derived_from", [])
        if isinstance(refs, str):
            refs = [refs] if refs else []
        for ref in refs:
            ingested.add(str(ref).strip())

    pending = []
    for path in sorted(inbox.rglob("*.md")):
        rel = path.relative_to(root).as_posix()
        if rel not in ingested:
            pending.append(rel)
            report.info("I001", "cattura in attesa di ingest", rel)
    return pending


def check_log(root: Path, report: Report, fix: bool) -> None:
    """log.md e' append-only con merge=union: puo' contenere duplicati.

    union merge e' quello che evita i conflitti quando PC e CI scrivono lo
    stesso log nello stesso momento. Il prezzo e' che una riga identica
    scritta da entrambi compare due volte, e questo controllo paga quel
    prezzo ripulendo dopo.
    """
    log = root / LOG_FILE
    if not log.exists():
        if fix:
            log.parent.mkdir(parents=True, exist_ok=True)
            log.write_text("# Log operazioni\n\n", encoding="utf-8")
            report.info("I002", "log.md creato", LOG_FILE)
        else:
            report.warn("W006", "log.md mancante", LOG_FILE, fixable=True)
        return

    lines = log.read_text(encoding="utf-8").splitlines()
    seen: set[str] = set()
    out: list[str] = []
    duplicates = 0
    for line in lines:
        key = line.strip()
        # Solo le voci di log sono deduplicate; il testo libero sotto una
        # voce puo' legittimamente ripetersi.
        if key.startswith("## [") and key in seen:
            duplicates += 1
            continue
        if key.startswith("## ["):
            seen.add(key)
        out.append(line)

    if duplicates:
        if fix:
            log.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")
            report.info("I003", f"rimosse {duplicates} voci duplicate da log.md", LOG_FILE)
        else:
            report.warn(
                "W007",
                f"{duplicates} voci duplicate (residuo di union merge)",
                LOG_FILE,
                fixable=True,
            )


def build_index(pages: list[Page], inbound: dict[str, int]) -> str:
    """Genera index.md in modo deterministico.

    Deterministico e' il requisito centrale: index.md e' l'unico file che
    quasi ogni ingest tocca, quindi e' il candidato numero uno al conflitto
    fra PC e CI. Rigenerandolo dai soli contenuti delle pagine, qualunque
    conflitto si risolve buttando via entrambe le versioni e ricostruendo.
    """
    titles = {
        "concepts": "Concetti",
        "entities": "Entita'",
        "sources": "Fonti",
    }
    lines = [
        "# Indice",
        "",
        "<!-- GENERATO DA wiki-lint.py --fix - non modificare a mano -->",
        f"<!-- pagine: {len(pages)} -->",
        "",
    ]
    for section in WIKI_SECTIONS:
        group = sorted(
            (p for p in pages if p.section == section),
            key=lambda p: (p.title.lower(), p.slug),
        )
        lines.append(f"## {titles[section]} ({len(group)})")
        lines.append("")
        if not group:
            lines.append("_(nessuna pagina)_")
            lines.append("")
            continue
        for page in group:
            tags = " ".join(f"#{t}" for t in sorted(page.tags))
            refs = inbound.get(page.slug, 0)
            suffix = f" — {tags}" if tags else ""
            lines.append(f"- [[{page.slug}]] — {page.title}{suffix} `({refs} link entranti)`")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def check_index(root: Path, pages: list[Page], inbound: dict[str, int], report: Report, fix: bool) -> None:
    index = root / INDEX_FILE
    wanted = build_index(pages, inbound)
    current = index.read_text(encoding="utf-8") if index.exists() else ""
    if current == wanted:
        return
    if fix:
        index.parent.mkdir(parents=True, exist_ok=True)
        index.write_text(wanted, encoding="utf-8")
        report.info("I004", "index.md rigenerato", INDEX_FILE)
    else:
        report.error("E012", "index.md non aggiornato rispetto alle pagine", INDEX_FILE, fixable=True)


def fix_frontmatter(root: Path, pages: list[Page], report: Report) -> int:
    """Ripara i frontmatter riparabili senza inventare contenuto.

    title e type si deducono senza ambiguita' dal nome file e dalla cartella.
    tags no: un tag inventato e' peggio di un tag assente perche' inquina la
    ricerca da mobile, quindi resta un warning per l'agente.
    """
    fixed = 0
    expected = {"concepts": "concept", "entities": "entity", "sources": "source"}
    for page in pages:
        meta = dict(page.meta)
        changed = False
        if not meta.get("title"):
            meta["title"] = page.slug.replace("-", " ").capitalize()
            changed = True
        if not meta.get("type") and page.section in expected:
            meta["type"] = expected[page.section]
            changed = True
        if not meta.get("updated"):
            meta["updated"] = date.today().isoformat()
            changed = True
        if changed or not page.has_frontmatter:
            body = page.body if page.has_frontmatter else page.body.lstrip("\n")
            page.path.write_text(dump_frontmatter(meta) + "\n" + body.lstrip("\n"), encoding="utf-8")
            report.info("I005", "frontmatter riparato", page.rel)
            fixed += 1
    return fixed


def fix_nfc_names(root: Path, report: Report) -> int:
    renamed = 0
    for path in sorted((root / WIKI_DIR).rglob("*.md")):
        target = path.with_name(nfc(path.name))
        if target != path and not target.exists():
            path.rename(target)
            report.info("I006", f"rinominato in NFC: {target.name}", target.relative_to(root).as_posix())
            renamed += 1
    return renamed


# --------------------------------------------------------------------------

def run(root: Path, fix: bool) -> Report:
    report = Report()

    if fix:
        fix_nfc_names(root, report)

    pages = load_pages(root)
    if not pages:
        report.warn("W008", f"nessuna pagina trovata in {WIKI_DIR}/", WIKI_DIR)

    if fix:
        fix_frontmatter(root, pages, report)
        pages = load_pages(root)  # ricarica: il fix ha cambiato i file

    check_frontmatter(pages, report)
    check_layout(root, pages, report)
    check_slugs(pages, report)
    inbound = check_links(pages, report)
    check_orphans(pages, inbound, report)
    check_derived_from(root, pages, report)
    check_raw_immutable(root, report)
    check_inbox(root, pages, report)
    check_log(root, report, fix)
    check_index(root, pages, inbound, report, fix)

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint strutturale del wiki")
    parser.add_argument("--root", type=Path, default=None, help="root del repo wiki")
    parser.add_argument("--fix", action="store_true", help="corregge cio' che e' correggibile")
    parser.add_argument("--json", action="store_true", help="output JSON")
    parser.add_argument(
        "--strict", action="store_true", help="fallisce anche in presenza di soli warning"
    )
    args = parser.parse_args()

    root = (args.root or repo_root()).resolve()
    report = run(root, args.fix)

    if args.json:
        print(json.dumps({"root": str(root), "items": report.items}, ensure_ascii=False, indent=2))
    else:
        icons = {"error": "✗", "warning": "!", "info": "·"}
        for item in report.items:
            where = f" {item['path']}" if item["path"] else ""
            print(f"{icons[item['level']]} [{item['code']}]{where}: {item['message']}")
        total_errors = len(report.errors)
        total_warnings = len(report.warnings)
        print()
        print(f"{total_errors} errori, {total_warnings} warning — root: {root}")
        if total_errors and not args.fix:
            fixable = sum(1 for i in report.errors if i["fixable"])
            if fixable:
                print(f"{fixable} correggibili con: wiki-lint.py --fix")

    if report.errors:
        return 1
    if args.strict and report.warnings:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
