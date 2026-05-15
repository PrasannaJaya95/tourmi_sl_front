import axios from 'axios';

function computeDefaultApiBaseUrl() {
    // If the frontend is opened via LAN IP (e.g. http://192.168.x.x:5175),
    // using localhost would point to the *client device*, not the server.
    // So default to the same hostname as the current page.
    if (typeof window !== 'undefined' && window.location?.hostname) {
        return `http://${window.location.hostname}:5004/api`;
    }
    return 'http://localhost:5004/api';
}

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || computeDefaultApiBaseUrl()).replace(/\/?$/, '/'),
    // 90s timeout — handles large image uploads on slower connections
    timeout: 90000,
    // Tell the server we accept compressed responses
    headers: { 'Accept': 'application/json' },
});

export function getServerOrigin() {
    try {
        // baseURL includes "/api/", but we only need the origin for assets like "/uploads/..."
        return new URL(api.defaults.baseURL).origin;
    } catch {
        return (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost:5004';
    }
}

export function resolveServerUrl(urlOrPath, options = {}) {
    if (!urlOrPath || typeof urlOrPath !== 'string') return null;
    
    let url = urlOrPath;
    
    // If it's already a Base64 data URL, return it immediately
    if (urlOrPath.startsWith('data:')) {
        return urlOrPath;
    }

    if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
        const origin = getServerOrigin();
        const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
        url = `${origin}${path}`;
    }

    // Cloudinary Optimization
    if (url.includes('cloudinary.com')) {
        // Only attempt transformation if it's a standard upload URL
        if (url.includes('/upload/')) {
            const parts = url.split('/upload/');
            if (parts.length === 2) {
                const transformations = [];
                transformations.push('q_auto'); // Automatic quality
                transformations.push('f_auto'); // Automatic format
                
                if (options.width) transformations.push(`w_${options.width}`);
                if (options.height) transformations.push(`h_${options.height}`);
                if (options.crop) transformations.push(`c_${options.crop}`);

                return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
            }
        }
    }

    return url;
}

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && [401, 403].includes(error.response.status)) {
            console.error('Authentication Error:', error.response.data.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login if not already there
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
