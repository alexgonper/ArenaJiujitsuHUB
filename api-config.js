const getDynApiUrl = () => {
    const hostname = window.location.hostname;
    const isLocal = (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.') ||
        hostname.endsWith('.local')
    );

    if (isLocal) {
        // If we are accessing via IP, use that same IP for the API
        return `http://${hostname}:5000/api/v1`;
    }
    return 'https://arenajiujitsuhub-2.onrender.com/api/v1';
};

const API_URL_DYN = getDynApiUrl();

window.API_URL = API_URL_DYN;
window.API_BASE_URL = API_URL_DYN;
