import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CreateTable = () => {
    const [tableName, setTableName] = useState('');
    const [limit, setLimit] = useState(4);
    const [password, setPassword] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [mode, setMode] = useState('Casual');
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('decantry_token');
        if (!token) {
            alert('Session initializing, please try again.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/lobby/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: tableName,
                    maxPlayers: limit,
                    password,
                    isPrivate,
                    mode
                })
            });

            const data = await response.json();

            if (response.ok) {
                navigate(`/lobby/room/${data.tableId}`);
            } else {
                alert(data.error || 'Failed to create table');
            }
        } catch (error) {
            console.error('Error creating table:', error);
            alert('An error occurred.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px', margin: '0 auto', padding: '20px', position: 'relative' }}>
            <button
                onClick={() => navigate('/')}
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
            <h2 style={{ marginBottom: '30px' }}>Create Table</h2>

            <form onSubmit={handleCreate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Table Name</label>
                    <input
                        type="text"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'transparent',
                            border: '2px solid var(--color-border)',
                            color: 'var(--color-text)',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Player Limit</label>
                    <input
                        type="number"
                        min="2"
                        max="10"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'transparent',
                            border: '2px solid var(--color-border)',
                            color: 'var(--color-text)',
                            fontSize: '1rem',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password (Optional)</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'transparent',
                            border: '2px solid var(--color-border)',
                            color: 'var(--color-text)',
                            fontSize: '1rem',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        id="private-check"
                        style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="private-check">Private Table (Only invited can join)</label>
                </div>

                <button
                    type="submit"
                    style={{
                        padding: '15px',
                        backgroundColor: 'var(--color-text)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        marginTop: '10px',
                        cursor: 'pointer',
                        borderRadius: '8px'
                    }}
                >
                    Create Table
                </button>
            </form>
        </div>
    );
};

export default CreateTable;
