import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message;
            if (msg) return { success: false, message: msg };
            if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                return {
                    success: false,
                    message:
                        'Cannot reach the API server. Please ensure the backend is running and the VITE_API_URL environment variable is correctly configured.',
                };
            }
            if (!error.response) {
                return { success: false, message: error.message || 'Login failed (no response from server).' };
            }
            return { success: false, message: 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const register = async (email, password, name) => {
        try {
            const { data } = await api.post('/auth/register', { email, password, name });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
