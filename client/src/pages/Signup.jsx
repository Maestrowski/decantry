import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('decantry_token', data.token);
                localStorage.setItem('decantry_user', JSON.stringify(data.user));
                window.location.href = '/';
            } else {
                alert(data.error || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '30px' }}>Sign Up</h2>
            <form onSubmit={handleSignup} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Sign Up
                </button>
            </form>

            <div style={{ marginTop: '20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-gray)', marginBottom: '10px' }}>
                    Or sign up with Google (Enter username first)
                </div>
                <button
                    onClick={() => {
                        if (!username) {
                            alert('Please enter a username first!');
                            return;
                        }
                        window.location.href = `http://localhost:3000/auth/google/signup?username=${encodeURIComponent(username)}`;
                    }}
                    style={{
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
                        fontSize: '1rem',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    <img src="/google.png" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                    Sign up with Google
                </button>
            </div>
        </div>
    );
};

export default Signup;
