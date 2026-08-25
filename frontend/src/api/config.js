export const API_BASE_URL = 'https://mentornearby-2.onrender.com/api';
export const HEALTH_CHECK_URL = 'https://mentornearby-2.onrender.com/health';

export const isBackendAlive = async () => {
  try {
    const res = await fetch(HEALTH_CHECK_URL, { method: 'GET', cache: 'no-cache' });
    return res.ok;
  } catch (_) {
    return false;
  }
};
