import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                localStorage.setItem('decantry_token', token);
                localStorage.setItem('decantry_user', JSON.stringify(user));
                window.location.href = '/'; // Force reload to update app state
            } catch (e) {
                console.error('Error parsing user data', e);
                navigate('/login?error=AuthFailed');
            }
        } else {
            navigate('/login?error=AuthFailed');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--color-text)'
        }}>
            <h2>Authenticating...</h2>
        </div>
    );
};

export default OAuthSuccess;
