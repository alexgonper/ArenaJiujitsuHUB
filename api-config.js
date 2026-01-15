const API_URL_DYN = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api/v1' 
    : 'https://arenajiujitsuhub-2.onrender.com/api/v1';

window.API_URL = API_URL_DYN;
window.API_BASE_URL = API_URL_DYN;
