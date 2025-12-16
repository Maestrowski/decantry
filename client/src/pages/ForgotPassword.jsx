import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('If an account exists with that email, we have sent a password reset link.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong.');
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            setMessage('Failed to connect to the server.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Reset Password</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-gray)', marginBottom: '30px' }}>
                Enter your email address and we'll send you a link to reset your password.
            </p>

            {status === 'success' ? (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-primary)', marginBottom: '20px', fontSize: '1.1rem' }}>
                        {message}
                    </div>
                    <Link to="/login" style={{ color: 'var(--color-text)', textDecoration: 'underline' }}>
                        Back to Log In
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        style={{
                            padding: '12px',
                            backgroundColor: 'var(--color-text)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            borderRadius: '8px',
                            opacity: status === 'loading' ? 0.7 : 1
                        }}
                    >
                        {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    {status === 'error' && (
                        <div style={{ color: 'var(--color-secondary)', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                    <Link to="/login" style={{ textAlign: 'center', color: 'var(--color-gray)', fontSize: '0.9rem', textDecoration: 'none', marginTop: '10px' }}>
                        Back to Log In
                    </Link>
                </form>
            )}
        </div>
    );
};

export default ForgotPassword;
