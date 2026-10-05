import { supabase } from '../lib/supabaseClient';
import { withTimeout } from '../lib/asyncUtils';
import type { ContratoPatrimonio } from '../types/patrimonio';
import { getPatrimonioLocal, savePatrimonioLocal, SEED_CONTRATOS } from '../types/patrimonio';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';

export const contratosService = {
  async listar(): Promise<ContratoPatrimonio[]> {
    try {
      const res = await withTimeout(
        supabase
          .from('patrimonio_contratos')
          .select('*')
          .order('data_fim'),
        2000
      );
      const { data, error } = res;

      if (!error && data && data.length > 0) {
        const contratos = data as ContratoPatrimonio[];
        const local = getPatrimonioLocal();
        savePatrimonioLocal({ ...local, contratos });
        return contratos;
      }
    } catch (err) {
      console.warn('Falha ou timeout ao listar contratos do Supabase; usando cache local:', err);
    }

    const local = getPatrimonioLocal();
    return local.contratos && local.contratos.length > 0 ? local.contratos : SEED_CONTRATOS;
  },

  async obterPorId(id: string): Promise<ContratoPatrimonio | null> {
    try {
      const res = await withTimeout(
        supabase
          .from('patrimonio_contratos')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        2000
      );
      const { data, error } = res;

      if (!error && data) {
        return data as ContratoPatrimonio;
      }
    } catch (_) {}

    const local = getPatrimonioLocal();
    return local.contratos.find(c => c.id === id) || null;
  },

  async salvar(
    contrato: ContratoPatrimonio,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<ContratoPatrimonio> {
    const local = getPatrimonioLocal();
    const existenteIndex = local.contratos.findIndex(c => c.id === contrato.id);
    const isEdicao = existenteIndex >= 0;
    const contratoAnterior = isEdicao ? local.contratos[existenteIndex] : undefined;

    const payload: ContratoPatrimonio = {
      ...contrato,
      updated_at: new Date().toISOString()
    };

    const novosContratos = isEdicao
      ? local.contratos.map(c => c.id === contrato.id ? payload : c)
      : [payload, ...local.contratos];

    savePatrimonioLocal({ ...local, contratos: novosContratos });

    await auditoriaService.registrarAuditoria({
      action: isEdicao ? 'UPDATE' : 'INSERT',
      entity: 'contratos',
      entity_id: payload.id,
      entity_nome: payload.titulo,
      user: usuario,
      old_values: contratoAnterior,
      new_values: payload
    });

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = isEdicao
          ? await supabase.from('patrimonio_contratos').update(payload).eq('id', payload.id)
          : await supabase.from('patrimonio_contratos').insert([payload]);

        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'contratos', payload.id, payload);
      }
    } catch (err) {
      console.warn('Erro ao salvar contrato no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'contratos', payload.id, payload);
    }

    return payload;
  },

  async excluir(
    id: string,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<boolean> {
    const local = getPatrimonioLocal();
    const itemRemovido = local.contratos.find(c => c.id === id);

    const novosContratos = local.contratos.filter(c => c.id !== id);
    savePatrimonioLocal({ ...local, contratos: novosContratos });

    if (itemRemovido) {
      await auditoriaService.registrarAuditoria({
        action: 'DELETE',
        entity: 'contratos',
        entity_id: id,
        entity_nome: itemRemovido.titulo,
        user: usuario,
        old_values: itemRemovido
      });
    }

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = await supabase.from('patrimonio_contratos').delete().eq('id', id);
        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar('delete', 'contratos', id, { id });
      }
    } catch (err) {
      console.warn('Erro ao excluir contrato do Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar('delete', 'contratos', id, { id });
    }

    return true;
  }
};
