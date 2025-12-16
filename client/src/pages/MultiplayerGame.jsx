import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Check, X, ArrowLeft } from 'lucide-react';
import MultiplayerExpertGame from './MultiplayerExpertGame';
import MultiplayerTimedGame from './MultiplayerTimedGame';


import { useSound } from '../contexts/SoundContext';

const MultiplayerGame = () => {
    const { id } = useParams(); // tableId
    const navigate = useNavigate();
    const { playCorrect, playWrong, playEndGame } = useSound();

    const [gameData, setGameData] = useState(null);
    const [guess, setGuess] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
    const [score, setScore] = useState(100);
    const [gameOver, setGameOver] = useState(false);

    // Game State
    const [currentFactIndex, setCurrentFactIndex] = useState(0);

    // Multiplayer states
    const [isWaiting, setIsWaiting] = useState(false);
    const [gameStatus, setGameStatus] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [showForfeitModal, setShowForfeitModal] = useState(false);

    // Effect to play endgame sound
    useEffect(() => {
        if (gameStatus && gameStatus.isGameOver) {
            playEndGame();
        }
    }, [gameStatus?.isGameOver]);



    useEffect(() => {
        const userStr = localStorage.getItem('decantry_user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        const fetchGameData = async () => {
            const token = localStorage.getItem('decantry_token');
            if (!token) return;

            try {
                // Check if user is host
                const tableRes = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/room/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (tableRes.ok) {
                    const tableData = await tableRes.json();
                    setIsHost(tableData.isHost);
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setGameData(data);
                } else {
                    console.error('Failed to load game data');
                }
            } catch (error) {
                console.error('Error fetching game data:', error);
            }
        };

        fetchGameData();
    }, [id]);

    // Poll for game status if waiting or game over
    useEffect(() => {
        if (!gameData) return;

        const pollStatus = async () => {
            const token = localStorage.getItem('decantry_token');
            if (!token) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/status/${gameData.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const status = await response.json();
                    setGameStatus(status);

                    // If table status is 'waiting', return to lobby
                    if (status.tableStatus === 'waiting') {
                        navigate(`/lobby/room/${id}`);
                    }
                } else if (response.status === 401) {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error polling status:', error);
            }
        };

        const interval = setInterval(pollStatus, 2000);
        return () => clearInterval(interval);
    }, [gameData, id, navigate]);

    const handleGuess = async (e) => {
        e.preventDefault();
        if (!gameData || gameOver || isWaiting) return;

        if (guess.trim().toLowerCase() === gameData.country.toLowerCase()) {
            // Correct Guess
            playCorrect();
            setFeedback('correct');
            setGameOver(true);
            setIsWaiting(true);

            // Submit score
            const token = localStorage.getItem('decantry_token');
            if (token) {
                await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ gameId: gameData.id, score: score })
                });
            }
        } else {
            // Incorrect Guess
            playWrong();
            setFeedback('incorrect');
            setGuess('');

            // Move to next fact if available
            if (currentFactIndex < gameData.facts.length - 1) {
                setCurrentFactIndex(prev => prev + 1);
                setScore(prev => Math.max(0, prev - 10));
                setTimeout(() => setFeedback(null), 1000);
            } else {
                // Out of facts
                setScore(0);
                setGameOver(true);
                setIsWaiting(true);
                // Submit 0 score
                const token = localStorage.getItem('decantry_token');
                if (token) {
                    await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/submit`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ gameId: gameData.id, score: 0 })
                    });
                }
            }
        }
    };

    const handleSkip = () => {
        if (!gameData || gameOver || isWaiting) return;

        if (currentFactIndex < gameData.facts.length - 1) {
            setCurrentFactIndex(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 10));
        } else {
            // Out of facts
            setScore(0);
            setGameOver(true);
            setIsWaiting(true);
            // Submit 0 score
            const token = localStorage.getItem('decantry_token');
            if (token) {
                fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ gameId: gameData.id, score: 0 })
                });
            }
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
                body: JSON.stringify({ tableId: id })
            });
            navigate(`/lobby/room/${id}`);
        } catch (error) {
            console.error('Error returning to lobby:', error);
        }
    };

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
                    body: JSON.stringify({ tableId: id })
                });
            } catch (err) {
                console.error('Error forfeiting:', err);
            }
        }
        navigate(`/lobby/room/${id}`);
    };

    const cancelForfeit = () => {
        setShowForfeitModal(false);
    };

    if (!gameData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading game...</div>;

    // Render Expert Game if mode matches
    if (gameData.mode === 'Expert') {
        return <MultiplayerExpertGame gameData={gameData} currentUser={currentUser} isHost={isHost} />;
    }

    // Render Timed Game if mode matches
    if (gameData.mode === 'Timed') {
        return <MultiplayerTimedGame gameData={gameData} currentUser={currentUser} isHost={isHost} />;
    }

    // Show Summary if Game Over for everyone
    if (gameStatus && gameStatus.isGameOver) {
        return (
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'var(--color-text)', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '40px' }}>Game Over!</h1>
                <div style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    padding: '30px',
                    marginBottom: '30px'
                }}>
                    <h2 style={{ color: '#4ade80', marginBottom: '20px' }}>The country was {gameData.country}</h2>

                    <h3 style={{ marginBottom: '20px' }}>Results</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                        {gameStatus.results.map((result, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '15px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontWeight: 'bold' }}>{result.username}</span>
                                <span style={{ fontWeight: 'bold', color: '#4ade80' }}>{result.score} pts</span>
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
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            color: 'white'
        }}>
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
            {/* Points Header */}
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '40px' }}>
                Points: {score}
            </h1>

            {/* Fact Box */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                aspectRatio: '16/9',
                backgroundColor: '#111', // Very dark bg
                border: '1px solid #333',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <div style={{ color: '#666', marginBottom: '20px', fontSize: '1rem' }}>
                    Fact {currentFactIndex + 1}
                </div>
                <div style={{ fontSize: '1.5rem', lineHeight: '1.4' }}>
                    {gameData.facts[currentFactIndex] || "No more facts available."}
                </div>
            </div>

            {/* Input and Buttons */}
            {!gameOver && !isWaiting ? (
                <form onSubmit={handleGuess} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '600px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Input answer"
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#222',
                            border: '1px solid #444',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                        autoFocus
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'white',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Submit
                    </button>
                    <button
                        type="button"
                        onClick={handleSkip}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#222',
                            color: 'white',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Skip
                    </button>
                </form>
            ) : (
                <div style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#4ade80' }}>
                    {isWaiting ? "Waiting for other players..." : "Game Over"}
                </div>
            )}

            {/* Feedback Toast */}
            {feedback === 'incorrect' && (
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                }}>
                    Incorrect! Next Fact...
                </div>
            )}

            {/* Pagination 1-10 */}
            <div style={{ display: 'flex', gap: '5px' }}>
                {[...Array(10)].map((_, i) => (
                    <div key={i} style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: i === currentFactIndex ? '#444' : '#222',
                        border: '1px solid #333',
                        color: i === currentFactIndex ? 'white' : '#666',
                        borderRadius: '2px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}>
                        {i + 1}
                    </div>
                ))}
            </div>

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

export default MultiplayerGame;
