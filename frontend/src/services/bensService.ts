import { supabase } from '../lib/supabaseClient';
import type { BemPatrimonio } from '../types/patrimonio';
import { getPatrimonioLocal, savePatrimonioLocal, SEED_BENS } from '../types/patrimonio';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';

export const bensService = {
  async listar(): Promise<BemPatrimonio[]> {
    try {
      const { data, error } = await supabase
        .from('patrimonio_bens')
        .select('*')
        .order('codigo_tombamento');

      if (!error && data && data.length > 0) {
        const bens = data as BemPatrimonio[];
        const local = getPatrimonioLocal();
        savePatrimonioLocal({ ...local, bens });
        return bens;
      }
    } catch (err) {
      console.warn('Falha ao listar bens do Supabase; usando cache local:', err);
    }

    const local = getPatrimonioLocal();
    return local.bens && local.bens.length > 0 ? local.bens : SEED_BENS;
  },

  async obterPorId(id: string): Promise<BemPatrimonio | null> {
    try {
      const { data, error } = await supabase
        .from('patrimonio_bens')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as BemPatrimonio;
      }
    } catch (_) {}

    const local = getPatrimonioLocal();
    return local.bens.find(b => b.id === id) || null;
  },

  async salvar(
    bem: BemPatrimonio,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<BemPatrimonio> {
    const local = getPatrimonioLocal();
    const existenteIndex = local.bens.findIndex(b => b.id === bem.id);
    const isEdicao = existenteIndex >= 0;
    const bemAnterior = isEdicao ? local.bens[existenteIndex] : undefined;

    const payload: BemPatrimonio = {
      ...bem,
      updated_at: new Date().toISOString()
    };

    const novosBens = isEdicao
      ? local.bens.map(b => b.id === bem.id ? payload : b)
      : [payload, ...local.bens];

    savePatrimonioLocal({ ...local, bens: novosBens });

    await auditoriaService.registrarAuditoria({
      action: isEdicao ? 'UPDATE' : 'INSERT',
      entity: 'bens',
      entity_id: payload.id,
      entity_nome: `${payload.codigo_tombamento} - ${payload.titulo}`,
      user: usuario,
      old_values: bemAnterior,
      new_values: payload
    });

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = isEdicao
          ? await supabase.from('patrimonio_bens').update(payload).eq('id', payload.id)
          : await supabase.from('patrimonio_bens').insert([payload]);

        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'bens', payload.id, payload);
      }
    } catch (err) {
      console.warn('Erro ao salvar bem no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'bens', payload.id, payload);
    }

    return payload;
  },

  async excluir(
    id: string,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<boolean> {
    const local = getPatrimonioLocal();
    const itemRemovido = local.bens.find(b => b.id === id);

    const novosBens = local.bens.filter(b => b.id !== id);
    savePatrimonioLocal({ ...local, bens: novosBens });

    if (itemRemovido) {
      await auditoriaService.registrarAuditoria({
        action: 'DELETE',
        entity: 'bens',
        entity_id: id,
        entity_nome: `${itemRemovido.codigo_tombamento} - ${itemRemovido.titulo}`,
        user: usuario,
        old_values: itemRemovido
      });
    }

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = await supabase.from('patrimonio_bens').delete().eq('id', id);
        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar('delete', 'bens', id, { id });
      }
    } catch (err) {
      console.warn('Erro ao excluir bem no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar('delete', 'bens', id, { id });
    }

    return true;
  }
};
