export const PORTAL_CANONICAL_URL = 'https://portal.brm.org.br';

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
    hostname.includes('portal-religioso') ||
    window.location.search.includes('portal=1')
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

export const getPortalPublicBaseUrl = (): string => {
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (configuredOrigin) {
    try {
      const parsed = new URL(configuredOrigin);
      if (parsed.hostname.toLowerCase() !== 'sistema.brm.org.br') {
        return configuredOrigin.replace(/\/+$/, '');
      }
    } catch {
      // fallback
    }
  }
  return PORTAL_CANONICAL_URL;
};

export const getPortalRedirectUrl = (): string => {
  if (typeof window !== 'undefined' && isPortalPublicHost()) {
    return `${window.location.origin}/`;
  }
  return `${getPortalPublicBaseUrl()}/`;
};

export const getPasswordResetRedirectUrl = (origem?: 'portal' | 'sistema'): string => {
  const base = typeof window !== 'undefined'
    ? (origem === 'portal' ? getPortalPublicBaseUrl() : window.location.origin)
    : (origem === 'portal' ? getPortalPublicBaseUrl() : 'https://sistema.brm.org.br');
  const cleanBase = base.replace(/\/+$/, '');
  const query = origem ? `?origem=${origem}` : '';
  return `${cleanBase}/redefinir-senha${query}`;
};

export const getSystemLoginUrl = (): string => {
  if (typeof window !== 'undefined' && !isPortalPublicHost()) {
    return '/login';
  }
  return 'https://sistema.brm.org.br/login';
};
