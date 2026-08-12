"""Primitive condivise fra lint, build e preflight.

Zero dipendenze esterne: gli stessi script devono girare identici sul PC,
dentro il runner di GitHub Actions e in una sessione Claude Code sul web.
Aggiungere una dipendenza pip qui significherebbe che una delle tre
esecuzioni puo' divergere dalle altre, ed e' esattamente il fallimento che
questo sistema deve evitare.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

WIKI_DIR = "wiki"
RAW_DIR = "raw"
INBOX_DIR = "raw/inbox"
INDEX_FILE = "wiki/index.md"
LOG_FILE = "wiki/log.md"

# Cartelle ammesse dentro wiki/. Il lint rifiuta tutto il resto: una gerarchia
# libera rende impossibile sia il controllo dei link sia la build della PWA.
WIKI_SECTIONS = ("concepts", "entities", "sources")

VALID_TYPES = ("concept", "entity", "source")

# File generati: non vanno mai considerati pagine wiki ne' indicizzati come tali.
GENERATED = (INDEX_FILE, LOG_FILE)

WIKILINK_RE = re.compile(r"\[\[([^\]\|#]+)(?:#[^\]\|]+)?(?:\|([^\]]+))?\]\]")
FRONTMATTER_RE = re.compile(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*\r?\n?", re.DOTALL)

# Caratteri che rompono almeno uno fra Windows, macOS case-insensitive e URL.
UNPORTABLE_RE = re.compile(r'[<>:"\\|?*\x00-\x1f]')

SLUG_RE = re.compile(r"\A[a-z0-9]+(?:-[a-z0-9]+)*\Z")


def nfc(text: str) -> str:
    """Normalizza in NFC.

    macOS consegna i nomi file in NFD ("citta" con accento = 2 codepoint),
    Linux e Windows in NFC. Senza questa normalizzazione lo stesso file
    committato dal Mac risulta un file diverso per il runner Linux, i link
    si rompono e git mostra rinomini fantasma.
    """
    return unicodedata.normalize("NFC", text)


def parse_frontmatter(text: str) -> tuple[dict, str, bool]:
    """Ritorna (metadati, corpo, trovato).

    Parser YAML minimo che copre il sottoinsieme usato dal wiki: scalari,
    liste inline [a, b] e liste a blocco. Volutamente non e' YAML completo:
    accettare YAML arbitrario nel frontmatter significherebbe accettare
    strutture che l'agente poi non sa rigenerare in modo deterministico.
    """
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text, False

    body = text[match.end():]
    meta: dict = {}
    current_key: str | None = None

    for raw_line in match.group(1).splitlines():
        line = raw_line.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue

        if line.lstrip().startswith("- ") and current_key:
            item = _scalar(line.lstrip()[2:])
            meta.setdefault(current_key, [])
            if isinstance(meta[current_key], list):
                meta[current_key].append(item)
            continue

        if ":" not in line:
            continue

        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        current_key = key

        if not value:
            meta[key] = []
        elif value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            meta[key] = [_scalar(p) for p in _split_inline(inner)] if inner else []
        else:
            meta[key] = _scalar(value)

    return meta, body, True


def _split_inline(inner: str) -> list[str]:
    parts, buf, quote = [], [], ""
    for ch in inner:
        if quote:
            if ch == quote:
                quote = ""
            buf.append(ch)
        elif ch in "\"'":
            quote = ch
            buf.append(ch)
        elif ch == ",":
            parts.append("".join(buf))
            buf = []
        else:
            buf.append(ch)
    if buf:
        parts.append("".join(buf))
    return [p for p in (p.strip() for p in parts) if p]


def _scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def dump_frontmatter(meta: dict) -> str:
    """Serializza il frontmatter in forma canonica.

    L'ordine delle chiavi e' fisso e non alfabetico: e' l'ordine di lettura
    umana. Fisso e' cio' che conta, perche' due agenti che riscrivono la
    stessa pagina devono produrre lo stesso byte stream, altrimenti ogni
    lint genera un diff spurio e i merge diventano rumorosi.
    """
    order = ["title", "type", "tags", "derived_from", "updated", "status"]
    keys = [k for k in order if k in meta] + [k for k in meta if k not in order]

    lines = ["---"]
    for key in keys:
        value = meta[key]
        if isinstance(value, list):
            rendered = ", ".join(str(v) for v in value)
            lines.append(f"{key}: [{rendered}]")
        else:
            lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines) + "\n"


@dataclass
class Page:
    path: Path            # assoluto
    rel: str              # relativo alla root del repo, sempre con /
    slug: str             # basename senza .md, normalizzato NFC
    section: str          # concepts | entities | sources
    meta: dict
    body: str
    has_frontmatter: bool
    links: list[str] = field(default_factory=list)

    @property
    def title(self) -> str:
        return str(self.meta.get("title") or self.slug)

    @property
    def tags(self) -> list[str]:
        tags = self.meta.get("tags", [])
        return [str(t) for t in tags] if isinstance(tags, list) else [str(tags)]


def extract_links(body: str) -> list[str]:
    """Estrae i target dei [[wikilink]], ignorando quelli dentro blocchi di codice.

    Un esempio di sintassi dentro un fence non e' un link e segnalarlo come
    rotto insegnerebbe all'utente a ignorare gli errori del lint.
    """
    out: list[str] = []
    in_fence = False
    for line in body.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        line = re.sub(r"`[^`]*`", "", line)
        for match in WIKILINK_RE.finditer(line):
            out.append(nfc(match.group(1).strip()))
    return out


def load_pages(root: Path) -> list[Page]:
    """Carica le pagine wiki. Non include index.md e log.md (generati)."""
    pages: list[Page] = []
    wiki_root = root / WIKI_DIR
    if not wiki_root.is_dir():
        return pages

    for path in sorted(wiki_root.rglob("*.md")):
        rel = path.relative_to(root).as_posix()
        if rel in GENERATED:
            continue
        text = path.read_text(encoding="utf-8")
        meta, body, found = parse_frontmatter(text)
        parts = path.relative_to(wiki_root).parts
        section = parts[0] if len(parts) > 1 else ""
        pages.append(
            Page(
                path=path,
                rel=rel,
                slug=nfc(path.stem),
                section=section,
                meta=meta,
                body=body,
                has_frontmatter=found,
                links=extract_links(body),
            )
        )
    return pages


def repo_root(start: Path | None = None) -> Path:
    """Risale fino alla root del repo wiki.

    Cerca il marcatore .wiki-root prima di .git: durante lo sviluppo il wiki
    puo' vivere dentro un altro repo, e agganciarsi al .git sbagliato
    farebbe scrivere il lint fuori dal wiki.
    """
    current = (start or Path.cwd()).resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".wiki-root").exists():
            return candidate
    for candidate in [current, *current.parents]:
        if (candidate / WIKI_DIR).is_dir() and (candidate / RAW_DIR).is_dir():
            return candidate
    return current
