/**
 * Utilitário de resiliência e alta performance para chamadas de rede.
 * Garante que nenhuma consulta remota bloqueie a interface do usuário além do tempo limite configurado.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number = 2000,
  fallback?: T
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallback !== undefined) {
        resolve(fallback);
      } else {
        reject(new Error(`Timeout de rede excedido (${ms}ms)`));
      }
    }, ms);
  });

  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (fallback !== undefined) return fallback;
    throw err;
  }
}
