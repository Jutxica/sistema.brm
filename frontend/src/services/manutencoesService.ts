import { supabase } from '../lib/supabaseClient';
import type { ManutencaoPatrimonio } from '../types/patrimonio';
import { getPatrimonioLocal, savePatrimonioLocal, SEED_MANUTENCOES } from '../types/patrimonio';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';

export const manutencoesService = {
  async listar(): Promise<ManutencaoPatrimonio[]> {
    try {
      const { data, error } = await supabase
        .from('patrimonio_manutencoes')
        .select('*')
        .order('data_solicitacao', { ascending: false });

      if (!error && data && data.length > 0) {
        const manutencoes = data as ManutencaoPatrimonio[];
        const local = getPatrimonioLocal();
        savePatrimonioLocal({ ...local, manutencoes });
        return manutencoes;
      }
    } catch (err) {
      console.warn('Falha ao listar manutenções do Supabase; usando cache local:', err);
    }

    const local = getPatrimonioLocal();
    return local.manutencoes && local.manutencoes.length > 0 ? local.manutencoes : SEED_MANUTENCOES;
  },

  async obterPorId(id: string): Promise<ManutencaoPatrimonio | null> {
    try {
      const { data, error } = await supabase
        .from('patrimonio_manutencoes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as ManutencaoPatrimonio;
      }
    } catch (_) {}

    const local = getPatrimonioLocal();
    return local.manutencoes.find(m => m.id === id) || null;
  },

  async salvar(
    manutencao: ManutencaoPatrimonio,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<ManutencaoPatrimonio> {
    const local = getPatrimonioLocal();
    const existenteIndex = local.manutencoes.findIndex(m => m.id === manutencao.id);
    const isEdicao = existenteIndex >= 0;
    const manutencaoAnterior = isEdicao ? local.manutencoes[existenteIndex] : undefined;

    const payload: ManutencaoPatrimonio = {
      ...manutencao,
      updated_at: new Date().toISOString()
    };

    const novasManutencoes = isEdicao
      ? local.manutencoes.map(m => m.id === manutencao.id ? payload : m)
      : [payload, ...local.manutencoes];

    savePatrimonioLocal({ ...local, manutencoes: novasManutencoes });

    await auditoriaService.registrarAuditoria({
      action: isEdicao ? 'UPDATE' : 'INSERT',
      entity: 'manutencoes',
      entity_id: payload.id,
      entity_nome: payload.titulo,
      user: usuario,
      old_values: manutencaoAnterior,
      new_values: payload
    });

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = isEdicao
          ? await supabase.from('patrimonio_manutencoes').update(payload).eq('id', payload.id)
          : await supabase.from('patrimonio_manutencoes').insert([payload]);

        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'manutencoes', payload.id, payload);
      }
    } catch (err) {
      console.warn('Erro ao salvar manutenção no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'manutencoes', payload.id, payload);
    }

    return payload;
  },

  async excluir(
    id: string,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<boolean> {
    const local = getPatrimonioLocal();
    const itemRemovido = local.manutencoes.find(m => m.id === id);

    const novasManutencoes = local.manutencoes.filter(m => m.id !== id);
    savePatrimonioLocal({ ...local, manutencoes: novasManutencoes });

    if (itemRemovido) {
      await auditoriaService.registrarAuditoria({
        action: 'DELETE',
        entity: 'manutencoes',
        entity_id: id,
        entity_nome: itemRemovido.titulo,
        user: usuario,
        old_values: itemRemovido
      });
    }

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = await supabase.from('patrimonio_manutencoes').delete().eq('id', id);
        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar('delete', 'manutencoes', id, { id });
      }
    } catch (err) {
      console.warn('Erro ao excluir manutenção do Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar('delete', 'manutencoes', id, { id });
    }

    return true;
  }
};
