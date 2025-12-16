import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, HelpCircle, Settings, Inbox, User, LogOut } from 'lucide-react';
import PasswordModal from './PasswordModal';

const Navbar = ({ user }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [invites, setInvites] = useState([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const navigate = useNavigate();
    const inboxRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inboxRef.current && !inboxRef.current.contains(event.target)) {
                setIsInboxOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (user && !user.isGuest) {
            fetchInvites();
            const interval = setInterval(fetchInvites, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchInvites = async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/user/invites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setInvites(data);
            }
        } catch (error) {
            console.error('Error fetching invites:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('decantry_token');
        localStorage.removeItem('decantry_user');
        window.location.href = '/login';
    };

    const handleRespondInvite = async (inviteId, action, password = '') => {
        const token = localStorage.getItem('decantry_token');
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/user/invites/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ inviteId, action, password })
            });

            if (response.ok) {
                const data = await response.json();
                if (action === 'accept') {
                    navigate(`/lobby/room/${data.tableId}`);
                    setIsInboxOpen(false);
                }
                fetchInvites(); // Refresh list
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to respond to invite');
            }
        } catch (error) {
            console.error('Error responding to invite:', error);
        }
    };

    const onJoinClick = (invite) => {
        if (invite.has_password) {
            setSelectedInvite(invite);
            setShowPasswordModal(true);
        } else {
            handleRespondInvite(invite.id, 'accept');
        }
    };

    const handlePasswordSubmit = (password) => {
        if (selectedInvite) {
            handleRespondInvite(selectedInvite.id, 'accept', password);
            setShowPasswordModal(false);
            setSelectedInvite(null);
        }
    };

    return (
        <nav style={{
            height: '60px',
            borderBottom: '1px solid var(--color-border)',
            top: 0,
            backgroundColor: 'var(--color-bg)',
            zIndex: 1000,
            width: '100%'
        }}>
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setSelectedInvite(null);
                }}
                onSubmit={handlePasswordSubmit}
                tableName={selectedInvite?.table_name}
            />
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 20px',
                height: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/">
                        <img src="/logo.png" alt="Decantry Logo" className="navbar-logo" style={{ height: '40px', width: 'auto' }} />
                    </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/leaderboard" title="Leaderboard">
                        <BarChart2 color="var(--color-text)" size={28} />
                    </Link>
                    <Link to="/help" title="Help">
                        <HelpCircle color="var(--color-text)" size={28} />
                    </Link>
                    <Link to="/settings" title="Settings">
                        <Settings color="var(--color-text)" size={28} />
                    </Link>

                    {user && !user.isGuest ? (
                        <>
                            {!user.isGuest && (
                                <div style={{ position: 'relative' }} ref={inboxRef}>
                                    <div
                                        onClick={() => setIsInboxOpen(!isInboxOpen)}
                                        style={{ cursor: 'pointer', position: 'relative' }}
                                    >
                                        <Inbox color="var(--color-text)" size={28} />
                                        {invites.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',
                                                backgroundColor: 'var(--color-primary)',
                                                borderRadius: '50%',
                                                width: '12px',
                                                height: '12px'
                                            }} />
                                        )}
                                    </div>

                                    {isInboxOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '60px',
                                            right: '-50px',
                                            backgroundColor: 'var(--color-bg)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            zIndex: 1001,
                                            minWidth: '250px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                        }}>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '5px' }}>Inbox</h3>
                                            {invites.length === 0 ? (
                                                <div style={{ color: 'var(--color-gray)', textAlign: 'center', padding: '10px' }}>No invites</div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {invites.map(invite => (
                                                        <div key={invite.id} style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '5px',
                                                            padding: '8px',
                                                            backgroundColor: 'var(--color-dark-gray)',
                                                            borderRadius: '4px'
                                                        }}>
                                                            <div style={{ fontSize: '0.9rem' }}>
                                                                <span style={{ fontWeight: 'bold' }}>{invite.sender_name}</span> invited you to <span style={{ fontStyle: 'italic' }}>{invite.table_name}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onJoinClick(invite);
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '4px',
                                                                        backgroundColor: 'var(--color-primary)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '2px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Join
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRespondInvite(invite.id, 'decline');
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '4px',
                                                                        backgroundColor: 'transparent',
                                                                        border: '1px solid var(--color-gray)',
                                                                        color: 'var(--color-gray)',
                                                                        borderRadius: '2px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
                                title="Profile"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{user.username}</span>
                                <User color="var(--color-text)" size={28} />

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '60px',
                                        right: 0,
                                        backgroundColor: 'var(--color-bg)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        zIndex: 1001,
                                        minWidth: '200px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}>
                                        <div style={{ padding: '10px', borderBottom: '1px solid var(--color-border)', marginBottom: '10px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLogout();
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-text)',
                                                width: '100%',
                                                padding: '8px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <LogOut size={20} />
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Link to="/login" style={{
                                border: '1px solid var(--color-text)',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}>
                                LOG IN
                            </Link>
                            <Link to="/signup" style={{
                                backgroundColor: 'var(--color-text)',
                                color: 'var(--color-bg)',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}>
                                SIGN UP
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
