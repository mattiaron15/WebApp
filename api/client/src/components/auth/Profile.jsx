import React, { useState, useEffect } from 'react';
import { getToken } from '../../utils/auth';

const Profile = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Se non abbiamo già i dati dell'utente, li recuperiamo
    if (!initialUser) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const token = getToken();
          
          const response = await fetch('/api/auth/me', {
            headers: {
              'x-auth-token': token
            }
          });

          if (!response.ok) {
            throw new Error('Impossibile recuperare i dati dell\'utente');
          }

          const userData = await response.json();
          setUser(userData);
          setError(null);
        } catch (err) {
          console.error('Errore durante il recupero dei dati dell\'utente:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [initialUser]);

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-center mb-3">Profilo Utente</h2>
        <p className="text-center">Caricamento dati in corso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-center mb-3">Profilo Utente</h2>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-center mb-3">Profilo Utente</h2>
      {user && (
        <div>
          <p><strong>ID:</strong> {user.id || user._id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Data di registrazione:</strong> {new Date(user.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;