import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

const PasswordModal = ({ isOpen, onClose, onSubmit, tableName }) => {
    const [password, setPassword] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setPassword('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(3px)'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '30px',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                border: '1px solid #333',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '12px',
                        borderRadius: '50%',
                        marginBottom: '15px'
                    }}>
                        <Lock size={32} color="#fff" />
                    </div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>Private Table</h2>
                    {tableName && (
                        <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
                            {tableName}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>
                            Enter Password
                        </label>
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: 'transparent',
                                border: '1px solid #444',
                                color: '#ccc',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#fff',
                                border: 'none',
                                color: '#000',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                transition: 'transform 0.1s'
                            }}
                        >
                            Join Table
                        </button>
                    </div>
                </form>
            </div>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}
            </style>
        </div>
    );
};

export default PasswordModal;
