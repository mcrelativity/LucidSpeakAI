"use client";
import { createContext, useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const fetchInProgressRef = useRef(false);
    const userCacheRef = useRef(null);
    
    const locale = pathname?.split('/')[1] || 'es';
    
    const apiBase = useMemo(() => {
        if (typeof window !== 'undefined') {
            return `http://${window.location.hostname}:8001`;
        }
        return '';
    }, []);

    useEffect(() => {
        if (!apiBase) {
            setLoading(false);
            return;
        }

        // Check both localStorage and sessionStorage
        const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            
            // Return cached user immediately if available
            if (userCacheRef.current) {
                setUser(userCacheRef.current);
                setLoading(false);
                return;
            }
            
            // Prevent duplicate requests
            if (fetchInProgressRef.current) {
                return;
            }
            
            fetchInProgressRef.current = true;
            
            fetch(`${apiBase}/users/me`, {
                headers: { 'Authorization': `Bearer ${storedToken}` }
            })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                setUser(data);
                userCacheRef.current = data;
                setLoading(false);
                fetchInProgressRef.current = false;
            })
            .catch(() => {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                setToken(null);
                setUser(null);
                userCacheRef.current = null;
                setLoading(false);
                fetchInProgressRef.current = false;
            });
        } else {
            setLoading(false);
        }
    }, [apiBase]);

    const login = useCallback(async (email, password, rememberMe = true) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetch(`${apiBase}/token`, {
            method: 'POST',
            body: formData,
        });
        
        if (response.ok) {
            const data = await response.json();
            const new_token = data.access_token;
            
            setToken(new_token);
            
            // Store in localStorage only if rememberMe is true
            if (rememberMe) {
                localStorage.setItem('authToken', new_token);
            } else {
                // Use sessionStorage for non-persistent login
                sessionStorage.setItem('authToken', new_token);
            }
            
            const userResponse = await fetch(`${apiBase}/users/me`, {
                headers: { 'Authorization': `Bearer ${new_token}` }
            });
            const userData = await userResponse.json();
            setUser(userData);
            userCacheRef.current = userData;
            
            setTimeout(() => router.push(`/${locale}/dashboard`), 50);
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to login');
        }
    }, [apiBase, router, locale]);

    const register = useCallback(async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetch(`${apiBase}/register`, {
            method: 'POST',
            body: formData,
        });
        
        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to register');
        }
    }, [apiBase]);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        userCacheRef.current = null;
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        router.push(`/${locale}/login`);
    }, [router, locale]);
    
    const refreshUser = useCallback(async () => {
        if (!token || !apiBase) return;
        
        try {
            const response = await fetch(`${apiBase}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                userCacheRef.current = userData;
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, [token, apiBase]);

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, loading, apiBase, locale }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);