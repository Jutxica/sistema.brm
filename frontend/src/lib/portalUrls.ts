export const getPortalRedirectUrl = (): string => {
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (configuredOrigin) return new URL('/', configuredOrigin).toString();
  return new URL('/portal-religioso', window.location.origin).toString();
};

export const isPortalPublicHost = (): boolean => {
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  if (!configuredOrigin) return false;
  return new URL(configuredOrigin).hostname === window.location.hostname;
};
