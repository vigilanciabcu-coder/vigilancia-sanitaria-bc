import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, EscalaItem, FeiranteItem, RecadoMural, FiscalizacaoItem } from '../types';

// Status helper
export function checkSupabaseStatus() {
  return {
    configured: isSupabaseConfigured,
    url: import.meta.env.VITE_SUPABASE_URL || 'Não configurado'
  };
}

// ==========================================
// 1. OPERADORES / PERMISSÕES (CADASTRO E EDIÇÃO)
// ==========================================

export async function fetchOperadoresFromSupabase(): Promise<UserProfile[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('operadores')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) {
      console.warn('Supabase [operadores] retorno:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        email: item.email || '',
        nome_completo: item.nome_completo || '',
        data_nascimento: item.data_nascimento || '',
        cargo: item.cargo || 'FISCAL',
        matricula: item.matricula || '',
        senha: item.senha || '123456'
      }));
    }
  } catch (err) {
    console.warn('Erro ao conectar ao Supabase:', err);
  }
  return null;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function saveOperadorToSupabase(user: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    let validId = user.id;
    // Se não for UUID válido de 36 caracteres, tenta criar um UUID válido
    if (!validId || validId.length < 30 || validId.startsWith('u')) {
      validId = generateUUID();
    }

    const payload = {
      id: validId,
      email: user.email,
      nome_completo: user.nome_completo,
      data_nascimento: user.data_nascimento || '1990-01-01',
      cargo: user.cargo,
      matricula: user.matricula || '',
      senha: user.senha || '123456'
    };

    const { error } = await supabase.from('operadores').upsert(payload, { onConflict: 'email' });

    if (error) {
      console.warn('Upsert por email falhou no Supabase:', error.message, 'Tentando por id...');
      const { error: idErr } = await supabase.from('operadores').upsert(payload, { onConflict: 'id' });
      if (idErr) {
        console.error('Erro ao salvar operador no Supabase:', idErr.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar operador no Supabase:', err);
    return false;
  }
}

export async function deleteOperadorFromSupabase(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('operadores').delete().eq('id', userId);
    if (error) {
      console.error('Erro ao deletar operador no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao deletar operador no Supabase:', err);
    return false;
  }
}

// Inicializar banco com lista padrão se estiver vazio
export async function seedInitialOperadoresIfEmpty(initialUsers: UserProfile[]) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data } = await supabase.from('operadores').select('id').limit(1);
    if (!data || data.length === 0) {
      console.log('Populando tabela operadores no Supabase...');
      for (const u of initialUsers) {
        await saveOperadorToSupabase(u);
      }
    }
  } catch (e) {
    console.warn('Semeação de operadores ignorada:', e);
  }
}

// ==========================================
// 2. FISCALIZAÇÕES (REGISTRO E TEMPO REAL)
// ==========================================

export async function fetchFiscalizacoesFromSupabase(): Promise<FiscalizacaoItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('fiscalizacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase [fiscalizacoes] retorno:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id || generateUUID(),
        protocolo: item.protocolo || '',
        dataHora: item.data_hora || item.dataHora || new Date().toISOString(),
        fiscalId: item.fiscal_id || item.fiscalId || '',
        fiscalNome: item.fiscal_nome || item.fiscalNome || 'Fiscal Sanitário',
        estabelecimento: typeof item.estabelecimento === 'string' ? JSON.parse(item.estabelecimento) : (item.estabelecimento || {
          nomeFantasia: '',
          razaoSocial: '',
          cnpjCpf: '',
          tipo: 'Outro',
          bairro: 'Centro',
          endereco: '',
          numero: '',
          responsavel: '',
          telefone: ''
        }),
        tipoVistoria: item.tipo_vistoria || item.tipoVistoria || 'ROTINA',
        risco: item.risco || 'MÉDIO',
        status: item.status || 'CONCLUIDA',
        checklists: typeof item.checklists === 'string' ? JSON.parse(item.checklists) : (item.checklists || []),
        irregularidadesEncontradas: typeof item.irregularidades === 'string' ? JSON.parse(item.irregularidades) : (item.irregularidades || item.irregularidadesEncontradas || []),
        medidasAdotadas: item.medidas_adotadas || item.medidasAdotadas || '',
        prazoAdequacaoDias: item.prazo_adequacao_dias || item.prazoAdequacaoDias || 0,
        observacoesFiscais: item.observacoes_fiscais || item.observacoesFiscais || '',
        fotosUrl: typeof item.fotos_url === 'string' ? JSON.parse(item.fotos_url) : (item.fotos_url || item.fotosUrl || []),
        assinaturaInspector: item.assinatura_inspector || item.assinaturaInspector || '',
        assinaturaResponsavel: item.assinatura_responsavel || item.assinaturaResponsavel || '',
        coordenadas: typeof item.coordenadas === 'string' ? JSON.parse(item.coordenadas) : item.coordenadas,
        parecerIA: item.parecer_ia || item.parecerIA || ''
      }));
    }
  } catch (err) {
    console.warn('Erro ao carregar fiscalizações do Supabase:', err);
  }
  return null;
}

export async function saveFiscalizacaoToSupabase(item: FiscalizacaoItem): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    let validId = item.id;
    if (!validId || validId.length < 30 || validId.startsWith('fisc-')) {
      validId = generateUUID();
    }

    const payload = {
      id: validId,
      protocolo: item.protocolo,
      data_hora: item.dataHora,
      fiscal_id: item.fiscalId,
      fiscal_nome: item.fiscalNome,
      estabelecimento: item.estabelecimento,
      tipo_vistoria: item.tipoVistoria,
      risco: item.risco,
      status: item.status,
      checklists: item.checklists,
      irregularidades: item.irregularidadesEncontradas,
      medidas_adotadas: item.medidasAdotadas,
      prazo_adequacao_dias: item.prazoAdequacaoDias || 0,
      observacoes_fiscais: item.observacoesFiscais,
      fotos_url: item.fotosUrl,
      assinatura_inspector: item.assinaturaInspector || '',
      assinatura_responsavel: item.assinaturaResponsavel || '',
      coordenadas: item.coordenadas || null,
      parecer_ia: item.parecerIA || ''
    };

    const { error } = await supabase.from('fiscalizacoes').upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Upsert de fiscalização falhou com esquema detalhado:', error.message, 'Tentando modelo simplificado JSON...');
      // Tentativa de fallback simplificada caso a tabela tenha colunas genéricas
      const fallbackPayload = {
        id: validId,
        protocolo: item.protocolo,
        fiscal_nome: item.fiscalNome,
        status: item.status,
        dados_json: JSON.stringify(item)
      };
      const { error: fallbackErr } = await supabase.from('fiscalizacoes').upsert(fallbackPayload, { onConflict: 'id' });
      if (fallbackErr) {
        console.error('Erro ao salvar fiscalização no Supabase:', fallbackErr.message);
        return false;
      }
    }
    console.log('Fiscalização salva com sucesso no Supabase!');
    return true;
  } catch (err) {
    console.error('Exceção ao salvar fiscalização no Supabase:', err);
    return false;
  }
}

