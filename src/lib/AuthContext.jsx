import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '@/api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        checkUserAuth();
    }, []);

    const checkUserAuth = async () => {
        try {
            setIsLoadingAuth(true);
            const res = await api.get('/auth/me');
            setUser(res.data);
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
        } catch (error) {
            console.error('User auth check failed:', error);
            setIsLoadingAuth(false);
            setIsAuthenticated(false);

            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token');
                setAuthError({
                    type: 'auth_required',
                    message: 'Authentication required'
                });
            }
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return res.data;
    };

    const logout = (shouldRedirect = true) => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        if (shouldRedirect) {
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            login,
            logout,
            checkUserAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
