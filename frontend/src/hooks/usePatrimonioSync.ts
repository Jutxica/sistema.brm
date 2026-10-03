import { useState, useEffect } from 'react';
import { sincronizacaoService } from '../services/sincronizacaoService';
import type { SyncQueueItem } from '../types/patrimonio';

export function usePatrimonioSync() {
  const [queue, setQueue] = useState<SyncQueueItem[]>(sincronizacaoService.obterFila());
  const [isOnline, setIsOnline] = useState<boolean>(sincronizacaoService.isOnline());

  useEffect(() => {
    const cancelar = sincronizacaoService.inscrever((novaFila, online) => {
      setQueue(novaFila);
      setIsOnline(online);
    });
    return cancelar;
  }, []);

  const pending = queue.filter(q => q.status === 'pendente' || q.status === 'sincronizando');
  const conflicts = queue.filter(q => q.status === 'conflito');

  const syncNow = () => {
    sincronizacaoService.processarFila();
  };

  const resolveConflict = async (id: string, strategy: 'servidor' | 'local' | 'mesclar') => {
    return sincronizacaoService.resolverConflito(id, strategy);
  };

  return {
    isOnline,
    queue,
    pendingCount: pending.length,
    conflicts,
    hasConflicts: conflicts.length > 0,
    syncNow,
    resolveConflict
  };
}
