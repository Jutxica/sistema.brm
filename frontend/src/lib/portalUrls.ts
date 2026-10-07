export const getPortalRedirectUrl = (): string => {
  const configuredOrigin = import.meta.env.VITE_PORTAL_PUBLIC_URL?.trim();
  const origin = configuredOrigin || window.location.origin;
  return new URL('/portal-religioso', origin).toString();
};
