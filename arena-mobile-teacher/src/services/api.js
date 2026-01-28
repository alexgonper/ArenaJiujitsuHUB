import axios from 'axios';

// LOCAL IP DETECTED: 192.168.1.131
// Use this URL to test on your physical device connected to the same Wi-Fi
const LOCAL_URL = 'http://192.168.1.131:5000/api/v1'; 

const PROD_URL = 'https://arenajiujitsuhub-2.onrender.com/api/v1';

const api = axios.create({
  // Switched to LOCAL_URL for testing
  baseURL: LOCAL_URL, 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  }
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
