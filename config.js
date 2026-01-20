// ===== FIREBASE CONFIGURATION =====
// Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ===== APP CONFIGURATION =====
const appConfig = {
    appId: 'arena-matrix-v4-mobile',
    apiBaseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api/v1' 
        : 'https://arenajiujitsuhub-2.onrender.com/api/v1', // Backend API URL
    enableFirebase: false, // Set to true when Firebase is configured
    useMockData: false // Use real API instead of mock data
};

// ===== GEMINI AI CONFIGURATION =====
const geminiConfig = {
    apiKey: "", // NUNCA COLOQUE SUA CHAVE AQUI. Use o arquivo .env no servidor.
    modelName: "gemini-2.0-flash",
    imageModel: "imagen-3.0-generate-001"
};

// ===== ARENA PERSONA PROMPT =====
const ARENA_PERSONA_PROMPT = "Athletic instructor with neat beard, white Arena Jiu-Jitsu kimono with orange accents and patches, black belt. High-end athletic aesthetic.";

// Export configurations (for module usage)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        appConfig,
        geminiConfig,
        ARENA_PERSONA_PROMPT
    };
}
