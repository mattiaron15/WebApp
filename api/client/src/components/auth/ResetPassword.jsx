import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { email, oldPassword, newPassword, confirmPassword } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    // Validazione lato client
    if (newPassword !== confirmPassword) {
      return setError('Le password non corrispondono');
    }

    if (newPassword.length < 6) {
      return setError('La nuova password deve essere di almeno 6 caratteri');
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, oldPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Errore durante il cambio password');
      }

      // Reset riuscito
      setSuccess('Password cambiata con successo!');
      setFormData({
        email: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-center mb-3">Cambio Password</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="oldPassword">Password Attuale</label>
          <div className="password-input-container">
            <input
              type={showOldPassword ? 'text' : 'password'}
              className="form-control"
              id="oldPassword"
              name="oldPassword"
              value={oldPassword}
              onChange={onChange}
              minLength="6"
              required
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? 'Nascondi' : 'Mostra'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">Nuova Password</label>
          <div className="password-input-container">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="form-control"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={onChange}
              minLength="6"
              required
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? 'Nascondi' : 'Mostra'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Conferma Nuova Password</label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? 'Elaborazione in corso...' : 'Cambia Password'}
        </button>
      </form>
      <p className="mt-3 text-center">
        <Link to="/login">Torna al login</Link>
      </p>
    </div>
  );
};

export default ResetPassword;