import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Heart } from 'lucide-react';

import { useSound } from '../contexts/SoundContext';

const MultiplayerTimedGame = ({ gameData, currentUser, isHost }) => {
    const { id: tableId } = useParams();
    const navigate = useNavigate();
    const { playCorrect, playWrong } = useSound(); // Added useSound

    const [gameId, setGameId] = useState(gameData?.id);
    const [currentCountry, setCurrentCountry] = useState(null);
    const [guess, setGuess] = useState('');
    const [feedback, setFeedback] = useState('');
    const [timeLeft, setTimeLeft] = useState(180);
    const [players, setPlayers] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [myLives, setMyLives] = useState(10);
    const [myScore, setMyScore] = useState(0);
    const [showForfeitModal, setShowForfeitModal] = useState(false);

    const endTimeRef = useRef(null);

    useEffect(() => {
        if (gameData) {
            setGameId(gameData.id);
            fetchNewCountry();
        }
    }, [gameData]);

    const fetchNewCountry = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/timed`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setCurrentCountry(data);
        } catch (error) {
            console.error('Error fetching question:', error);
        }
    };

    // Timer Logic for smooth countdown
    useEffect(() => {
        const interval = setInterval(() => {
            if (endTimeRef.current === null) return;
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0 && !isGameOver) {
                // Client side timeout visual (server will enforce it eventually)
            }
        }, 200);

        return () => clearInterval(interval);
    }, [isGameOver]);

    useEffect(() => {
        if (!gameId) return;

        const fetchStatus = async () => {
            const token = localStorage.getItem('decantry_token');
            if (!token) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/status/${gameId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();

                    // Sync timer
                    if (data.timeLeft !== undefined) {
                        const expectedEndTime = Date.now() + (data.timeLeft * 1000);
                        if (!endTimeRef.current || Math.abs(expectedEndTime - endTimeRef.current) > 1000) {
                            endTimeRef.current = expectedEndTime;
                        }
                    }

                    // Use fallback to empty array to prevents crash if players is undefined
                    setPlayers(data.players || []);
                    setIsGameOver(data.isGameOver);

                    if (currentUser) {
                        const me = (data.players || []).find(p => p.account_id === currentUser.id);
                        if (me) {
                            setMyLives(me.lives);
                            setMyScore(me.score);
                        }
                    }

                    // If table status is 'waiting', return to lobby
                    if (data.tableStatus === 'waiting') {
                        navigate(`/lobby/room/${tableId}`);
                    }
                } else if (response.status === 401) {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 1500); // Polling slightly less frequent since we extrapolate time
        return () => clearInterval(interval);
    }, [gameId, currentUser, navigate, tableId]);

    const handleGuess = async () => {
        if (!guess.trim() || isGameOver || !currentCountry || myLives <= 0) return;

        const isCorrect = guess.toLowerCase().trim() === currentCountry.name.toLowerCase();
        const token = localStorage.getItem('decantry_token');

        // Optimistic update
        if (isCorrect) {
            playCorrect();
            setFeedback('Correct!');
            setMyScore(prev => prev + 100);
        } else {
            playWrong();
            setFeedback(`Wrong! It was ${currentCountry.name}`);
            setMyLives(prev => prev - 1);
        }
        setTimeout(() => setFeedback(''), 1500);
        setGuess('');
        fetchNewCountry();

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameId,
                    score: isCorrect ? 100 : 0,
                    isCorrect,
                    answer: guess
                })
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    };

    const handleReturnToLobby = async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/forfeit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId })
            });
            navigate(`/lobby/room/${tableId}`);
        } catch (error) {
            console.error('Error returning to lobby:', error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (isGameOver) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--color-text)' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Game Over</h2>
                <div style={{ marginBottom: '30px' }}>
                    {players.map((p, index) => (
                        <div key={p.account_id} style={{ fontSize: '1.2rem', margin: '10px 0' }}>
                            {index + 1}. {p.username} : {p.score} points
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleReturnToLobby}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    Return to Lobby
                </button>
            </div>
        );
    }



    const handleForfeitClick = () => {
        setShowForfeitModal(true);
    };

    const confirmForfeit = async () => {
        setShowForfeitModal(false);
        const token = localStorage.getItem('decantry_token');
        if (token) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/forfeit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ tableId: tableId })
                });
            } catch (err) {
                console.error('Error forfeiting:', err);
            }
        }
        navigate(`/lobby/room/${tableId}`);
    };

    const cancelForfeit = () => {
        setShowForfeitModal(false);
    };

    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const topPlayers = sortedPlayers.slice(0, 3);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <button
                onClick={handleForfeitClick}
                style={{
                    position: 'fixed',
                    left: '20px',
                    bottom: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 50
                }}
            >
                Forfeit
            </button>
            {/* Header Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '30px', fontSize: '1.2rem', color: 'var(--color-text)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Trophy size={24} color="#fbbf24" />
                    <span>Score: {myScore}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={24} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Heart size={24} color="#ef4444" fill={myLives > 0 ? "#ef4444" : "none"} />
                    <span>Lives: {myLives}/10</span>
                </div>
            </div>

            {/* Podium / Leaderboard */}
            <div style={{
                width: '100%',
                marginBottom: '30px',
                padding: '15px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{ textAlign: 'center', marginBottom: '15px', color: 'var(--color-gray)' }}>Leaderboard</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topPlayers.map((p, index) => (
                        <div key={p.account_id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            backgroundColor: p.account_id === currentUser?.id ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                            borderRadius: '8px',
                            border: p.account_id === currentUser?.id ? '1px solid var(--color-primary)' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 'bold', width: '20px' }}>{index + 1}.</span>
                                <span style={{ fontWeight: 'bold' }}>{p.username}</span>
                            </div>
                            <div style={{ color: 'var(--color-gray)' }}>
                                <span style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>{p.score} points</span>
                                <span style={{ marginLeft: '10px', fontSize: '0.9rem' }}>({p.lives}/10 lives left)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Game Area */}
            {myLives > 0 ? (
                <>
                    <div style={{
                        border: '2px solid var(--color-border)',
                        padding: '30px',
                        width: '100%',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '30px',
                        backgroundColor: 'var(--color-bg)',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        borderRadius: '16px',
                        color: 'var(--color-text)'
                    }}>
                        {currentCountry ? currentCountry.fact : 'Loading...'}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <input
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            placeholder="Type country name..."
                            style={{
                                flex: 1,
                                padding: '15px',
                                fontSize: '1.2rem',
                                backgroundColor: 'transparent',
                                border: '2px solid var(--color-border)',
                                borderRadius: '8px',
                                color: 'var(--color-text)',
                                outline: 'none'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                            autoFocus
                        />
                        <button
                            onClick={handleGuess}
                            style={{
                                padding: '15px 30px',
                                fontSize: '1.2rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Submit
                        </button>
                    </div>

                    {feedback && (
                        <div style={{
                            marginTop: '20px',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: feedback === 'Correct!' ? '#4ade80' : '#ef4444'
                        }}>
                            {feedback}
                        </div>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '1.5rem', color: '#ef4444' }}>
                    You ran out of lives! Waiting for game to end...
                </div>
            )}

            {/* Forfeit Confirmation Modal */}
            {showForfeitModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '40px',
                        width: '90%',
                        maxWidth: '500px',
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '1.8rem', color: '#ef4444' }}>Warning</h2>
                        <p style={{ fontSize: '1.2rem', marginBottom: '30px', lineHeight: '1.5', color: 'var(--color-text)' }}>
                            Are you sure you want to forfeit? <br />
                            <span style={{ fontWeight: 'bold' }}>You will have to wait for remaining players to finish or forfeit the game.</span>
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button
                                onClick={cancelForfeit}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '1rem',
                                    backgroundColor: 'var(--color-text)',
                                    color: 'var(--color-bg)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmForfeit}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '1rem',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Yes, Forfeit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiplayerTimedGame;
