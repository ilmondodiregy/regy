# Log operazioni

Append-only. Le voci nuove vanno **in fondo**. Non riscrivere le voci
passate: questo file e' configurato con `merge=union` in `.gitattributes`,
quindi due scrittori simultanei non generano mai un conflitto finche' si
limitano ad aggiungere.

## [2026-04-02] ingest | Gist llm-wiki.md (Karpathy)

Prima fonte. Create le pagine [[llm-wiki]], [[ingest]], [[lint]],
[[andrej-karpathy]] e la pagina fonte corrispondente.

## [2026-08-11] ingest | Requisito accesso mobile

Creata [[accesso-mobile]]. Aggiornata [[llm-wiki]] con la sezione sul punto
debole (dipendenza dal disco locale) e il collegamento entrante.
