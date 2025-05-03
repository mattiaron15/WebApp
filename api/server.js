const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Carica le variabili d'ambiente
dotenv.config();

// Imposta variabili d'ambiente predefinite se non sono definite
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jwt_secret_fallback_key';
  console.log('⚠️ JWT_SECRET non trovato in .env, usando valore predefinito. NON usare in produzione!');
}

// Variabili per la gestione della riconnessione al database
let isConnected = false;
let reconnectAttempts = 0;
const reconnectInterval = 5000; // 5 secondi
const maxReconnectDelay = 60000; // Massimo ritardo di 1 minuto

// Funzione per connettere al database con tentativi di riconnessione
const maxReconnectAttempts = 10;  // Limita a 10 tentativi

const connectWithRetry = async () => {
  try {
    await connectDB();
    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ Connessione al database stabilita con successo');
  } catch (error) {
    isConnected = false;
    reconnectAttempts++;

    if (reconnectAttempts > maxReconnectAttempts) {
      console.error('❌ Troppi tentativi di connessione falliti. Arresto del server.');
      process.exit(1);  // Esce dal processo dopo troppi fallimenti
    }

    const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttempts - 1), maxReconnectDelay);
    console.log(`🔄 Tentativo di riconnessione #${reconnectAttempts} fallito. Nuovo tentativo tra ${Math.round(delay / 1000)} secondi.`);
    
    setTimeout(connectWithRetry, delay);
  }
};

// Avvia la connessione al database con retry
connectWithRetry();

const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Servi file statici dalla cartella public
app.use(express.static('public'));

// Definisci le rotte
app.get('/', (req, res) => {
  res.json({ msg: 'Benvenuto all\'API di Autenticazione' });
});

// Importa e usa le rotte
const routes = require('./routes');
app.use(routes);

// Rotta per verificare lo stato di salute dell'API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    dbConnected: isConnected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Crea la cartella routes se non esiste
const fs = require('fs');
const path = require('path');
if (!fs.existsSync(path.join(__dirname, 'routes'))) {
  fs.mkdirSync(path.join(__dirname, 'routes'));
}

// Definisci la porta
const PORT = process.env.PORT || 8080;

// Gestione degli errori non catturati
process.on('uncaughtException', (error) => {
  console.error('Errore non catturato:', error);
  // Non terminiamo il processo, ma logghiamo l'errore e verifichiamo la connessione al database
  if (isConnected) {
    console.log('Verifica della connessione al database dopo un errore non catturato...');
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        isConnected = false;
        connectWithRetry();
      }
    } catch (err) {
      // Ignora errori durante la verifica
    }
  }
});

// Gestione delle promise non gestite
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise non gestita:', reason);
  // Non terminiamo il processo, ma logghiamo l'errore e verifichiamo la connessione al database
  if (isConnected) {
    console.log('Verifica della connessione al database dopo una promise non gestita...');
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        isConnected = false;
        connectWithRetry();
      }
    } catch (err) {
      // Ignora errori durante la verifica
    }
  }
});

// Middleware per la gestione degli errori
app.use((err, req, res, next) => {
  console.error('Errore durante la richiesta:', err);
  
  // Verifica la connessione al database in caso di errore
  if (isConnected) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('Connessione al database persa durante una richiesta, tentativo di riconnessione...');
        isConnected = false;
        connectWithRetry();
      }
    } catch (dbError) {
      console.error('Errore durante la verifica della connessione:', dbError.message);
    }
  }
  
  // Invia risposta di errore al client
  res.status(500).json({ error: 'Errore interno del server' });
});

const startServer = async () => {
    try {
      await connectWithRetry();
      if (!isConnected) {
        console.error('❌ Database non disponibile. Arresto del server.');
        process.exit(1);
      }
      app.listen(PORT, () => console.log(`🚀 Server avviato su http://localhost:${PORT}`));
    } catch (err) {
      console.error('❌ Errore critico nel server:', err.message);
      process.exit(1);
    }
  };
  
  startServer();

// Gestione della chiusura graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM ricevuto, chiusura graceful del server');
  server.close(() => {
    console.log('Server chiuso');
  });
});

// Controllo periodico della connessione al database
setInterval(() => {
  if (!isConnected) {
    console.log('Connessione al database persa, tentativo di riconnessione...');
    connectWithRetry();
  } else {
    // Verifica attivamente che la connessione sia ancora valida
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) { // 1 = connesso
        console.log('Stato della connessione MongoDB non attivo, tentativo di riconnessione...');
        isConnected = false;
        connectWithRetry();
      } else {
        // Esegui un ping al database per verificare che la connessione sia realmente attiva
        mongoose.connection.db.admin().ping()
          .then(() => {
            // Connessione confermata attiva
            if (!isConnected) {
              console.log('Connessione al database ripristinata');
              isConnected = true;
            }
          })
          .catch(error => {
            console.error('Ping al database fallito:', error.message);
            isConnected = false;
            connectWithRetry();
          });
      }
    } catch (error) {
      console.error('Errore durante il controllo dello stato della connessione:', error.message);
      isConnected = false;
      connectWithRetry();
    }
  }
}, 10000); // Controlla ogni 10 secondi

// Gestione degli eventi di connessione MongoDB
mongoose = require('mongoose');
mongoose.connection.on('connected', () => {
  console.log('Mongoose connesso al database');
  isConnected = true;
  reconnectAttempts = 0;
});

mongoose.connection.on('error', (err) => {
  console.error('Errore nella connessione Mongoose:', err.message);
  isConnected = false;
  connectWithRetry();
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnesso dal database');
  isConnected = false;
  connectWithRetry();
});