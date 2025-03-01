import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ky from 'ky';
import Cookies from 'js-cookie'; 
import styles from './AuthForm.module.css';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

function VendorLogin() {
    const { vendorLogIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        
        try {
            console.log('Attempting vendor login for:', email);
            const response = await ky.post(`${API_BASE_URL}/api/vendor/login`, {
                json: { email, password },
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).json();

            console.log('Login response:', response);

            if (response.message === 'Login successful') {
                vendorLogIn(response.vendorName);
                Cookies.set('sessionId', response.sessionId, { 
                    secure: false, 
                    sameSite: 'lax',
                    path: '/'
                });
                setMessage('Login successful! Redirecting...');
                setTimeout(() => navigate('/vendor-dashboard'), 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = await error.response?.json().catch(() => ({ error: 'Login failed' }));
            setMessage(`Login failed: ${errorMessage.error || 'Please check your credentials.'}`);
        }
    };

    const navigateToVendorSignup = () => {
        navigate('/vendor-signup');
    };

    return (
        <div className={styles["auth-form-container"]}>
            <h2 className={styles["auth-form-title"]}>Vendor Login</h2>
            <form onSubmit={handleSubmit} className={styles["auth-form"]}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles["auth-input"]}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={styles["auth-input"]}
                />
                <button type="submit" className={styles["auth-button"]}>
                    Login
                </button>
            </form>
            {message && <p className={styles["auth-message"]}>{message}</p>}
            
            <div className={styles["vendor-section"]}>
                <h3>New to Elysian?</h3>
                <button onClick={navigateToVendorSignup} className={styles["vendor-button"]}>
                    Apply as Vendor
                </button>
            </div>
        </div>
    );
}

export default VendorLogin;