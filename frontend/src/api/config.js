const rawUrl = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) || 'https://api.mentornearby.com';
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
export const HEALTH_CHECK_URL = `${rawUrl.replace(/\/api$/, '')}/api/health`;

export const isBackendAlive = async () => {
  try {
    const res = await fetch(HEALTH_CHECK_URL, { method: 'GET', cache: 'no-cache' });
    return res.ok;
  } catch (_) {
    return false;
  }
};
