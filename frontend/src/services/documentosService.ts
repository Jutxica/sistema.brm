import { supabase } from '../lib/supabaseClient';
import type { PatrimonioDocumento, PatrimonioAnexo } from '../types/patrimonio';
import { getPatrimonioLocal, savePatrimonioLocal } from '../types/patrimonio';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';

export const documentosService = {
  /**
   * Converte PatrimonioDocumento relacional para o formato PatrimonioAnexo para compatibilidade com telas existentes.
   */
  paraAnexo(doc: PatrimonioDocumento): PatrimonioAnexo {
    return {
      id: doc.id,
      nome: doc.nome,
      tipo: doc.tipo_documento,
      arquivo_url: doc.arquivo_url,
      arquivo_nome: doc.storage_path?.split('/').pop() || doc.nome,
      tamanho_bytes: doc.tamanho_bytes,
      formato: doc.formato,
      created_at: doc.created_at,
      enviado_por: doc.enviado_por
    };
  },

  /**
   * Converte PatrimonioAnexo legado para PatrimonioDocumento relacional.
   */
  deAnexo(
    anexo: PatrimonioAnexo,
    entidadeTipo: 'imovel' | 'veiculo' | 'bem' | 'contrato' | 'manutencao',
    entidadeId: string
  ): PatrimonioDocumento {
    return {
      id: anexo.id,
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      nome: anexo.nome,
      tipo_documento: anexo.tipo,
      arquivo_url: anexo.arquivo_url,
      storage_path: anexo.arquivo_nome,
      tamanho_bytes: anexo.tamanho_bytes,
      formato: anexo.formato,
      enviado_por: anexo.enviado_por,
      created_at: anexo.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  /**
   * Consulta documentos de uma entidade no banco ou a partir da coluna de anexos local.
   */
  async listarPorEntidade(
    entidadeTipo: 'imovel' | 'veiculo' | 'bem' | 'contrato' | 'manutencao',
    entidadeId: string
  ): Promise<PatrimonioDocumento[]> {
    // 1. Tentar tabela relacional patrimonio_documentos
    try {
      const { data, error } = await supabase
        .from('patrimonio_documentos')
        .select('*')
        .eq('entidade_tipo', entidadeTipo)
        .eq('entidade_id', entidadeId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as PatrimonioDocumento[];
      }
    } catch (_) {}

    // 2. Fallback: extrair do objeto pai no cache local
    const local = getPatrimonioLocal();
    let pai: any = null;
    if (entidadeTipo === 'imovel') pai = local.imoveis.find(i => i.id === entidadeId);
    else if (entidadeTipo === 'veiculo') pai = local.veiculos.find(v => v.id === entidadeId);
    else if (entidadeTipo === 'bem') pai = local.bens.find(b => b.id === entidadeId);
    else if (entidadeTipo === 'contrato') pai = local.contratos.find(c => c.id === entidadeId);
    else if (entidadeTipo === 'manutencao') pai = local.manutencoes.find(m => m.id === entidadeId);

    const anexos: PatrimonioAnexo[] = pai?.anexos || [];
    return anexos.map(a => this.deAnexo(a, entidadeTipo, entidadeId));
  },

  /**
   * Adiciona ou atualiza um documento na tabela relacional E no array JSONB da entidade pai.
   */
  async salvar(
    doc: PatrimonioDocumento,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<PatrimonioDocumento> {
    const payload: PatrimonioDocumento = {
      ...doc,
      updated_at: new Date().toISOString()
    };

    // 1. Atualizar array no objeto pai do LocalStorage para manter compatibilidade estrita
    const local = getPatrimonioLocal();
    const anexoCompativel = this.paraAnexo(payload);

    const sincronizarAnexosPai = (items: any[]) => {
      return items.map(item => {
        if (item.id === payload.entidade_id) {
          const anexosExistentes: PatrimonioAnexo[] = item.anexos || [];
          const idx = anexosExistentes.findIndex(a => a.id === payload.id);
          const novosAnexos = idx >= 0
            ? anexosExistentes.map(a => a.id === payload.id ? anexoCompativel : a)
            : [anexoCompativel, ...anexosExistentes];
          return { ...item, anexos: novosAnexos, updated_at: new Date().toISOString() };
        }
        return item;
      });
    };

    if (payload.entidade_tipo === 'imovel') local.imoveis = sincronizarAnexosPai(local.imoveis);
    else if (payload.entidade_tipo === 'veiculo') local.veiculos = sincronizarAnexosPai(local.veiculos);
    else if (payload.entidade_tipo === 'bem') local.bens = sincronizarAnexosPai(local.bens);
    else if (payload.entidade_tipo === 'contrato') local.contratos = sincronizarAnexosPai(local.contratos);
    else if (payload.entidade_tipo === 'manutencao') local.manutencoes = sincronizarAnexosPai(local.manutencoes);

    savePatrimonioLocal(local);

    // 2. Registrar auditoria institucional
    await auditoriaService.registrarAuditoria({
      action: 'INSERT',
      entity: 'documentos',
      entity_id: payload.id,
      entity_nome: `${payload.tipo_documento}: ${payload.nome}`,
      user: usuario,
      new_values: payload
    });

    // 3. Salvar no Supabase (patrimonio_documentos e também na coluna anexos da tabela pai)
    try {
      if (sincronizacaoService.isOnline()) {
        await supabase.from('patrimonio_documentos').upsert([payload]);

        // Atualizar também na tabela do pai correspondente
        const tabelaPai = `patrimonio_${payload.entidade_tipo === 'manutencao' ? 'manutencoes' : payload.entidade_tipo + 's'}`;
        const itemPai = (payload.entidade_tipo === 'imovel' ? local.imoveis :
                         payload.entidade_tipo === 'veiculo' ? local.veiculos :
                         payload.entidade_tipo === 'bem' ? local.bens :
                         payload.entidade_tipo === 'contrato' ? local.contratos :
                         local.manutencoes).find(i => i.id === payload.entidade_id);

        if (itemPai) {
          await supabase.from(tabelaPai).update({ anexos: itemPai.anexos }).eq('id', payload.entidade_id);
        }
      } else {
        sincronizacaoService.enfileirar('update', 'documentos', payload.id, payload);
      }
    } catch (err) {
      console.warn('Erro ao salvar documento relacional no Supabase; enfileirando:', err);
      sincronizacaoService.enfileirar('update', 'documentos', payload.id, payload);
    }

    return payload;
  },

  /**
   * Remove um documento da tabela relacional e do array JSONB da entidade pai.
   */
  async excluir(
    id: string,
    entidadeTipo: 'imovel' | 'veiculo' | 'bem' | 'contrato' | 'manutencao',
    entidadeId: string,
    usuario?: { id?: string; email?: string; nome?: string }
  ): Promise<boolean> {
    const local = getPatrimonioLocal();

    const removerAnexoPai = (items: any[]) => {
      return items.map(item => {
        if (item.id === entidadeId) {
          const novosAnexos = (item.anexos || []).filter((a: PatrimonioAnexo) => a.id !== id);
          return { ...item, anexos: novosAnexos, updated_at: new Date().toISOString() };
        }
        return item;
      });
    };

    if (entidadeTipo === 'imovel') local.imoveis = removerAnexoPai(local.imoveis);
    else if (entidadeTipo === 'veiculo') local.veiculos = removerAnexoPai(local.veiculos);
    else if (entidadeTipo === 'bem') local.bens = removerAnexoPai(local.bens);
    else if (entidadeTipo === 'contrato') local.contratos = removerAnexoPai(local.contratos);
    else if (entidadeTipo === 'manutencao') local.manutencoes = removerAnexoPai(local.manutencoes);

    savePatrimonioLocal(local);

    await auditoriaService.registrarAuditoria({
      action: 'DELETE',
      entity: 'documentos',
      entity_id: id,
      user: usuario
    });

    try {
      if (sincronizacaoService.isOnline()) {
        await supabase.from('patrimonio_documentos').delete().eq('id', id);

        const tabelaPai = `patrimonio_${entidadeTipo === 'manutencao' ? 'manutencoes' : entidadeTipo + 's'}`;
        const itemPai = (entidadeTipo === 'imovel' ? local.imoveis :
                         entidadeTipo === 'veiculo' ? local.veiculos :
                         entidadeTipo === 'bem' ? local.bens :
                         entidadeTipo === 'contrato' ? local.contratos :
                         local.manutencoes).find(i => i.id === entidadeId);

        if (itemPai) {
          await supabase.from(tabelaPai).update({ anexos: itemPai.anexos }).eq('id', entidadeId);
        }
      } else {
        sincronizacaoService.enfileirar('delete', 'documentos', id, { id });
      }
    } catch (err) {
      console.warn('Erro ao excluir documento no Supabase:', err);
      sincronizacaoService.enfileirar('delete', 'documentos', id, { id });
    }

    return true;
  }
};
