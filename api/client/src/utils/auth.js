// Utility per gestire l'autenticazione

// Salva la funzione fetch originale all'avvio dell'applicazione
if (!window.fetchOriginal) {
  window.fetchOriginal = window.fetch;
}

// Imposta il token di autenticazione nell'header delle richieste
export const setAuthToken = (token) => {
  if (token) {
    // Se il token esiste, lo aggiungiamo all'header di tutte le richieste
    window.localStorage.setItem('token', token);
    // Imposta il token come header predefinito per fetch
    window.fetch = async (url, options = {}) => {
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          'x-auth-token': token
        }
      };
      return window.fetchOriginal(url, newOptions);
    };
  } else {
    // Se il token non esiste, lo rimuoviamo dall'header
    window.localStorage.removeItem('token');
    // Ripristina la funzione fetch originale
    window.fetch = window.fetchOriginal;
  }
};

// Verifica se l'utente è autenticato
export const isAuthenticated = () => {
  return localStorage.getItem('token') ? true : false;
};

// Ottieni il token dall'localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};