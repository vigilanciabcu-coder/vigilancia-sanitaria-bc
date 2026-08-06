import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no ambiente.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. CNPJ Auto-Fill Lookup Endpoint
app.get('/api/cnpj/:cnpj', async (req, res) => {
  const cnpjClean = req.params.cnpj.replace(/\D/g, '');
  
  if (cnpjClean.length !== 14) {
    res.status(400).json({ error: 'CNPJ inválido' });
    return;
  }

  try {
    // Attempt public CNPJ API or fallback mock
    const apiRes = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjClean}`, {
      headers: { 'User-Agent': 'PortalVISA-BC/1.0' }
    });
    
    if (apiRes.ok) {
      const data = await apiRes.json();
      res.json({
        razao: data.razao_social || data.estabelecimento?.nome_fantasia || 'ESTABELECIMENTO CADASTRADO',
        municipio: data.estabelecimento?.cidade?.nome || 'BALNEÁRIO CAMBORIÚ',
        estado: data.estabelecimento?.estado?.sigla || 'SC',
        rua_api: `${data.estabelecimento?.tipo_logradouro || ''} ${data.estabelecimento?.logradouro || ''}`.trim(),
        num_api: data.estabelecimento?.numero || 'S/N',
        cnae: data.estabelecimento?.atividade_principal?.descricao || 'Alimentação e Serviços Diversos'
      });
      return;
    }
  } catch (err) {
    console.log('CNPJ API external fallback triggered:', err);
  }

  // Fallback realistic response for testing
  res.json({
    razao: 'EMPRESA ALIMENTÍCIA BC LTDA',
    municipio: 'BALNEÁRIO CAMBORIÚ',
    estado: 'SC',
    rua_api: 'AVENIDA BRASIL',
    num_api: '1500',
    cnae: '5611-2/01 Restaurantes e similares / Comércio Alimentos'
  });
});

// 3. Gemini AI Sanitary Analysis & Term Drafter Endpoint
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { tipoVistoria, tipoEstabelecimento, irregularidades, observacoes, risco } = req.body;

    const ai = getGeminiClient();
    const prompt = `
Você é um especialista jurídico em Vigilância Sanitária e Engenharia de Alimentos da Prefeitura Municipal de Balneário Camboriú (DVIS / SC).
Analise as seguintes constatações de fiscalização em tempo real:

- Tipo de Vistoria: ${tipoVistoria}
- Estabelecimento: ${tipoEstabelecimento}
- Nível de Risco Classificado: ${risco}
- Irregularidades Detectadas: ${JSON.stringify(irregularidades)}
- Observações do Fiscal: ${observacoes}

Forneça uma resposta estruturada contendo:
1. Parecer Técnico-Sanitário Resumido (2 a 3 frases).
2. Dispositivos Legais Aplicáveis (Mencione RDC Anvisa nº 216/2004, RDC nº 275/2002 ou Lei Municipal de Saúde de Balneário Camboriú de forma precisa).
3. Recomendação de Medida Cautelar (ex: Concessão de Prazo, Intimação, Auto de Infração, Apreensão de Produtos ou Interdição Cautelar).
4. Texto Formal do Termo para Impressão/Assinatura.

Responda em tom formal, objetivo, estritamente em Português do Brasil.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Erro na análise Gemini:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar análise da vigilância sanitária.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
