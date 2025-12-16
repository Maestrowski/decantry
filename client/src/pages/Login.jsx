import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('decantry_token', data.token);
                localStorage.setItem('decantry_user', JSON.stringify(data.user));
                window.location.href = '/'; // Force reload to pick up user state
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '30px' }}>Log In</h2>
            <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: '2px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '1rem',
                        borderRadius: '8px'
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: '2px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '1rem',
                        borderRadius: '8px'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-text)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '8px'
                    }}
                >
                    Log In
                </button>
            </form>

            <div style={{ marginTop: '20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`} style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: '2px solid var(--color-border)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }}>
                    <img src="/google.png" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                    Log in with Google
                </a>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Link to="/forgot-password" style={{ color: 'var(--color-gray)', fontSize: '0.9rem', textDecoration: 'none' }}>
                    Forgot Password?
                </Link>
                <div style={{ color: 'var(--color-text)', fontSize: '1rem' }}>
                    Don't have an account? <Link to="/signup" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
