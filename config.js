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
    enableFirebase: false, // Set to true when Firebase is configured
    useMockData: true // Use mock data instead of Firebase
};

// ===== GEMINI AI CONFIGURATION =====
const geminiConfig = {
    apiKey: "", // NUNCA COLOQUE SUA CHAVE AQUI. Use o arquivo .env no servidor.
    modelName: "gemini-2.0-flash",
    imageModel: "imagen-3.0-generate-001"
};

// ===== ARENA PERSONA PROMPT =====
const ARENA_PERSONA_PROMPT = "Athletic instructor with neat beard, white Arena Jiu-Jitsu kimono with orange accents and patches, black belt. High-end athletic aesthetic.";

// ===== MOCK DATA =====
const mockFranchises = [
    {
        id: "1",
        name: "Arena Papanduva",
        owner: "Prof. Anderson Morais BigBoy",
        address: "Rua Juscelino K. de Oliveira, s/n, Centro, Papanduva - SC",
        phone: "42 999526407",
        students: 78,
        revenue: 10200,
        expenses: 4500,
        lat: -26.5684,
        lng: -50.1444
    },
    {
        id: "2",
        name: "Arena São Francisco do Sul",
        owner: "Prof. David Maldonado / Lucas Maldonado",
        address: "Av. Inácio Espíndola 550 - Praia Grande, São Francisco do Sul - SC",
        phone: "47 996164179",
        students: 92,
        revenue: 12500,
        expenses: 5800,
        lat: -26.2425,
        lng: -48.6381
    },
    {
        id: "3",
        name: "Arena Guaratuba",
        owner: "Prof. Alexandre Vieira",
        address: "Av. Ivaí, 99 - Guaratuba - PR",
        phone: "41 999402641",
        students: 84,
        revenue: 11000,
        expenses: 4200,
        lat: -25.8828,
        lng: -48.5747
    },
    {
        id: "4",
        name: "Arena Cascais",
        owner: "Prof. Julio Amodio",
        address: "Cascais, Portugal",
        phone: "+351 910554339",
        students: 65,
        revenue: 7500,
        expenses: 3200,
        lat: 38.6971,
        lng: -9.4223
    },
    {
        id: "5",
        name: "Arena México",
        owner: "Hélio Carcereri",
        address: "Culiacán, México",
        phone: "+52 000000",
        students: 145,
        revenue: 19000,
        expenses: 9500,
        lat: 24.8091,
        lng: -107.3940
    }
];

// Export configurations (for module usage)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        appConfig,
        geminiConfig,
        ARENA_PERSONA_PROMPT,
        mockFranchises
    };
}
