import { supabase } from '../lib/supabaseClient';
import type { SyncQueueItem } from '../types/patrimonio';

const STORAGE_KEY_SYNC_QUEUE = 'brm_patrimonio_sync_queue';

type SyncListener = (queue: SyncQueueItem[], isOnline: boolean) => void;

class SincronizacaoService {
  private listeners: Set<SyncListener> = new Set();
  private processando: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notificarListeners();
        this.processarFila();
      });
      window.addEventListener('offline', () => {
        this.notificarListeners();
      });
    }
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  obterFila(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SYNC_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  salvarFila(fila: SyncQueueItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(fila));
      this.notificarListeners();
    } catch (err) {
      console.warn('Erro ao salvar fila de sincronização:', err);
    }
  }

  /**
   * Adiciona uma operação pendente à fila de sincronização.
   */
  enfileirar(
    acao: 'insert' | 'update' | 'delete',
    entidade: 'imoveis' | 'veiculos' | 'bens' | 'contratos' | 'manutencoes' | 'documentos',
    entidade_id: string,
    payload: any
  ): SyncQueueItem {
    const fila = this.obterFila();
    
    // Se já houver operação pendente para o mesmo registro, unifica ou atualiza
    const indexExistente = fila.findIndex(
      item => item.entidade === entidade && item.entidade_id === entidade_id && item.status !== 'concluido'
    );

    const novoItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      acao,
      entidade,
      entidade_id,
      payload,
      tentativas: 0,
      status: 'pendente'
    };

    if (indexExistente >= 0) {
      const existente = fila[indexExistente];
      // Se era insert e agora é update, continua insert com novo payload
      if (existente.acao === 'insert' && acao === 'update') {
        fila[indexExistente] = { ...existente, payload, timestamp: novoItem.timestamp };
      } else if (existente.acao === 'insert' && acao === 'delete') {
        // Se foi criado offline e deletado offline, basta remover da fila
        fila.splice(indexExistente, 1);
        this.salvarFila(fila);
        return novoItem;
      } else {
        fila[indexExistente] = novoItem;
      }
    } else {
      fila.push(novoItem);
    }

    this.salvarFila(fila);

    // Se estiver online, inicia processamento em segundo plano
    if (this.isOnline()) {
      setTimeout(() => this.processarFila(), 500);
    }

    return novoItem;
  }

  /**
   * Processa a fila de operações pendentes.
   */
  async processarFila(): Promise<void> {
    if (this.processando || !this.isOnline()) return;
    this.processando = true;

    try {
      const fila = this.obterFila();
      const pendentes = fila.filter(f => f.status === 'pendente' || f.status === 'sincronizando');

      for (const item of pendentes) {
        item.status = 'sincronizando';
        item.tentativas += 1;
        this.salvarFila(fila);

        try {
          const nomeTabela = `patrimonio_${item.entidade}`;
          
          if (item.acao === 'insert') {
            const { error } = await supabase.from(nomeTabela).insert([item.payload]);
            if (error) throw error;
            item.status = 'concluido';
          } else if (item.acao === 'update') {
            // Verificar detecção de conflitos: consulta updated_at no servidor
            const { data: serverItem, error: fetchErr } = await supabase
              .from(nomeTabela)
              .select('updated_at')
              .eq('id', item.entidade_id)
              .maybeSingle();

            if (!fetchErr && serverItem?.updated_at) {
              const serverTime = new Date(serverItem.updated_at).getTime();
              const localTime = new Date(item.timestamp).getTime();
              // Se o servidor foi modificado após a modificação local, flag de conflito
              if (serverTime > localTime) {
                item.status = 'conflito';
                item.erro = 'Registro modificado no servidor por outro usuário durante o período offline.';
                continue;
              }
            }

            const { error } = await supabase.from(nomeTabela).update(item.payload).eq('id', item.entidade_id);
            if (error) throw error;
            item.status = 'concluido';
          } else if (item.acao === 'delete') {
            const { error } = await supabase.from(nomeTabela).delete().eq('id', item.entidade_id);
            if (error) throw error;
            item.status = 'concluido';
          }
        } catch (err: any) {
          console.warn(`Erro ao sincronizar item ${item.id}:`, err);
          item.status = 'pendente';
          item.erro = err?.message || 'Falha de comunicação';
        }
      }

      // Limpa os concluídos mantendo histórico dos últimos 50
      const filaAtualizada = this.obterFila().filter(f => f.status !== 'concluido');
      this.salvarFila(filaAtualizada);
    } finally {
      this.processando = false;
      this.notificarListeners();
    }
  }

  /**
   * Resolução mediada de conflitos.
   */
  async resolverConflito(
    id: string,
    estrategia: 'servidor' | 'local' | 'mesclar'
  ): Promise<boolean> {
    const fila = this.obterFila();
    const item = fila.find(f => f.id === id);
    if (!item) return false;

    const nomeTabela = `patrimonio_${item.entidade}`;

    if (estrategia === 'servidor') {
      // Descarta alteração local
      const novaFila = fila.filter(f => f.id !== id);
      this.salvarFila(novaFila);
      return true;
    } else if (estrategia === 'local') {
      // Força sobrescrita no servidor
      try {
        const { error } = await supabase.from(nomeTabela).update(item.payload).eq('id', item.entidade_id);
        if (!error) {
          const novaFila = fila.filter(f => f.id !== id);
          this.salvarFila(novaFila);
          return true;
        }
      } catch (_) {}
    } else if (estrategia === 'mesclar') {
      // Consulta servidor e mescla campos não vazios locais
      try {
        const { data: serverData } = await supabase.from(nomeTabela).select('*').eq('id', item.entidade_id).single();
        if (serverData) {
          const mesclado = { ...serverData, ...item.payload };
          const { error } = await supabase.from(nomeTabela).update(mesclado).eq('id', item.entidade_id);
          if (!error) {
            const novaFila = fila.filter(f => f.id !== id);
            this.salvarFila(novaFila);
            return true;
          }
        }
      } catch (_) {}
    }

    return false;
  }

  inscrever(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.obterFila(), this.isOnline());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notificarListeners() {
    const fila = this.obterFila();
    const online = this.isOnline();
    this.listeners.forEach(fn => fn(fila, online));
  }
}

export const sincronizacaoService = new SincronizacaoService();
