import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '20px', position: 'relative' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '20px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}
            >
                <ArrowLeft size={24} />
            </button>
            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Settings</h1>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Dark Mode</div>
                    <div style={{ color: 'var(--color-gray)' }}>Adjust the appearance of the game</div>
                </div>
                <div
                    onClick={() => setDarkMode(!darkMode)}
                    style={{
                        width: '50px',
                        height: '26px',
                        backgroundColor: darkMode ? 'var(--color-primary)' : 'var(--color-gray)',
                        borderRadius: '13px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <div style={{
                        width: '22px',
                        height: '22px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: darkMode ? '26px' : '2px',
                        transition: 'left 0.2s'
                    }} />
                </div>
            </div>

            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                Decantry v1.0.0
            </div>
        </div>
    );
};

export default Settings;
