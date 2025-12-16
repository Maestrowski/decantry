import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters long.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Password has been reset successfully.');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to reset password.');
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            setMessage('Failed to connect to the server.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Set New Password</h2>

            {status === 'success' ? (
                <div style={{ textAlign: 'center', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
                    {message}
                    <div style={{ fontSize: '1rem', marginTop: '10px', color: 'var(--color-text)' }}>Redirecting to login...</div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input
                        type="password"
                        placeholder="New Password"
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
                        placeholder="Confirm New Password"
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
                        {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                    </button>
                    {status === 'error' && (
                        <div style={{ color: 'var(--color-secondary)', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                </form>
            )}
        </div>
    );
};

export default ResetPassword;
