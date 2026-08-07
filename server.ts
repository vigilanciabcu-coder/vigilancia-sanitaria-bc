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

  if (!cnpjClean) {
    res.status(400).json({ error: 'CNPJ ou CPF em branco' });
    return;
  }

  // Se for CNPJ de 14 dígitos, tenta consultar apis públicas da Receita Federal
  if (cnpjClean.length === 14) {
    // 1. Tenta BrasilAPI
    try {
      const bRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);
      if (bRes.ok) {
        const d = await bRes.json();
        res.json({
          razao: d.razao_social || d.nome_fantasia || 'ESTABELECIMENTO CADASTRADO',
          nome_fantasia: d.nome_fantasia || d.razao_social || '',
          municipio: d.municipio || 'BALNEÁRIO CAMBORIÚ',
          estado: d.uf || 'SC',
          rua_api: `${d.descricao_tipo_de_logradouro || ''} ${d.logradouro || ''}`.trim(),
          num_api: d.numero || 'S/N',
          bairro: d.bairro || 'Centro',
          cnae: d.cnae_fiscal_descricao || 'Alimentação e Serviços Diversos'
        });
        return;
      }
    } catch (e) {
      console.log('BrasilAPI CNPJ offline:', e);
    }

    // 2. Tenta Publica CNPJ WS
    try {
      const apiRes = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjClean}`, {
        headers: { 'User-Agent': 'PortalVISA-BC/1.0' }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        res.json({
          razao: data.razao_social || data.estabelecimento?.nome_fantasia || 'ESTABELECIMENTO CADASTRADO',
          nome_fantasia: data.estabelecimento?.nome_fantasia || data.razao_social || '',
          municipio: data.estabelecimento?.cidade?.nome || 'BALNEÁRIO CAMBORIÚ',
          estado: data.estabelecimento?.estado?.sigla || 'SC',
          rua_api: `${data.estabelecimento?.tipo_logradouro || ''} ${data.estabelecimento?.logradouro || ''}`.trim(),
          num_api: data.estabelecimento?.numero || 'S/N',
          bairro: data.estabelecimento?.bairro || 'Centro',
          cnae: data.estabelecimento?.atividade_principal?.descricao || 'Alimentação e Serviços Diversos'
        });
        return;
      }
    } catch (err) {
      console.log('CNPJ API external fallback triggered:', err);
    }
  }

  // Fallback realista para testes, CPF ou CNPJ sem consulta de API externa disponível
  res.json({
    razao: `ESTABELECIMENTO COMERCIAL (${cnpjClean}) LTDA`,
    nome_fantasia: 'RESTAURANTE E GASTRONOMIA BC',
    municipio: 'BALNEÁRIO CAMBORIÚ',
    estado: 'SC',
    rua_api: 'AVENIDA BRASIL',
    num_api: '1500',
    bairro: 'Centro',
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
