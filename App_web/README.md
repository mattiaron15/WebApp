# BlogApp - Applicazione Blog in Node.js

BlogApp è un'applicazione blog completa costruita con Node.js, Express e MongoDB. Permette agli utenti di creare un account, pubblicare post, commentare, mettere "mi piace" ai contenuti e seguire altri utenti. L'applicazione ora utilizza un'API esterna per l'autenticazione e la gestione dei post.

## Funzionalità

- Sistema di autenticazione utente tramite API esterna
- Creazione, modifica ed eliminazione dei post del blog
- Supporto per contenuti testuali e immagini
- Sistema di commenti con risposte annidate
- Funzionalità "mi piace" per post e commenti
- Profili utente con sistema per seguire altri utenti
- Funzionalità di ricerca per trovare post per titolo o contenuto
- Post in tendenza basati su visualizzazioni e interazioni
- Design responsive con Bootstrap 5
- Interfaccia completamente in italiano
- Integrazione con API esterna per autenticazione e gestione contenuti
- Cambio password e aggiornamento profilo

## Tecnologie Utilizzate

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Autenticazione:** JSON Web Tokens (JWT), bcrypt
- **Frontend:** EJS, Bootstrap 5, JavaScript
- **Altri:** Multer (upload file), Morgan (logging)
- **API:** Integrazione con API esterna per autenticazione e gestione contenuti

## Iniziare

### Prerequisiti

- Node.js (v14 o superiore)
- MongoDB
- API di autenticazione in esecuzione (inclusa nel progetto nella cartella "api")

### Installazione

1. Clona il repository:
   ```
   git clone https://github.com/your-username/blogapp.git
   cd blogapp
   ```

2. Installa le dipendenze per l'applicazione web:
   ```
   cd App_web
   npm install
   ```

3. Installa le dipendenze per l'API:
   ```
   cd ../api
   npm install
   ```

4. Crea un file `.env` nella directory root dell'API con le seguenti variabili:
   ```
   MONGO_URI=mongodb://localhost:27017/blog-api
   JWT_SECRET=your_jwt_secret_here
   PORT=8080
   NODE_ENV=development
   ```

5. Crea un file `config.js` nella cartella App_web/config con:
   ```javascript
   module.exports = {
     apiUrl: 'http://localhost:8080',
     jwtSecret: 'your_jwt_secret_here'
   };
   ```

6. Avvia l'API:
   ```
   cd api
   npm run dev
   ```

7. In un altro terminale, avvia l'applicazione web:
   ```
   cd App_web
   npm run dev
   ```

8. Visita `http://localhost:3000` nel tuo browser per vedere l'applicazione.

## Struttura del Progetto

```
App_web/
├── config/               # File di configurazione
│   └── config.js         # Configurazione dell'API
├── controllers/          # Controller delle rotte
├── middleware/           # Middleware personalizzati
│   └── authMiddleware.js # Middleware di autenticazione con API
├── models/               # Modelli Mongoose
├── public/               # File statici
│   ├── css/              # File CSS
│   ├── js/               # JavaScript lato client
│   └── images/           # Immagini
├── routes/               # Rotte Express
├── views/                # Template EJS
│   └── partials/         # Parti riutilizzabili del template
├── app.js                # File principale dell'applicazione
├── package.json          # Dipendenze e script
└── README.md             # Documentazione del progetto

api/
├── client/              # Client di test per l'API
├── config/              # Configurazione API
├── middleware/          # Middleware dell'API
├── models/              # Modelli dell'API
│   └── User.js          # Modello utente con bio e profilePicture
├── routes/              # Rotte dell'API
├── server.js            # Entry point dell'API
└── README.md            # Documentazione dell'API
```

## Endpoint API

### Autenticazione
- `POST /api/auth/register` - Registrazione nuovo utente
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Ottieni profilo utente corrente
- `PUT /api/auth/me` - Aggiorna profilo utente
- `PUT /api/auth/change-password` - Cambia password

### Post
- `GET /api/posts` - Ottieni tutti i post
- `POST /api/posts` - Crea un nuovo post
- `GET /api/posts/:id` - Ottieni un post specifico
- `PUT /api/posts/:id` - Aggiorna un post
- `DELETE /api/posts/:id` - Elimina un post
- `PUT /api/posts/:id/like` - Mi piace/non mi piace a un post
- `GET /api/posts/search` - Cerca post
- `GET /api/posts/trending` - Ottieni post in tendenza

### Commenti
- `POST /api/comments` - Crea un commento
- `GET /api/comments/post/:postId` - Ottieni commenti per un post
- `GET /api/comments/replies/:commentId` - Ottieni risposte per un commento
- `PUT /api/comments/:id` - Aggiorna un commento
- `DELETE /api/comments/:id` - Elimina un commento
- `PUT /api/comments/:id/like` - Mi piace/non mi piace a un commento

### Utenti
- `GET /api/users/:id` - Ottieni profilo utente
- `PUT /api/users/:id` - Aggiorna profilo utente
- `GET /api/users/:id/posts` - Ottieni post dell'utente
- `PUT /api/users/:id/follow` - Segui/smetti di seguire un utente

## Aggiornamenti Recenti

- Integrazione con API esterna per autenticazione e gestione dei post
- Traduzione completa dell'interfaccia in italiano
- Aggiunta funzionalità per cambiare password
- Miglioramento della gestione dei profili utente con bio e immagine profilo
- Aggiunta contatore dei post nel profilo
- Aggiunto pulsante per l'eliminazione dei post da parte dell'autore
- Ottimizzazione del layout e dell'interfaccia utente
- Link al client di test dell'API nel footer

## Licenza

Questo progetto è concesso in licenza con la Licenza MIT - vedere il file LICENSE per i dettagli.

## Ringraziamenti

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/) 