import { API_BASE } from './config.js';

export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    if (res.status === 204) return null;
    return res.status === 204 ? null : res.json() // To avoid a crash when nothing is returned (eg. deletion)
}
