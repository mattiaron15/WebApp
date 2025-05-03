const mongoose = require('mongoose');

// URI predefinito se non è disponibile nelle variabili d'ambiente
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth-api';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,  // Aumentato il timeout a 10 secondi
      heartbeatFrequencyMS: 5000,      // Controlla la connessione ogni 5 secondi
      socketTimeoutMS: 45000,          // Timeout socket aumentato
      family: 4,                       // Forza IPv4
      maxPoolSize: 10,                 // Limita il numero di connessioni nel pool
      autoIndex: false,                // Disabilita la creazione automatica degli indici in produzione
      retryWrites: true,               // Riprova le operazioni di scrittura fallite
      connectTimeoutMS: 10000          // Timeout di connessione aumentato
    });
    
    // Verifica che conn.connection.host esista prima di usarlo
    const host = conn?.connection?.host || 'localhost';
    console.log(`MongoDB Connesso: ${host}`);
    return conn;
  } catch (error) {
    console.error(`Errore di connessione MongoDB: ${error.message}`);
    // Non terminiamo più il processo, ma propaghiamo l'errore
    throw error;
  }
};

module.exports = connectDB;

// Gestione degli eventi di connessione MongoDB
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connesso al database');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Errore nella connessione MongoDB:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnesso dal database');
});