import { supabase } from '../lib/supabaseClient';
import { withTimeout } from '../lib/asyncUtils';
import type { VeiculoPatrimonio } from '../types/patrimonio';
import { getPatrimonioLocal, savePatrimonioLocal, SEED_VEICULOS } from '../types/patrimonio';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';

export const veiculosService = {
  async listar(): Promise<VeiculoPatrimonio[]> {
    try {
      const res = await withTimeout(
        supabase
          .from('patrimonio_veiculos')
          .select('*')
          .order('marca_modelo'),
        2000
      );
      const { data, error } = res;

      if (!error && data && data.length > 0) {
        const veiculos = data as VeiculoPatrimonio[];
        const local = getPatrimonioLocal();
        savePatrimonioLocal({ ...local, veiculos });
        return veiculos;
      }
    } catch (err) {
      console.warn('Falha ou timeout ao listar veículos do Supabase; usando cache local:', err);
    }

    const local = getPatrimonioLocal();
    return local.veiculos && local.veiculos.length > 0 ? local.veiculos : SEED_VEICULOS;
  },

  async obterPorId(id: string): Promise<VeiculoPatrimonio | null> {
    try {
      const res = await withTimeout(
        supabase
          .from('patrimonio_veiculos')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        2000
      );
      const { data, error } = res;

      if (!error && data) {
        return data as VeiculoPatrimonio;
      }
    } catch (_) {}

    const local = getPatrimonioLocal();
    return local.veiculos.find(v => v.id === id) || null;
  },

  async salvar(
    veiculo: VeiculoPatrimonio,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<VeiculoPatrimonio> {
    const local = getPatrimonioLocal();
    const existenteIndex = local.veiculos.findIndex(v => v.id === veiculo.id);
    const isEdicao = existenteIndex >= 0;
    const veiculoAnterior = isEdicao ? local.veiculos[existenteIndex] : undefined;

    const payload: VeiculoPatrimonio = {
      ...veiculo,
      updated_at: new Date().toISOString()
    };

    const novosVeiculos = isEdicao
      ? local.veiculos.map(v => v.id === veiculo.id ? payload : v)
      : [payload, ...local.veiculos];

    savePatrimonioLocal({ ...local, veiculos: novosVeiculos });

    await auditoriaService.registrarAuditoria({
      action: isEdicao ? 'UPDATE' : 'INSERT',
      entity: 'veiculos',
      entity_id: payload.id,
      entity_nome: `${payload.marca_modelo} (${payload.placa})`,
      user: usuario,
      old_values: veiculoAnterior,
      new_values: payload
    });

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = isEdicao
          ? await supabase.from('patrimonio_veiculos').update(payload).eq('id', payload.id)
          : await supabase.from('patrimonio_veiculos').insert([payload]);

        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'veiculos', payload.id, payload);
      }
    } catch (err) {
      console.warn('Erro ao salvar veículo no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'veiculos', payload.id, payload);
    }

    return payload;
  },

  async excluir(
    id: string,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<boolean> {
    const local = getPatrimonioLocal();
    const itemRemovido = local.veiculos.find(v => v.id === id);

    const novosVeiculos = local.veiculos.filter(v => v.id !== id);
    savePatrimonioLocal({ ...local, veiculos: novosVeiculos });

    if (itemRemovido) {
      await auditoriaService.registrarAuditoria({
        action: 'DELETE',
        entity: 'veiculos',
        entity_id: id,
        entity_nome: `${itemRemovido.marca_modelo} (${itemRemovido.placa})`,
        user: usuario,
        old_values: itemRemovido
      });
    }

    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = await supabase.from('patrimonio_veiculos').delete().eq('id', id);
        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar('delete', 'veiculos', id, { id });
      }
    } catch (err) {
      console.warn('Erro ao excluir veículo do Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar('delete', 'veiculos', id, { id });
    }

    return true;
  }
};
