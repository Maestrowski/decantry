import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Users, ArrowLeft } from 'lucide-react';
import PasswordModal from '../components/PasswordModal';

const JoinTable = () => {
    const { tableId } = useParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [tables, setTables] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [pagination.currentPage, searchTerm]); // Refetch on page or search change

    useEffect(() => {
        if (tableId && tables.length > 0) {
            const targetTable = tables.find(t => t.id === parseInt(tableId));
            if (targetTable) {
                // If table has password, it will be handled by handleJoin -> modal
                handleJoin(targetTable);
            }
        }
    }, [tableId, tables]);

    const fetchTables = async () => {
        try {
            const query = new URLSearchParams({
                page: pagination.currentPage,
                limit: 10,
                search: searchTerm
            });
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/tables?${query.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setTables(data.tables || []);
                if (data.pagination) {
                    setPagination(prev => ({ ...prev, totalPages: data.pagination.totalPages }));
                }
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    const handleJoin = (table) => {
        const token = localStorage.getItem('decantry_token');
        if (!token) {
            alert('Session initializing, please try again.');
            return;
        }

        if (table.has_password) {
            setSelectedTable(table);
            setShowPasswordModal(true);
        } else {
            joinTable(table, '');
        }
    };

    const handlePasswordSubmit = (password) => {
        if (selectedTable) {
            joinTable(selectedTable, password);
            setShowPasswordModal(false);
            setSelectedTable(null);
        }
    };

    const joinTable = async (table, password) => {
        const token = localStorage.getItem('decantry_token');
        try {
            const response = await fetch(`${API_URL}/api/lobby/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tableId: table.id,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok || data.message === 'Already joined') {
                navigate(`/lobby/room/${table.id}`);
            } else {
                alert(data.error || 'Failed to join table');
                if (tableId) navigate('/lobby/join');
            }
        } catch (error) {
            console.error('Error joining table:', error);
            alert('An error occurred.');
        }
    };

    // Client-side filtering removed in favor of server-side search
    const filteredTables = tables;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto', padding: '20px', position: 'relative' }}>
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setSelectedTable(null);
                    if (tableId) navigate('/lobby/join');
                }}
                onSubmit={handlePasswordSubmit}
                tableName={selectedTable?.name}
            />
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
            <h2 style={{ marginBottom: '30px' }}>Join Table</h2>

            <div style={{ display: 'flex', width: '100%', gap: '10px', marginBottom: '30px' }}>
                <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on search
                    }}
                    style={{
                        flex: 1,
                        padding: '15px',
                        backgroundColor: 'transparent',
                        border: '2px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '1.1rem',
                        borderRadius: '8px'
                    }}
                />
                <button
                    onClick={() => navigate('/lobby/create')}
                    style={{
                        padding: '0 20px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Create Table
                </button>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredTables.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-gray)' }}>No tables found. Create one!</div>
                )}
                {filteredTables.map(table => (
                    <div key={table.id} onClick={() => handleJoin(table)} style={{
                        border: '2px solid var(--color-border)',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--color-bg)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>{table.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
                                {table.is_private && <Lock size={14} />}
                                {table.has_password && <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Password Protected</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', marginTop: '5px' }}>Host: {table.host_name}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text)' }}>
                            <Users size={20} />
                            <span style={{ fontWeight: 'bold' }}>{table.current_players}/{table.max_players}</span>
                        </div>
                    </div>
                ))}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            style={{
                                padding: '10px 15px',
                                backgroundColor: pagination.currentPage === 1 ? 'var(--color-bg)' : 'var(--color-primary)',
                                color: pagination.currentPage === 1 ? 'var(--color-gray)' : 'white',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Previous
                        </button>
                        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            style={{
                                padding: '10px 15px',
                                backgroundColor: pagination.currentPage === pagination.totalPages ? 'var(--color-bg)' : 'var(--color-primary)',
                                color: pagination.currentPage === pagination.totalPages ? 'var(--color-gray)' : 'white',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinTable;
