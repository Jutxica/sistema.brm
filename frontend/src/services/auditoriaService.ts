import { supabase } from '../lib/supabaseClient';
import type { AuditLogEntry } from '../types/patrimonio';

const STORAGE_KEY_AUDIT = 'brm_patrimonio_audit_logs';

export const auditoriaService = {
  /**
   * Registra um evento na trilha de auditoria append-only.
   * Tenta persistir no Supabase; em caso de falha ou offline, armazena em buffer local.
   */
  async registrarAuditoria(params: {
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD';
    entity: 'imoveis' | 'veiculos' | 'bens' | 'contratos' | 'manutencoes' | 'documentos';
    entity_id: string;
    entity_nome?: string;
    user?: { id?: string; email?: string; nome?: string };
    old_values?: any;
    new_values?: any;
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      action: params.action,
      entity: params.entity,
      entity_id: params.entity_id,
      entity_nome: params.entity_nome,
      user_id: params.user?.id,
      user_email: params.user?.email || 'usuario.local@dehonianos.org.br',
      user_nome: params.user?.nome || 'Operador Local BRM',
      old_values: params.old_values ? JSON.parse(JSON.stringify(params.old_values)) : undefined,
      new_values: params.new_values ? JSON.parse(JSON.stringify(params.new_values)) : undefined,
      created_at: new Date().toISOString()
    };

    // 1. Tentar gravar no Supabase
    try {
      const { error } = await supabase.from('patrimonio_audit_logs').insert([{
        id: entry.id,
        user_id: entry.user_id && entry.user_id.length === 36 ? entry.user_id : null,
        user_email: entry.user_email,
        user_nome: entry.user_nome,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entity_id,
        entity_nome: entry.entity_nome,
        old_values: entry.old_values,
        new_values: entry.new_values,
        created_at: entry.created_at
      }]);

      if (error) {
        console.warn('Aviso: auditoria Supabase indisponível, guardando localmente:', error.message);
        this.salvarLocal(entry);
      }
    } catch (err) {
      console.warn('Erro ao conectar ao Supabase para auditoria:', err);
      this.salvarLocal(entry);
    }

    // Salvar também em cópia local para auditoria instantânea offline
    this.salvarLocal(entry);

    return entry;
  },

  /**
   * Consulta histórico de auditoria por entidade ou geral.
   */
  async listarAuditoria(filtros?: {
    entity?: string;
    entity_id?: string;
    action?: string;
    limite?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = supabase.from('patrimonio_audit_logs').select('*').order('created_at', { ascending: false });

      if (filtros?.entity) {
        query = query.eq('entity', filtros.entity);
      }
      if (filtros?.entity_id) {
        query = query.eq('entity_id', filtros.entity_id);
      }
      if (filtros?.action) {
        query = query.eq('action', filtros.action);
      }
      if (filtros?.limite) {
        query = query.limit(filtros.limite);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as AuditLogEntry[];
      }
    } catch (_) {}

    // Fallback para buffer local
    const locais = this.obterLocais();
    return locais.filter(l => {
      if (filtros?.entity && l.entity !== filtros.entity) return false;
      if (filtros?.entity_id && l.entity_id !== filtros.entity_id) return false;
      if (filtros?.action && l.action !== filtros.action) return false;
      return true;
    }).slice(0, filtros?.limite || 100);
  },

  obterLocais(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  },

  salvarLocal(entry: AuditLogEntry) {
    try {
      const atuais = this.obterLocais();
      // Não duplicar
      if (atuais.some(a => a.id === entry.id)) return;
      const atualizados = [entry, ...atuais].slice(0, 500); // Manter os últimos 500
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(atualizados));
    } catch (e) {
      console.warn('Erro ao persistir log local:', e);
    }
  }
};
