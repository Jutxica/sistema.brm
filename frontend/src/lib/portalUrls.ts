export const getPortalRedirectUrl = (): string => {
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);
      // Se configuredOrigin for o próprio domínio principal, o portal fica em /portal-religioso
      if (url.hostname.toLowerCase() === 'sistema.brm.org.br') {
        return new URL('/portal-religioso', configuredOrigin).toString();
      }
      return new URL('/', configuredOrigin).toString();
    } catch {
      // fallback
    }
  }
  return new URL('/portal-religioso', window.location.origin).toString();
};

export const isPortalPublicHost = (): boolean => {
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (!configuredOrigin) return false;
  try {
    const portalHost = new URL(configuredOrigin).hostname.toLowerCase();
    // O domínio principal 'sistema.brm.org.br' é o Sistema Administrativo oficial (Login/Início)
    // e NUNCA deve ter sua raiz '/' sequestrada pelo Portal do Religioso.
    // O Portal do Religioso só substitui a raiz se for um subdomínio dedicado (ex: portalscj.brm.org.br).
    if (portalHost === 'sistema.brm.org.br') {
      return false;
    }
    return typeof window !== 'undefined' && window.location.hostname.toLowerCase() === portalHost;
  } catch {
    return false;
  }
};
