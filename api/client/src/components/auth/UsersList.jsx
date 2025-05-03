import React, { useState, useEffect } from 'react';
import { setAuthToken } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Assicurati che il token sia impostato per le richieste autenticate
        const token = localStorage.getItem('token');
        if (token) {
          setAuthToken(token);
        }

        const response = await fetch('/api/auth/users');
        
        if (!response.ok) {
          if (response.status === 403) {
            // Accesso negato: l'utente non è un amministratore
            navigate('/profile');
            return;
          }
          throw new Error(`Errore: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // Funzione per cambiare lo stato admin di un utente
  const toggleAdminStatus = async (userId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/auth/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore: ${response.status}`);
      }

      const updatedUser = await response.json();
      
      // Aggiorna la lista degli utenti con l'utente modificato
      setUsers(users.map(user => 
        user._id === updatedUser._id ? updatedUser : user
      ));
      
      setActionLoading(false);
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container mt-5">Caricamento utenti...</div>;
  
  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-danger" role="alert">
        Errore nel caricamento degli utenti: {error}
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Utenti Registrati</h2>
      {users.length === 0 ? (
        <p>Nessun utente registrato.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Data di registrazione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.isAdmin ? 'bg-success' : 'bg-secondary'}`}>
                      {user.isAdmin ? 'Sì' : 'No'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleString('it-IT')}</td>
                  <td>
                    <button 
                      className={`btn btn-sm ${user.isAdmin ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleAdminStatus(user._id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        user.isAdmin ? 'Rimuovi Admin' : 'Rendi Admin'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersList;