import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, UserPlus, DoorOpen, Gamepad2, Check, X } from 'lucide-react';

const TableRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [table, setTable] = useState(null);
    const [members, setMembers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [gameMode, setGameMode] = useState('Casual');

    // Popup states
    const [showInvite, setShowInvite] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    // Invite form state
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteTab, setInviteTab] = useState('username');
    const [inviteMessage, setInviteMessage] = useState(null);

    const handleInvite = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/lobby/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id, username: inviteUsername })
            });
            const data = await response.json();
            if (response.ok) {
                setInviteMessage({ text: 'Invite sent!', type: 'success' });
                setInviteUsername('');
                setTimeout(() => setInviteMessage(null), 3000);
            } else {
                setInviteMessage({ text: data.error || 'Failed to send invite', type: 'error' });
                setTimeout(() => setInviteMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error sending invite:', error);
            setInviteMessage({ text: 'Error sending invite', type: 'error' });
            setTimeout(() => setInviteMessage(null), 3000);
        }
    };

    const handleKick = async (memberId) => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${API_URL}/api/lobby/kick`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id, memberId })
            });
            setSelectedMember(null);
            fetchTableStatus();
        } catch (error) {
            console.error('Error kicking user:', error);
        }
    };

    const handleMakeHost = async (memberId) => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${API_URL}/api/lobby/transfer-host`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id, newHostId: memberId })
            });
            setSelectedMember(null);
            fetchTableStatus();
        } catch (error) {
            console.error('Error transferring host:', error);
        }
    };

    const fetchTableStatus = React.useCallback(async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/lobby/room/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTable(data.table);
                setMembers(data.members);
                setIsHost(data.isHost);

                if (!data.isHost) {
                    setGameMode(data.table.mode);
                } else if (!table) {
                    setGameMode(data.table.mode);
                }

                // Only navigate if the user is part of the game (was ready)
                if (data.table.status === 'playing') {
                    // We need to check if the current user is in the members list and is ready
                    // However, we need the current user ID. 
                    // We can get it from localStorage if currentUser state is not reliable in this callback
                    const storedUser = JSON.parse(localStorage.getItem('decantry_user') || '{}');
                    // Use loose equality or String casting for ID comparison to be safe
                    const myMember = data.members.find(m => String(m.id) === String(storedUser.id));

                    if (myMember && myMember.is_in_game) {
                        navigate(`/game/multiplayer/${id}`);
                    }
                }
            } else {
                if (response.status === 401) {
                    navigate('/login');
                } else if (response.status === 403 || response.status === 404) {
                    navigate('/lobby/join');
                }
            }
        } catch (error) {
            console.error(error);
        }
    }, [id, table, navigate]);

    useEffect(() => {
        const userStr = localStorage.getItem('decantry_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
        }

        fetchTableStatus();
        const interval = setInterval(fetchTableStatus, 2000);
        return () => clearInterval(interval);
    }, [fetchTableStatus]);

    const handleLeave = async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${API_URL}/api/lobby/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id })
            });
            navigate('/lobby/join');
        } catch (error) {
            console.error('Error leaving table:', error);
        }
    };

    const handleModeChange = async (newMode) => {
        setGameMode(newMode);
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${API_URL}/api/lobby/update-mode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id, mode: newMode })
            });
        } catch (error) {
            console.error('Error updating mode:', error);
        }
    };

    const handleToggleReady = async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${API_URL}/api/lobby/toggle-ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id })
            });
            fetchTableStatus(); // Refresh immediately
        } catch (error) {
            console.error('Error toggling ready:', error);
        }
    };

    // START GAME LOGIC
    const triggerStartGame = async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await fetch(`${API_URL}/api/lobby/start-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId: id })
            });
        } catch (error) {
            console.error('Error starting game:', error);
        }
    };

    const handleStartGame = async () => {
        triggerStartGame();
    };

    if (!table) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading table...</div>;

    const readyCount = members.filter(m => m.is_ready).length;
    const isCurrentUserReady = members.find(m => m.id === currentUser?.id)?.is_ready;

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', width: '100%', position: 'relative' }}>
            {/* Left Navbar */}
            <div style={{
                width: '100px',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '40px 0',
                height: '100%'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '100px' }}>
                    <div
                        onClick={() => setShowInvite(true)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--color-text)' }}
                    >
                        <UserPlus size={28} />
                        <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>Invite</span>
                    </div>
                </div>

                <div
                    onClick={handleLeave}
                    style={{
                        cursor: 'pointer',
                        color: 'var(--color-text)',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    title="Leave Table"
                >
                    <DoorOpen size={32} />
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ marginBottom: '50px', fontSize: '2rem' }}>
                    {table.name}
                    <span style={{ fontSize: '1rem', color: 'var(--color-gray)', marginLeft: '10px' }}>(#{table.id})</span>
                </h2>

                <div style={{ display: 'flex', gap: '40px', width: '100%', maxWidth: '900px', justifyContent: 'center' }}>

                    {/* Players UI */}
                    <div style={{
                        flex: 1,
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '20px',
                        backgroundColor: 'var(--color-bg)',
                        minHeight: '300px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                                <Users size={20} /> Players ({members.length}/{table.max_players})
                            </h3>
                            <span style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>
                                Ready ({readyCount}/{members.length})
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {members.map(member => (
                                <div key={member.id}
                                    onClick={() => {
                                        if (isHost && member.id !== currentUser.id) {
                                            setSelectedMember(member);
                                        }
                                    }}
                                    style={{
                                        padding: '15px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: (isHost && member.id !== currentUser.id) ? 'pointer' : 'default',
                                        border: (isHost && member.id !== currentUser.id) ? '1px solid transparent' : 'none',
                                        transition: 'border-color 0.2s'
                                    }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {member.username}
                                            {member.id === table.host_id && <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--color-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>HOST</span>}
                                            {member.id === currentUser?.id && <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>(You)</span>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', marginTop: '4px' }}>
                                            Points: {member.session_points || 0}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {member.is_in_game && (
                                            <span style={{ marginRight: '10px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                In session
                                            </span>
                                        )}
                                        <Check
                                            size={24}
                                            color={member.is_ready ? '#4ade80' : '#4b5563'}
                                            strokeWidth={3}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gamemode / Settings UI */}
                    <div style={{
                        width: '300px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '20px',
                        backgroundColor: 'var(--color-bg)',
                        height: 'fit-content'
                    }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                            <Gamepad2 size={24} /> Gamemode
                        </h3>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-gray)' }}>Game Mode</label>
                            {isHost ? (
                                <select
                                    value={gameMode}
                                    onChange={(e) => handleModeChange(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--color-bg)',
                                        color: 'var(--color-text)',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="Casual">Casual</option>
                                    <option value="Expert">Expert</option>
                                    <option value="Timed">Timed</option>
                                </select>
                            ) : (
                                <div style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', fontSize: '1rem' }}>
                                    {gameMode}
                                </div>
                            )}
                        </div>

                        {/* Host Controls */}
                        {isHost && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* Host Ready Button */}
                                <button
                                    onClick={handleToggleReady}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: isCurrentUserReady ? 'var(--color-bg)' : 'white',
                                        color: isCurrentUserReady ? 'var(--color-text)' : 'black',
                                        border: isCurrentUserReady ? '1px solid var(--color-border)' : 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {isCurrentUserReady ? 'Cancel / Unready' : 'Ready'}
                                </button>

                                {/* Host Start Game Button (Only if all ready) */}
                                <button
                                    onClick={handleStartGame}
                                    disabled={!members.every(m => m.is_ready) || members.length === 0}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: (members.length > 0 && members.every(m => m.is_ready)) ? '#4ade80' : 'var(--color-bg)',
                                        color: (members.length > 0 && members.every(m => m.is_ready)) ? 'black' : 'var(--color-gray)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: (members.length > 0 && members.every(m => m.is_ready)) ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '1rem',
                                        opacity: (members.length > 0 && members.every(m => m.is_ready)) ? 1 : 0.5
                                    }}
                                >
                                    <Play size={18} fill="currentColor" /> Start Game
                                </button>
                            </div>
                        )}

                        {/* Non-Host Ready Button */}
                        {!isHost && (
                            <button
                                onClick={handleToggleReady}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: isCurrentUserReady ? 'var(--color-bg)' : 'white',
                                    color: isCurrentUserReady ? 'var(--color-text)' : 'black',
                                    border: isCurrentUserReady ? '1px solid var(--color-border)' : 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '1rem'
                                }}
                            >
                                {isCurrentUserReady ? 'Cancel / Unready' : 'Ready'}
                            </button>
                        )}
                    </div>
                </div>
            </div>



            {/* Invite Popup */}
            {
                showInvite && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100
                    }}>
                        <div style={{
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            padding: '30px',
                            width: '400px',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setShowInvite(false)}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Invite Player</h3>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                                <button
                                    onClick={() => setInviteTab('username')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: inviteTab === 'username' ? 'var(--color-primary)' : 'var(--color-text)',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        padding: '5px'
                                    }}
                                >
                                    By Username
                                </button>
                                <button
                                    onClick={() => setInviteTab('link')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: inviteTab === 'link' ? 'var(--color-primary)' : 'var(--color-text)',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        padding: '5px'
                                    }}
                                >
                                    Copy Link
                                </button>
                            </div>

                            {inviteMessage && (
                                <div style={{
                                    marginBottom: '15px',
                                    color: inviteMessage.type === 'error' ? 'red' : 'green',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {inviteMessage.text}
                                </div>
                            )}

                            {inviteTab === 'username' ? (
                                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px' }}>Username</label>
                                        <input
                                            type="text"
                                            value={inviteUsername}
                                            onChange={(e) => setInviteUsername(e.target.value)}
                                            placeholder="Enter username..."
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                                        />
                                    </div>
                                    <button type="submit" style={{ padding: '12px', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        Send Invite
                                    </button>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{
                                        padding: '10px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        wordBreak: 'break-all',
                                        fontSize: '0.9rem',
                                        color: 'var(--color-gray)'
                                    }}>
                                        {`${window.location.origin}/lobby/join/${id}`}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/lobby/join/${id}`);
                                            setInviteMessage({ text: 'Link copied to clipboard!', type: 'success' });
                                            setTimeout(() => setInviteMessage(null), 3000);
                                        }}
                                        style={{ padding: '12px', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            {/* Member Management Popup */}
            {selectedMember && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '30px',
                        width: '400px',
                        position: 'relative',
                        textAlign: 'center'
                    }}>
                        <button
                            onClick={() => setSelectedMember(null)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        <h3 style={{ marginBottom: '20px' }}>Manage {selectedMember.username}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <button
                                onClick={() => handleMakeHost(selectedMember.id)}
                                style={{
                                    padding: '12px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Make Host
                            </button>
                            <button
                                onClick={() => handleKick(selectedMember.id)}
                                style={{
                                    padding: '12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Kick User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableRoom;

