# Client di Test per API di Autenticazione

Questo client è stato creato per testare le funzionalità dell'API di autenticazione e gestione dei post. Permette di registrare nuovi utenti, effettuare il login, visualizzare il profilo utente e verificare lo stato dell'API.

## Funzionalità

- Registrazione utente
- Login utente
- Visualizzazione e aggiornamento profilo utente
- Verifica dello stato dell'API
- Test delle funzionalità dell'API in un'interfaccia user-friendly

## Integrazione con App_web

Questo client di test è accessibile direttamente dall'applicazione principale (App_web) tramite un link nel footer. Consente agli utenti di verificare e testare direttamente le funzionalità dell'API senza interagire con l'interfaccia principale dell'applicazione.

## Requisiti

- Node.js (versione 14 o superiore)
- npm (incluso con Node.js)
- Server API in esecuzione

## Installazione

1. Assicurati che il server API sia in esecuzione (nella cartella principale del progetto)
2. Naviga nella cartella `api/client`
3. Installa le dipendenze:

```bash
npm install
```

## Avvio dell'applicazione

Per avviare l'applicazione in modalità sviluppo:

```bash
npm run dev
```

L'applicazione sarà disponibile all'indirizzo [http://localhost:5173](http://localhost:5173)

## Build per la produzione

Per creare una build ottimizzata per la produzione:

```bash
npm run build
```

I file generati saranno disponibili nella cartella `dist`.

## Funzionalità aggiornate

Il client di test ora supporta:

- Visualizzazione completa del profilo utente con bio e immagine del profilo
- Test delle richieste di autenticazione con token JWT
- Verifica dello stato di connessione con l'API
- Interfaccia utente migliorata e intuitive per facilitare i test

## Note

- Il client è configurato per comunicare con l'API in esecuzione su http://localhost:8080
- Assicurati che il server API sia in esecuzione prima di utilizzare il client
- Puoi verificare lo stato dell'API dalla pagina "Stato API" nel client
- Questo client è principalmente uno strumento di test e non è destinato all'uso in produzione come applicazione principale