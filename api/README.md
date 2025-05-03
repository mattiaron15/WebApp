# API di Autenticazione e Gestione Utenti

Questo progetto implementa un'API RESTful per la gestione dell'autenticazione degli utenti e dei post, utilizzando Node.js, Express e MongoDB. Questa API viene utilizzata dall'applicazione principale (App_web) per gestire l'autenticazione e il contenuto.

## Caratteristiche

- Registrazione utenti
- Login e autenticazione con JWT
- Protezione delle rotte con middleware di autenticazione
- Gestione profilo utente con bio e immagine profilo
- Cambio password
- Gestione completa dei post
- Gestione dei "mi piace" e commenti
- Sistema per seguire altri utenti

## Requisiti

- Node.js (v12 o superiore)
- MongoDB

## Installazione

1. Clona il repository

```bash
git clone <url-repository>
cd api
```

2. Installa le dipendenze

```bash
npm install
```

3. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto con le seguenti variabili:

```
MONGO_URI=mongodb://localhost:27017/auth-api
JWT_SECRET=auth_api_secret_key
PORT=8080
NODE_ENV=development
```

4. Avvia il server

```bash
# Modalità sviluppo
npm run dev

# Modalità produzione
npm start
```

## Struttura del Progetto

```
├── client/              # Client di test per verificare l'API
├── config/
│   └── db.js           # Configurazione connessione MongoDB
├── middleware/
│   └── auth.js         # Middleware per autenticazione JWT
├── models/
│   ├── User.js         # Schema e modello utente (con bio e profilePicture)
│   └── Post.js         # Schema e modello post
├── routes/             # Definizione delle rotte API
├── .env                # Variabili d'ambiente
├── package.json        # Dipendenze e script
└── server.js           # Entry point dell'applicazione
```

## API Endpoints

### Autenticazione

#### Registrazione Utente

```
POST /api/users/register
```

Body:
```json
{
  "username": "esempio",
  "email": "esempio@email.com",
  "password": "password123",
  "bio": "Breve biografia dell'utente",
  "profilePicture": "URL dell'immagine profilo"
}
```

Risposta:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "esempio",
    "email": "esempio@email.com",
    "bio": "Breve biografia dell'utente",
    "profilePicture": "URL dell'immagine profilo"
  }
}
```

#### Login Utente

```
POST /api/users/login
```

Body:
```json
{
  "email": "esempio@email.com",
  "password": "password123"
}
```

Risposta:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "esempio",
    "email": "esempio@email.com",
    "bio": "Breve biografia dell'utente",
    "profilePicture": "URL dell'immagine profilo"
  }
}
```

### Utenti

#### Ottieni Profilo Utente

```
GET /api/users/me
```

Header:
```
x-auth-token: jwt-token
```

Risposta:
```json
{
  "id": "user-id",
  "username": "esempio",
  "email": "esempio@email.com",
  "bio": "Breve biografia dell'utente",
  "profilePicture": "URL dell'immagine profilo",
  "createdAt": "2023-05-01T12:00:00.000Z"
}
```

#### Aggiorna Profilo Utente

```
PUT /api/auth/me
```

Header:
```
x-auth-token: jwt-token
```

Body:
```json
{
  "bio": "Nuova biografia",
  "profilePicture": "Nuovo URL immagine profilo"
}
```

#### Cambia Password

```
PUT /api/auth/change-password
```

Header:
```
x-auth-token: jwt-token
```

Body:
```json
{
  "currentPassword": "password-attuale",
  "newPassword": "nuova-password"
}
```

### Post

#### Crea un Post

```
POST /api/posts
```

Header:
```
x-auth-token: jwt-token
```

Body:
```json
{
  "title": "Titolo del post",
  "content": "Contenuto del post",
  "image": "URL immagine (opzionale)",
  "tags": ["tag1", "tag2"]
}
```

#### Ottieni Tutti i Post

```
GET /api/posts
```

#### Ottieni un Post Specifico

```
GET /api/posts/:id
```

#### Elimina un Post

```
DELETE /api/posts/:id
```

Header:
```
x-auth-token: jwt-token
```

## Client di Test

Nella cartella `client` è disponibile un'applicazione React che può essere utilizzata per testare le funzionalità dell'API. Per avviarla:

```bash
cd client
npm install
npm run dev
```

Il client sarà disponibile all'indirizzo [http://localhost:5173](http://localhost:5173)

## Integrazione con App_web

Questa API è progettata per essere utilizzata con l'applicazione principale (App_web). L'integrazione avviene tramite:

1. Chiamate HTTP dall'App_web agli endpoint dell'API
2. Utilizzo di token JWT per mantenere l'autenticazione
3. Middleware di autenticazione nell'App_web che verifica i token con l'API

## Sicurezza

L'API utilizza:
- JWT (JSON Web Tokens) per l'autenticazione
- bcryptjs per l'hashing delle password
- Validazione degli input con express-validator
- Middleware di autenticazione per proteggere le rotte
- Controlli di proprietà per modificare/eliminare solo risorse proprie

## Aggiornamenti Recenti

- Aggiunta dei campi `bio` e `profilePicture` al modello User
- Implementazione dell'endpoint per il cambio password
- Miglioramento del sistema di gestione degli errori
- Ottimizzazione delle prestazioni delle query al database
- Supporto completo per i post e i commenti
- Migliorata la sicurezza e la validazione degli input

## Licenza

MIT