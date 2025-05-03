import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="card">
      <h1 className="text-center mb-3">Test API di Autenticazione</h1>
      <p className="mb-3">
        Questa applicazione è stata creata per testare le funzionalità dell'API di autenticazione.
        Puoi registrarti, effettuare il login e visualizzare il tuo profilo.
      </p>
      <p className="mb-3">
        Inoltre, puoi verificare lo stato dell'API e testare le varie funzionalità disponibili.
      </p>
      <div className="text-center mt-3">
        <Link to="/register" className="btn mr-2">Registrati</Link>{' '}
        <Link to="/login" className="btn">Login</Link>{' '}
        <Link to="/api-status" className="btn">Verifica Stato API</Link>
      </div>
    </div>
  );
};

export default Home;