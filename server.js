import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
const app = express();
const port = 3000;

// Middleware para o Express conseguir ler JSON vindo no corpo (body) dos pedidos
app.use(express.json());

// Configure CORS to allow requests from your frontend
app.use(cors({
    origin: 'http://localhost:5173' // Adjust this to your frontend's actual origin
}));

// 1. Criar a rota (endpoint) que "ouve" por pedidos POST em /login
// Tem de ser o mesmo URL que usámos no fetch() do lado do cliente
app.post('/login', (req, res) => {
    
    // 2. Os dados enviados pelo cliente chegam em 'req.body'
    const { email, password } = req.body;

    console.log('Recebido pedido de login:');
    console.log('Email:', email);
    console.log('Password:', password);

    // 3. Lógica de Autenticação (Aqui é onde você verificaria na base de dados)
    // *** Este é apenas um exemplo simples - NUNCA faça isto em produção! ***
    if (email === 'user@exemplo.com' && password === 'senha123') {
        
        // 4. Enviar uma resposta de SUCESSO
        // O cliente (app-cliente.js) receberá este JSON
        res.status(200).json({ 
            success: true, 
            message: 'Login realizado com sucesso!' 
        });

    } else {
        
        // 5. Enviar uma resposta de ERRO
        res.status(401).json({ // 401 = Unauthorized
            success: false, 
            message: 'Email ou password inválidos.' 
        });
    }
});

// Initialize Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/gemini-parse', async (req, res) => {
    console.log('[/gemini-parse] Endpoint hit.');
    const { text } = req.body;

    if (!text) {
        console.log('[/gemini-parse] No text provided.');
        return res.status(400).json({ error: 'No text provided' });
    }

    console.log('[/gemini-parse] Received text:', text);

    try {
        console.log('[/gemini-parse] Calling Gemini API...');
        const model = genAI.getGenerativeModel({ model: "models/gemini-pro-latest" });

        const prompt = `Analyze the following text and extract transaction details. Return a JSON object with 'type' (either 'expense' or 'income'), 'amount' (number), and 'description' (string, representing the main item or activity, concise, without prepositions, articles, or unnecessary context). If the type cannot be determined, default to 'expense'. If amount cannot be determined, default to 0. If description cannot be determined, use 'Uncategorized'.

Example 1: "Gastei 25 euros em jantar no restaurante X"
Output 1: {"type": "expense", "amount": 25, "description": "jantar"}

Example 2: "Recebi 1200 do meu salário"
Output 2: {"type": "income", "amount": 1200, "description": "salário"}

Example 3: "Comprei um café por 2.50"
Output 3: {"type": "expense", "amount": 2.50, "description": "café"}

Example 4: "Ganhei 50 vendendo um livro"
Output 4: {"type": "income", "amount": 50, "description": "livro"}

Example 5: "Gastei 5 euros num gelado"
Output 5: {"type": "expense", "amount": 5, "description": "gelado"}

Text: "${text}"
Output:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const geminiText = response.text();

        // Attempt to parse the JSON from Gemini's response
        let parsedTransaction;
        try {
            parsedTransaction = JSON.parse(geminiText);
        } catch (jsonError) {
            console.error('Failed to parse Gemini JSON response:', geminiText, jsonError);
            // Fallback if Gemini doesn't return perfect JSON
            const amountMatch = geminiText.match(/\d+(\.\d+)?/);
            const extractedAmount = amountMatch ? parseFloat(amountMatch[0]) : 0;
            const extractedDescription = geminiText.replace(/\b(expense|income|for|from|em|no|na|num|numas|a|o|os|as|um|uma|uns|umas|de|do|da|dos|das|com|por|para|ao|à|aos|às)\b/gi, '').replace(/\d+(\.\d+)?/g, '').trim() || 'Uncategorized';

            parsedTransaction = {
                type: geminiText.toLowerCase().includes('income') ? 'income' : 'expense',
                amount: extractedAmount,
                description: extractedDescription
            };
        }

        res.json(parsedTransaction);

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to process text with Gemini' });
    }
});

app.listen(port, () => {
    console.log(`Servidor a correr em http://localhost:${port}`);
});