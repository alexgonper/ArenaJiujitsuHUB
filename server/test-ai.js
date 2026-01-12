const GEMINI_API_KEY = 'AIzaSyCCk6fcfIKolUiwuxXNgChe5Pa6d-_iDVc';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

async function test() {
    try {
        const response = await fetch(GEMINI_URL);
        const data = await response.json();
        console.log("Models:", JSON.stringify(data, null, 2));
    } catch (e) {

        console.error(e);
    }
}
test();
