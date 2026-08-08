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

// 2. CNPJ / CPF Auto-Fill Lookup Endpoint
app.get('/api/cnpj/:cnpj', async (req, res) => {
  const cleanVal = req.params.cnpj.replace(/\D/g, '');

  if (!cleanVal) {
    res.status(400).json({ error: 'CNPJ ou CPF em branco' });
    return;
  }

  // Dictionary of known local establishments for instant response
  const knownDict: Record<string, any> = {
    '28910221000140': {
      razao: 'RESTAURANTE SOL & MAR LTDA - ME',
      nome_fantasia: 'QUIOSQUE 12 - SOL & MAR',
      municipio: 'BALNEÁRIO CAMBORIÚ',
      estado: 'SC',
      rua_api: 'AVENIDA ATLÂNTICA',
      num_api: '1500',
      bairro: 'Centro',
      cnae: '5611-2/01 Restaurantes e similares / Serviços de Alimentação',
      responsavel: 'MARIA DA SILVA SANTOS',
      telefone: '(47) 99123-4567',
      tipo_atividade: 'Restaurante / Alimentação',
      risco: 'MÉDIO'
    },
    '34567890000112': {
      razao: 'J. B. SANTOS ALIMENTOS ME',
      nome_fantasia: 'PASTELARIA ARTESANAL DO JOÃO',
      municipio: 'BALNEÁRIO CAMBORIÚ',
      estado: 'SC',
      rua_api: 'PRAÇA DA BÍBLIA',
      num_api: 'S/N',
      bairro: 'Centro',
      cnae: '5611-2/03 Lanchonetes, casas de chá, de sucos e similares',
      responsavel: 'JOÃO BATISTA DOS SANTOS',
      telefone: '(47) 98877-6655',
      tipo_atividade: 'Feira Livre / Ambulante',
      risco: 'BAIXO'
    },
    '12345678000199': {
      razao: 'SUPERMERCADO E AÇOUGUE CENTRAL BC LTDA',
      nome_fantasia: 'MERCADO CENTRAL BC',
      municipio: 'BALNEÁRIO CAMBORIÚ',
      estado: 'SC',
      rua_api: 'AVENIDA BRASIL',
      num_api: '2200',
      bairro: 'Centro',
      cnae: '4712-1/00 Comércio varejista de mercadorias em geral',
      responsavel: 'PEDRO HENRIQUE OLIVEIRA',
      telefone: '(47) 3367-1000',
      tipo_atividade: 'Supermercado / Açougue',
      risco: 'ALTO'
    },
    '10203040000150': {
      razao: 'HOTELaria E TURISMO BEIRA MAR BC LTDA',
      nome_fantasia: 'HOTEL BEIRA MAR BC',
      municipio: 'BALNEÁRIO CAMBORIÚ',
      estado: 'SC',
      rua_api: 'RUA 1500',
      num_api: '350',
      bairro: 'Centro',
      cnae: '5510-8/01 Hotéis e similares',
      responsavel: 'ANA PAULA MENDES',
      telefone: '(47) 3361-2020',
      tipo_atividade: 'Hotel / Pousada',
      risco: 'MÉDIO'
    },
    '63691709000109': {
      razao: 'NOSSA PADARIA LTDA',
      nome_fantasia: 'NOSSA PADARIA',
      municipio: 'BALNEÁRIO CAMBORIÚ',
      estado: 'SC',
      rua_api: 'AVENIDA PALESTINA',
      num_api: '870',
      bairro: 'Nações',
      cnae: '1091-1/02 Fabricação de produtos de padaria e confeitaria',
      responsavel: 'SAMUEL SILVEIRA RAMOS',
      telefone: '(47) 3360-0741',
      tipo_atividade: 'Lanchonete / Fast Food',
      risco: 'BAIXO'
    }
  };

  if (knownDict[cleanVal]) {
    res.json(knownDict[cleanVal]);
    return;
  }

  // Helpers for activity classification
  const classifyActivity = (desc: string) => {
    const d = (desc || '').toLowerCase();
    if (d.includes('açougue') || d.includes('carnes') || d.includes('supermercado') || d.includes('varejista')) {
      return { tipo: 'Supermercado / Açougue', risco: 'ALTO' };
    }
    if (d.includes('farmacia') || d.includes('drogaria') || d.includes('medicamento')) {
      return { tipo: 'Drogaria / Farmácia', risco: 'ALTO' };
    }
    if (d.includes('hotel') || d.includes('pousada') || d.includes('albergue')) {
      return { tipo: 'Hotel / Pousada', risco: 'MÉDIO' };
    }
    if (d.includes('estetica') || d.includes('salao') || d.includes('cabeleireiro')) {
      return { tipo: 'Estética / Salão', risco: 'MÉDIO' };
    }
    if (d.includes('lanchonete') || d.includes('pastel') || d.includes('suco') || d.includes('padaria') || d.includes('confeitaria') || d.includes('panificadora')) {
      return { tipo: 'Lanchonete / Fast Food', risco: 'BAIXO' };
    }
    return { tipo: 'Restaurante / Alimentação', risco: 'MÉDIO' };
  };

  // Se for CNPJ de 14 dígitos, tenta consultar APIs da Receita Federal com timeout rápido (2.5s)
  if (cleanVal.length === 14) {
    const reqHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    };

    // 1. MinhaReceita (Rápida e sem bloqueio/rate-limit)
    try {
      const mRes = await fetch(`https://minhareceita.org/${cleanVal}`, {
        headers: reqHeaders,
        signal: AbortSignal.timeout(2500)
      });
      if (mRes.ok) {
        const d = await mRes.json();
        const cnaeDesc = d.cnae_fiscal_descricao || 'Alimentação e Serviços';
        const { tipo, risco } = classifyActivity(cnaeDesc);
        const rua = `${d.descricao_tipo_de_logradouro || ''} ${d.logradouro || ''}`.trim() || 'AVENIDA BRASIL';
        res.json({
          razao: d.razao_social || d.nome_fantasia || 'ESTABELECIMENTO CADASTRADO',
          nome_fantasia: d.nome_fantasia || d.razao_social || 'ESTABELECIMENTO BC',
          municipio: d.municipio || 'BALNEÁRIO CAMBORIÚ',
          estado: d.uf || 'SC',
          rua_api: rua,
          num_api: d.numero || '100',
          bairro: d.bairro || 'Centro',
          cnae: cnaeDesc,
          responsavel: d.qsa?.[0]?.nome_socio || 'RESPONSÁVEL CADASTRADO',
          telefone: d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0, 2)}) ${d.ddd_telefone_1.slice(2)}` : '(47) 3367-0000',
          tipo_atividade: tipo,
          risco
        });
        return;
      }
    } catch (e) {
      console.log('MinhaReceita fallback:', e);
    }

    // 2. BrasilAPI
    try {
      const bRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanVal}`, {
        headers: reqHeaders,
        signal: AbortSignal.timeout(2500)
      });
      if (bRes.ok) {
        const d = await bRes.json();
        const cnaeDesc = d.cnae_fiscal_descricao || 'Alimentação e Serviços Diversos';
        const { tipo, risco } = classifyActivity(cnaeDesc);

        res.json({
          razao: d.razao_social || d.nome_fantasia || 'ESTABELECIMENTO CADASTRADO',
          nome_fantasia: d.nome_fantasia || d.razao_social || 'ESTABELECIMENTO BC',
          municipio: d.municipio || 'BALNEÁRIO CAMBORIÚ',
          estado: d.uf || 'SC',
          rua_api: `${d.descricao_tipo_de_logradouro || ''} ${d.logradouro || ''}`.trim() || 'AVENIDA BRASIL',
          num_api: d.numero || '100',
          bairro: d.bairro || 'Centro',
          cnae: cnaeDesc,
          responsavel: d.qsa?.[0]?.nome_socio || d.qsa?.[0]?.nome || 'RESPONSÁVEL TÉCNICO',
          telefone: d.ddd_telefone_1 ? `(${d.ddd_telefone_1.slice(0, 2)}) ${d.ddd_telefone_1.slice(2)}` : '(47) 3367-0000',
          tipo_atividade: tipo,
          risco
        });
        return;
      }
    } catch (e) {
      console.log('BrasilAPI fallback:', e);
    }

    // 3. ReceitaWS
    try {
      const rRes = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanVal}`, {
        headers: reqHeaders,
        signal: AbortSignal.timeout(2500)
      });
      if (rRes.ok) {
        const d = await rRes.json();
        if (d.status !== 'ERROR') {
          const cnaeDesc = d.atividade_principal?.[0]?.text || 'Alimentação e Serviços';
          const { tipo, risco } = classifyActivity(cnaeDesc);
          res.json({
            razao: d.nome || d.fantasia || 'ESTABELECIMENTO CADASTRADO',
            nome_fantasia: d.fantasia || d.nome || 'ESTABELECIMENTO BC',
            municipio: d.municipio || 'BALNEÁRIO CAMBORIÚ',
            estado: d.uf || 'SC',
            rua_api: d.logradouro || 'AVENIDA BRASIL',
            num_api: d.numero || '100',
            bairro: d.bairro || 'Centro',
            cnae: cnaeDesc,
            responsavel: d.qsa?.[0]?.nome || 'RESPONSÁVEL TÉCNICO',
            telefone: d.telefone || '(47) 3367-0000',
            tipo_atividade: tipo,
            risco
          });
          return;
        }
      }
    } catch (e) {
      console.log('ReceitaWS fallback:', e);
    }
  }

  // Fallback rápido e garantido se a API externa demorar ou para CPF (11 dígitos)
  const isCpf = cleanVal.length === 11;
  res.json({
    razao: isCpf ? 'PESSOA FÍSICA CADASTRADA - VISA BC' : `ESTABELECIMENTO (${cleanVal}) LTDA`,
    nome_fantasia: isCpf ? 'ESTABELECIMENTO / AMBULANTE BC' : 'RESTAURANTE E GASTRONOMIA BC',
    municipio: 'BALNEÁRIO CAMBORIÚ',
    estado: 'SC',
    rua_api: 'AVENIDA BRASIL',
    num_api: '1500',
    bairro: 'Centro',
    cnae: '5611-2/01 Restaurantes e similares / Alimentação',
    responsavel: isCpf ? 'PROPRIETÁRIO CADASTRADO' : 'GERENTE RESPONSÁVEL',
    telefone: '(47) 3367-0000',
    tipo_atividade: 'Restaurante / Alimentação',
    risco: 'MÉDIO'
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
