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

    const { error } = await supabase.from('operadores').upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Upsert com ID falhou no Supabase:', error.message, 'Tentando salvar sem ID...');
      const { id, ...payloadWithoutId } = payload;
      const { error: insertErr } = await supabase.from('operadores').insert([payloadWithoutId]);
      if (insertErr) {
        console.error('Erro ao salvar operador no Supabase:', insertErr.message);
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
