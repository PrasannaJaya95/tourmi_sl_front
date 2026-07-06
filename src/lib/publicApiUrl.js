/**
 * Keep in sync with back/src/lib/publicApiUrl.js
 */

const INTERNAL_PORTS = new Set(['5000', '5004', '3000', '5173', '8080']);

function stripTrailingSlash(url) {
    return String(url || '').replace(/\/$/, '');
}

function isLocalHost(hostname) {
    if (!hostname) return false;
    const h = String(hostname).toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function forwardedHeader(req, name) {
    const raw = req.headers[name];
    if (!raw) return '';
    return String(raw).split(',')[0].trim();
}

function resolveProtocol(req) {
    return forwardedHeader(req, 'x-forwarded-proto') || req.protocol || 'https';
}

function parseHostParts(host) {
    if (!host) return { hostname: '', port: '' };
    const trimmed = String(host).trim();
    if (!trimmed) return { hostname: '', port: '' };

    const ipv6 = trimmed.match(/^\[([^\]]+)\](?::(\d+))?$/);
    if (ipv6) {
        return { hostname: ipv6[1], port: ipv6[2] || '' };
    }

    const idx = trimmed.lastIndexOf(':');
    if (idx > -1 && /^\d+$/.test(trimmed.slice(idx + 1))) {
        return {
            hostname: trimmed.slice(0, idx),
            port: trimmed.slice(idx + 1),
        };
    }

    return { hostname: trimmed, port: '' };
}

function sanitizePublicHost(host) {
    const { hostname, port } = parseHostParts(host);
    if (!hostname) return '';

    if (port && INTERNAL_PORTS.has(port) && !isLocalHost(hostname)) {
        return hostname;
    }

    return port ? `${hostname}:${port}` : hostname;
}

function getPublicApiBaseUrl(req) {
    const fromEnv =
        process.env.BACKEND_URL ||
        process.env.PUBLIC_API_URL ||
        process.env.SHARE_LINK_BASE_URL;
    if (fromEnv) {
        return stripTrailingSlash(fromEnv);
    }

    const forwardedHost = forwardedHeader(req, 'x-forwarded-host');
    const host = sanitizePublicHost(forwardedHost || req.headers.host || '');
    if (host) {
        return `${resolveProtocol(req)}://${host}`;
    }

    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
        try {
            const u = new URL(origin);
            if (isLocalHost(u.hostname)) {
                const apiPort = process.env.PORT || '5000';
                return `${u.protocol}//${u.hostname}:${apiPort}`;
            }
            u.port = '';
            return u.origin;
        } catch {
            /* fall through */
        }
    }

    return `http://localhost:${process.env.PORT || 5000}`;
}

module.exports = {
    getPublicApiBaseUrl,
    stripTrailingSlash,
};
