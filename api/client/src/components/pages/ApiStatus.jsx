import React, { useState, useEffect } from 'react';

const ApiStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkApiStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Errore durante la verifica dello stato dell\'API:', err);
      setError('Impossibile connettersi all\'API. Verifica che il server sia in esecuzione.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    // Aggiorna lo stato ogni 30 secondi
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="card">
        <h2 className="text-center mb-3">Verifica Stato API</h2>
        <p className="text-center">Caricamento in corso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-center mb-3">Verifica Stato API</h2>
        <div className="alert alert-danger">{error}</div>
        <p>Assicurati che il server API sia in esecuzione su http://localhost:8080</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-center mb-3">Verifica Stato API</h2>
      {status && (
        <div>
          <p><strong>Stato:</strong> {status.status === 'UP' ? 'Attivo' : 'Non attivo'}</p>
          <p><strong>Database connesso:</strong> {status.dbConnected ? 'Sì' : 'No'}</p>
          <p><strong>Uptime:</strong> {Math.floor(status.uptime / 60)} minuti</p>
          <p><strong>Timestamp:</strong> {new Date(status.timestamp).toLocaleString()}</p>
        </div>
      )}
      <div className="mt-3">
        <button className="btn" onClick={checkApiStatus}>Aggiorna</button>
      </div>
    </div>
  );
};

export default ApiStatus;