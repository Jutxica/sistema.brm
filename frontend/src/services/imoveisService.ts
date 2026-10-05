import { supabase } from '../lib/supabaseClient';
import { withTimeout } from '../lib/asyncUtils';
import type { ImovelPatrimonio } from '../types/patrimonio';
import { getPatrimonioLocal, savePatrimonioLocal, SEED_IMOVEIS } from '../types/patrimonio';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';

export const imoveisService = {
  async listar(): Promise<ImovelPatrimonio[]> {
    try {
      const res = await withTimeout(
        supabase
          .from('patrimonio_imoveis')
          .select('*')
          .order('nome'),
        2000
      );
      const { data, error } = res;

      if (!error && data && data.length > 0) {
        const imoveis = data as ImovelPatrimonio[];
        // Atualiza cache local
        const local = getPatrimonioLocal();
        savePatrimonioLocal({ ...local, imoveis });
        return imoveis;
      }
    } catch (err) {
      console.warn('Falha de rede ou timeout ao consultar imóveis; utilizando cache local:', err);
    }

    const local = getPatrimonioLocal();
    return local.imoveis && local.imoveis.length > 0 ? local.imoveis : SEED_IMOVEIS;
  },

  async obterPorId(id: string): Promise<ImovelPatrimonio | null> {
    try {
      const res = await withTimeout(
        supabase
          .from('patrimonio_imoveis')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        2000
      );
      const { data, error } = res;

      if (!error && data) {
        return data as ImovelPatrimonio;
      }
    } catch (_) {}

    const local = getPatrimonioLocal();
    return local.imoveis.find(i => i.id === id) || null;
  },

  async salvar(
    imovel: ImovelPatrimonio,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<ImovelPatrimonio> {
    const local = getPatrimonioLocal();
    const existenteIndex = local.imoveis.findIndex(i => i.id === imovel.id);
    const isEdicao = existenteIndex >= 0;
    const imovelAnterior = isEdicao ? local.imoveis[existenteIndex] : undefined;

    const payload: ImovelPatrimonio = {
      ...imovel,
      updated_at: new Date().toISOString()
    };

    // 1. Atualiza cache local imediatamente para máxima responsividade
    const novosImoveis = isEdicao
      ? local.imoveis.map(i => i.id === imovel.id ? payload : i)
      : [payload, ...local.imoveis];

    savePatrimonioLocal({ ...local, imoveis: novosImoveis });

    // 2. Registra na trilha de auditoria
    await auditoriaService.registrarAuditoria({
      action: isEdicao ? 'UPDATE' : 'INSERT',
      entity: 'imoveis',
      entity_id: payload.id,
      entity_nome: payload.nome,
      user: usuario,
      old_values: imovelAnterior,
      new_values: payload
    });

    // 3. Persistência remota com fallback para fila de sincronização
    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = isEdicao
          ? await supabase.from('patrimonio_imoveis').update(payload).eq('id', payload.id)
          : await supabase.from('patrimonio_imoveis').insert([payload]);

        if (error) {
          throw error;
        }
      } else {
        sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'imoveis', payload.id, payload);
      }
    } catch (err) {
      console.warn('Erro ao salvar imóvel no Supabase; enfileirando para sincronização posterior:', err);
      sincronizacaoService.enfileirar(isEdicao ? 'update' : 'insert', 'imoveis', payload.id, payload);
    }

    return payload;
  },

  async excluir(
    id: string,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<boolean> {
    const local = getPatrimonioLocal();
    const itemRemovido = local.imoveis.find(i => i.id === id);

    // 1. Atualiza cache local
    const novosImoveis = local.imoveis.filter(i => i.id !== id);
    savePatrimonioLocal({ ...local, imoveis: novosImoveis });

    // 2. Registra auditoria
    if (itemRemovido) {
      await auditoriaService.registrarAuditoria({
        action: 'DELETE',
        entity: 'imoveis',
        entity_id: id,
        entity_nome: itemRemovido.nome,
        user: usuario,
        old_values: itemRemovido
      });
    }

    // 3. Supabase ou Fila
    try {
      if (sincronizacaoService.isOnline()) {
        const { error } = await supabase.from('patrimonio_imoveis').delete().eq('id', id);
        if (error) throw error;
      } else {
        sincronizacaoService.enfileirar('delete', 'imoveis', id, { id });
      }
    } catch (err) {
      console.warn('Erro ao excluir imóvel no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar('delete', 'imoveis', id, { id });
    }

    return true;
  }
};
