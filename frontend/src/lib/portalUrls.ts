export const isPortalPublicHost = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();

  // 1. O domínio principal do sistema administrativo 'sistema.brm.org.br' NUNCA é o portal
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
    const hostname = window.location.hostname.toLowerCase();
    // Se já estiver no subdomínio portal, fica na raiz
    if (isPortalPublicHost()) {
      return `${window.location.origin}/`;
    }
    // Se estiver no sistema principal brm.org.br, sugere o subdomínio portal.brm.org.br
    if (hostname === 'sistema.brm.org.br' || hostname.endsWith('.brm.org.br')) {
      return `${window.location.protocol}//portal.brm.org.br/`;
    }
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

  return new URL('/portal-religioso', typeof window !== 'undefined' ? window.location.origin : 'https://sistema.brm.org.br').toString();
};

