# Requisito: usare il wiki dallo smartphone a PC spento

> File di esempio in `raw/`. E' la fonte da cui deriva la pagina
> `wiki/concepts/accesso-mobile.md`.

Il wiki gira sul PC con Claude Code per ingest e lint. Serve poterlo usare
anche dallo smartphone, sugli stessi dati, **anche quando il PC e' spento**.

Vincoli emersi:

- Niente che dipenda dal PC acceso: esclude VPN verso casa, sync
  peer-to-peer fra i due dispositivi, server locale con tunnel.
- Gli stessi dati, non una copia esportata: quello che scrivo dal telefono
  deve essere visibile dal PC e viceversa, senza passaggi manuali.
- Deve funzionare anche senza rete sul telefono, almeno in lettura.
- Non deve creare conflitti quando entrambi i lati scrivono.
- Il contenuto e' personale: niente indici pubblici.
- Costo tendente a zero, nessun server da amministrare.
