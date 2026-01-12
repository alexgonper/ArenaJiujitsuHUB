const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCCk6fcfIKolUiwuxXNgChe5Pa6d-_iDVc';
// Using gemini-2.5-flash as standard
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// MODO DE TESTES: Mude para false para habilitar a IA real
const MOCK_MODE = false;

const MOCK_RESPONSES = {
    overview: {
        insights: [
            { id: "1", type: "positive", text: "<strong>Faturamento em Alta:</strong> Sua unidade cresceu 12% em relação ao mês passado." },
            { id: "2", type: "warning", text: "<strong>Retenção:</strong> Identificamos 5 alunos com frequência irregular nesta semana." },
            { id: "3", type: "info", text: "<strong>Oportunidade:</strong> O ticket médio está 5% abaixo da meta regional." }
        ]
    },
    marketing: "<h3>Plano de Marketing (MOCK)</h3><p>Este é um plano de marketing simulado para testes. Aumente sua presença nas redes sociais focando em Reels de treinos técnicos.</p>",
    swot: "<h3>Análise SWOT (MOCK)</h3><ul><li><strong>Força:</strong> Localização privilegiada.</li><li><strong>Fraqueza:</strong> Poucas turmas matinais.</li></ul>",
    default: "O serviço de IA está em <strong>Modo de Testes</strong> para economizar tokens. O componente de interface está funcionando corretamente."
};

exports.generateContent = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        console.log("AI Request (MOCK_MODE: " + MOCK_MODE + ")");

        if (MOCK_MODE) {
            let mockData = MOCK_RESPONSES.default;

            // Tenta identificar o tipo de prompt para dar uma resposta mais realista
            if (prompt.toLowerCase().includes('json') && prompt.toLowerCase().includes('insights')) {
                mockData = JSON.stringify(MOCK_RESPONSES.overview);
            } else if (prompt.toLowerCase().includes('marketing')) {
                mockData = MOCK_RESPONSES.marketing;
            } else if (prompt.toLowerCase().includes('swot')) {
                mockData = MOCK_RESPONSES.swot;
            }

            // Simulando um pequeno delay de rede para o teste ficar realista
            await new Promise(resolve => setTimeout(resolve, 800));

            return res.status(200).json({
                success: true,
                data: mockData
            });
        }

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API Error:', JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message || 'Gemini API Error');
        }

        if (!data.candidates || !data.candidates[0].content) {
            console.error('Gemini Unexpected Response:', JSON.stringify(data, null, 2));
            throw new Error('No candidates returned from AI');
        }

        const textResponse = data.candidates[0].content.parts[0].text;

        res.status(200).json({
            success: true,
            data: textResponse
        });

    } catch (error) {
        console.error('AI Controller Final Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
