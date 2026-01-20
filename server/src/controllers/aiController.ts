import { Request, Response } from 'express';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

const MOCK_MODE = false;

const MOCK_RESPONSES: any = {
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

/**
 * Clean markdown and extra text from AI response
 */
function cleanAiResponse(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let cleaned = text
        .replace(/```json\n?/gi, '')
        .replace(/```html\n?/gi, '')
        .replace(/```markdown\n?/gi, '')
        .replace(/```text\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

    if (cleaned.includes('{') && cleaned.includes('}')) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            cleaned = cleaned.substring(start, end + 1);
        }
    }

    return cleaned;
}

export const generateContent = async (req: Request, res: Response) => {
    try {
        const { prompt, systemInstruction } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        console.log("AI Request (MOCK_MODE: " + MOCK_MODE + ")");

        if (MOCK_MODE) {
            let mockData = MOCK_RESPONSES.default;

            if (prompt.toLowerCase().includes('json') && prompt.toLowerCase().includes('insights')) {
                mockData = JSON.stringify({
                    cfo: "Análise financeira (MOCK). O faturamento está estável.",
                    coo: "Análise operacional (MOCK). A retenção é de 95%.",
                    cmo: "Plano de marketing (MOCK). Foque em tráfego pago."
                });
            }

            await new Promise(resolve => setTimeout(resolve, 800));

            return res.status(200).json({
                success: true,
                data: mockData
            });
        }

        const requestBody: any = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data: any = await response.json();

        if (data.error) {
            console.error('Gemini API Error:', JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message || 'Gemini API Error');
        }

        if (!data.candidates || !data.candidates[0].content) {
            console.error('Gemini Unexpected Response:', JSON.stringify(data, null, 2));
            throw new Error('No candidates returned from AI');
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const textResponse = cleanAiResponse(rawText);

        res.status(200).json({
            success: true,
            data: textResponse
        });

    } catch (error: any) {
        console.error('AI Controller Final Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const generateImage = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        if (MOCK_MODE) {
            const mockImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TUFSS0VUSU5HIFZJU1VBTCBNT0NLPC90ZXh0Pjwvc3ZnPg==";
            return res.status(200).json({
                success: true,
                data: mockImage
            });
        }

        const response = await fetch(IMAGEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1 }
            })
        });

        const data: any = await response.json();

        if (data.error) {
            console.error('Imagen API Error:', JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message || 'Imagen API Error');
        }

        if (!data.predictions || !data.predictions[0].bytesBase64Encoded) {
            console.error('Imagen Unexpected Response:', JSON.stringify(data, null, 2));
            throw new Error('No image generated');
        }

        const imageBase64 = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;

        res.status(200).json({
            success: true,
            data: imageBase64
        });

    } catch (error: any) {
        console.error('Image Generation Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
