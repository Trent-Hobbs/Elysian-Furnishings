import React, { createContext, useContext, useState, useEffect } from 'react';
import ky from 'ky';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isVendorLoggedIn, setIsVendorLoggedIn] = useState(false);
    const [vendorName, setVendorName] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await ky.get(`${API_BASE_URL}/api/check-session`, {
                    credentials: 'include'
                }).json();
                if (response.isAuthenticated) {
                    setUser({ id: response.userId });
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const logIn = async (email, password) => {
        try {
            const response = await ky.post(`${API_BASE_URL}/api/login`, {
                json: { email, password },
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).json();
            
            if (response.message === 'Login successful') {
                setUser({ id: response.userId });
                setIsLoggedIn(true);
                Cookies.set('sessionId', response.sessionId, { 
                    secure: false, 
                    sameSite: 'lax',
                    path: '/'
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logOut = async () => {
        try {
            await ky.post(`${API_BASE_URL}/api/logout`, {
                credentials: 'include'
            });
            setUser(null);
            setIsLoggedIn(false);
            setIsVendorLoggedIn(false);
            setVendorName('');
            Cookies.remove('sessionId');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const vendorLogIn = async (vendorName) => {
        setIsVendorLoggedIn(true);
        setVendorName(vendorName);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            logIn, 
            logOut, 
            loading,
            isLoggedIn,
            isVendorLoggedIn,
            vendorName,
            vendorLogIn // Add this
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
