import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Check, X, ArrowRight } from 'lucide-react';

import { useSound } from '../contexts/SoundContext';

const MultiplayerExpertGame = ({ gameData, currentUser, isHost }) => {
    const { id } = useParams(); // tableId
    const navigate = useNavigate();
    const { playCorrect, playWrong, playEndGame } = useSound();

    const [guess, setGuess] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [roundStatus, setRoundStatus] = useState('playing'); // playing, waiting, feedback
    const [feedbackData, setFeedbackData] = useState(null);
    const [totalScores, setTotalScores] = useState([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [nextRoundVotes, setNextRoundVotes] = useState({ count: 0, needed: 1, hasVoted: false });
    const endTimeRef = useRef(null);

    const currentRoundIndex = gameData.currentRound;
    const currentRoundData = gameData.rounds[currentRoundIndex];

    const [showForfeitModal, setShowForfeitModal] = useState(false);

    const handleForfeitClick = () => {
        setShowForfeitModal(true);
    };

    const confirmForfeit = async () => {
        setShowForfeitModal(false);
        const token = localStorage.getItem('decantry_token');
        if (token) {
            try {
                // Toggle ready to false to prevent auto-rejoin
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

    // Timer Logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (endTimeRef.current === null) return;
            const now = Date.now();
            // Use Math.ceil to favor showing 1s instead of 0s until fully elapsed
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0 && roundStatus === 'playing' && !hasSubmitted) {
                handleSubmitAnswer(true); // Auto-submit on timeout
            }
        }, 100); // Check more frequently for smoothness

        return () => clearInterval(interval);
    }, [roundStatus, hasSubmitted]);

    // Play endgame sound when game is finished (last round and in feedback)
    useEffect(() => {
        if (roundStatus === 'feedback' && currentRoundIndex === gameData.rounds.length - 1) {
            playEndGame();
        }
    }, [roundStatus, currentRoundIndex, gameData.rounds.length]);

    // Poll Status
    // Calculate expected end time based on local clock
    // status.timeLeft is seconds remaining calculated by server
    // Poll Status
    useEffect(() => {
        const pollStatus = async () => {
            const token = localStorage.getItem('decantry_token');
            if (!token) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/status/${gameData.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const status = await response.json();

                    // Sync timer with server
                    if (status.timeLeft !== undefined) {
                        // Calculate expected end time based on local clock
                        // status.timeLeft is seconds remaining calculated by server
                        const expectedEndTime = Date.now() + (status.timeLeft * 1000);

                        // Set initially or drift correction if >1s off
                        if (!endTimeRef.current || Math.abs(expectedEndTime - endTimeRef.current) > 1000) {
                            endTimeRef.current = expectedEndTime;
                        }
                    }

                    // Update total scores
                    if (status.totalScores) {
                        setTotalScores(status.totalScores);
                    }

                    // Update vote status
                    if (status.votesCount !== undefined) {
                        setNextRoundVotes({
                            count: status.votesCount,
                            needed: status.totalPlayers,
                            hasVoted: status.hasVoted
                        });
                    }

                    // Check if round is complete
                    // If everyone finished OR time is up
                    if (status.roundComplete || (timeLeft === 0 && status.finishedCount > 0)) {
                        if (roundStatus !== 'feedback') {
                            setFeedbackData(status);
                            setRoundStatus('feedback');
                        }
                    }

                    // Check if game moved to next round (server currentRound > local currentRound)
                    if (status.currentRound > currentRoundIndex) {
                        window.location.reload();
                    }

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

        pollStatus(); // Fetch immediately
        const interval = setInterval(pollStatus, 2000);
        return () => clearInterval(interval);
    }, [gameData.id, currentRoundIndex, timeLeft, roundStatus, navigate, id]);

    const handleSubmitAnswer = async (isTimeout = false) => {
        if (hasSubmitted) return;
        setHasSubmitted(true);
        setRoundStatus('waiting');

        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        const answer = isTimeout ? '(Time out)' : guess;
        const isCorrect = !isTimeout && answer.trim().toLowerCase() === currentRoundData.country.toLowerCase();

        // Play sound
        if (isCorrect) {
            playCorrect();
        } else {
            playWrong();
        }

        const points = isCorrect ? 100 : 0;

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameId: gameData.id,
                    round: currentRoundIndex,
                    answer: answer,
                    score: points,
                    isCorrect: isCorrect
                })
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    };

    const handleNextRound = async () => {
        const token = localStorage.getItem('decantry_token');
        if (!token) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/game/multiplayer/next-round`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ gameId: gameData.id })
            });

            const data = await response.json();

            // Immediate feedback
            setNextRoundVotes(prev => ({ ...prev, hasVoted: true }));

            if (data.gameOver) {
                // Handle Game Over
                playEndGame();
                // Maybe redirect to lobby or show final summary
                // For now, let's just wait for the poll to redirect us
            } else {
                window.location.reload(); // Force refresh to get new round data
            }

        } catch (error) {
            console.error('Error starting next round:', error);
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

    // Calculate my current total score
    const myTotalScore = totalScores.find(s => s.account_id === currentUser?.id)?.total_score || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px', color: 'var(--color-text)' }}>
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', alignItems: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>Score: {myTotalScore}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', color: timeLeft < 10 ? '#ef4444' : 'var(--color-text)' }}>
                    <Clock size={24} /> {timeLeft}s
                </div>
            </div>

            <div style={{ marginBottom: '10px' }}>Round {currentRoundIndex + 1} / {gameData.rounds.length}</div>

            {/* Fact Box */}
            <div style={{
                border: '2px solid var(--color-border)',
                padding: '40px',
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
                borderRadius: '16px'
            }}>
                {currentRoundData.fact}
            </div>

            {/* Input Area */}
            {roundStatus === 'playing' && (
                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '600px' }}>
                    <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Type your answer..."
                        disabled={hasSubmitted}
                        style={{
                            flex: 1,
                            padding: '15px',
                            fontSize: '1.2rem',
                            backgroundColor: 'transparent',
                            border: '2px solid var(--color-border)',
                            color: 'var(--color-text)',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && !hasSubmitted && handleSubmitAnswer()}
                        autoFocus
                    />
                    <button
                        onClick={() => handleSubmitAnswer()}
                        disabled={hasSubmitted}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.2rem',
                            backgroundColor: hasSubmitted ? 'var(--color-gray)' : 'var(--color-text)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: hasSubmitted ? 'default' : 'pointer'
                        }}
                    >
                        {hasSubmitted ? 'Submitted' : 'Submit'}
                    </button>
                </div>
            )}

            {roundStatus === 'waiting' && (
                <div style={{ marginTop: '20px', fontSize: '1.2rem', color: 'var(--color-gray)' }}>
                    Waiting for other players...
                </div>
            )}

            {/* Feedback Popup */}
            {roundStatus === 'feedback' && feedbackData && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '40px',
                        width: '90%',
                        maxWidth: '600px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>Round Results</h2>

                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ color: 'var(--color-gray)', marginBottom: '5px' }}>Correct Answer</div>
                            <div style={{ fontSize: '1.8rem', color: '#4ade80', fontWeight: 'bold' }}>{currentRoundData.country}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
                            {feedbackData.roundResults.map((result, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{result.username}</span>
                                        <span style={{ color: 'var(--color-gray)' }}>guessed:</span>
                                        <span style={{ color: result.is_correct ? '#4ade80' : '#ef4444' }}>{result.answer}</span>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {result.is_correct ? '+100' : '0'} pts
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Next Round / Voting UI */}
                        {currentRoundIndex < gameData.rounds.length - 1 ? (
                            <div style={{ textAlign: 'center' }}>
                                {!nextRoundVotes.hasVoted ? (
                                    <button
                                        onClick={handleNextRound}
                                        style={{
                                            padding: '15px 30px',
                                            fontSize: '1.2rem',
                                            backgroundColor: 'var(--color-primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            margin: '0 auto'
                                        }}
                                    >
                                        Ready for Next Round <ArrowRight size={20} />
                                    </button>
                                ) : (
                                    <div style={{ color: 'var(--color-text)', fontSize: '1.1rem' }}>
                                        <div style={{ marginBottom: '10px', color: '#4ade80', fontWeight: 'bold' }}>You are ready!</div>
                                        <div style={{ color: 'var(--color-gray)' }}>
                                            Waiting for others... ({nextRoundVotes.count}/{nextRoundVotes.needed})
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleReturnToLobby}
                                style={{
                                    padding: '15px 30px',
                                    fontSize: '1.2rem',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    margin: '0 auto'
                                }}
                            >
                                Finish Game & Return to Lobby
                            </button>
                        )}
                    </div>
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
                        <p style={{ fontSize: '1.2rem', marginBottom: '30px', lineHeight: '1.5' }}>
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

export default MultiplayerExpertGame;
