export const isPortalPublicHost = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();

  // 1. O domínio principal do sistema administrativo 'sistema.brm.org.br' NUNCA é o portal raiz
  if (hostname === 'sistema.brm.org.br') {
    return false;
  }

  // 2. Reconhecimento automático nativo de subdomínios do Portal do Religioso
  if (
    hostname.startsWith('portal.') ||
    hostname.startsWith('portalscj.') ||
    hostname.startsWith('confrade.') ||
    hostname.includes('portal-religioso')
  ) {
    return true;
  }

  // 3. Verificação com a variável de ambiente opcional configurada
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (configuredOrigin) {
    try {
      const portalHost = new URL(configuredOrigin).hostname.toLowerCase();
      if (portalHost !== 'sistema.brm.org.br' && hostname === portalHost) {
        return true;
      }
    } catch {
      // fallback
    }
  }

  return false;
};

export const getPortalRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Se já estiver em subdomínio dedicado ao portal, mantém na raiz
    if (isPortalPublicHost()) {
      return `${window.location.origin}/`;
    }
    // No domínio principal (sistema.brm.org.br ou localhost), a rota oficial é /portal-religioso
    return `${window.location.origin}/portal-religioso`;
  }

  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);
      if (url.hostname.toLowerCase() === 'sistema.brm.org.br') {
        return new URL('/portal-religioso', configuredOrigin).toString();
      }
      return new URL('/', configuredOrigin).toString();
    } catch {
      // fallback
    }
  }

  return 'https://sistema.brm.org.br/portal-religioso';
};

export const getPasswordResetRedirectUrl = (origem?: 'portal' | 'sistema'): string => {
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim() || 'https://sistema.brm.org.br');
  const cleanBase = base.replace(/\/+$/, '');
  const query = origem ? `?origem=${origem}` : '';
  return `${cleanBase}/redefinir-senha${query}`;
};
