import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../contexts/SoundContext';

const TimedGame = () => {
    const [currentCountry, setCurrentCountry] = useState(null);
    const [guess, setGuess] = useState('');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(10);
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
    const [gameStatus, setGameStatus] = useState('playing'); // playing, finished
    const [feedback, setFeedback] = useState('');
    const navigate = useNavigate();
    const timerRef = useRef(null);
    const { playCorrect, playWrong, playEndGame } = useSound();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const fetchNewCountry = async () => {
        try {
            const response = await fetch(`${API_URL}/api/game/timed`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setCurrentCountry(data);
        } catch (error) {
            console.error('Error fetching game data:', error);
            setFeedback('Error loading data.');
        }
    };

    const saveScore = async (finalScore) => {
        const token = localStorage.getItem('decantry_token');
        if (token && finalScore > 0) {
            try {
                await fetch(`${API_URL}/api/user/score`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ mode: 'timed', points: finalScore })
                });
            } catch (err) {
                console.error('Failed to save score:', err);
            }
        }
    };

    useEffect(() => {
        fetchNewCountry();
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setGameStatus('finished');
                    // Use functional update to get latest score if needed, but here we can rely on state if we are careful
                    // However, inside interval closure 'score' might be stale. 
                    // Better to trigger save in a separate effect or use a ref for score.
                    // For simplicity, let's trigger it via gameStatus effect or just here with a ref.
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, []);

    // Effect to handle game finish and saving score
    useEffect(() => {
        if (gameStatus === 'finished') {
            playEndGame();
            saveScore(score);
        }
    }, [gameStatus, score]); // Added score to dependency

    useEffect(() => {
        if (lives <= 0) {
            clearInterval(timerRef.current);
            setGameStatus('finished');
        }
    }, [lives]);

    const handleGuess = () => {
        if (!guess.trim() || gameStatus !== 'playing' || !currentCountry) return;

        const isCorrect = guess.toLowerCase().trim() === currentCountry.name.toLowerCase();

        if (isCorrect) {
            playCorrect();
            setScore(prev => prev + 100);
            setFeedback('Correct!');
            setTimeout(() => setFeedback(''), 1000);
            fetchNewCountry();
            setGuess('');
        } else {
            playWrong();
            setLives(prev => prev - 1);
            setFeedback(`Wrong! It was ${currentCountry.name}`);
            setTimeout(() => setFeedback(''), 1500);
            fetchNewCountry();
            setGuess('');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (gameStatus === 'finished') {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Game Over</h2>
                <p>Score: {score}</p>
                <p>{lives === 0 ? 'Out of lives!' : 'Time up!'}</p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Back to Menu
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', fontSize: '1.2rem' }}>
                <div>Score: {score}</div>
                <div>Time: {formatTime(timeLeft)}</div>
                <div>Lives: {lives}</div>
            </div>

            <div style={{
                border: '2px solid var(--color-border)',
                padding: '20px',
                width: '100%',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '20px',
                backgroundColor: 'var(--color-bg)',
                fontSize: '1.5rem',
                textAlign: 'center'
            }}>
                {currentCountry ? currentCountry.fact : 'Loading...'}
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Input answer"
                    style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '1.2rem',
                        backgroundColor: 'transparent',
                        border: '2px solid var(--color-border)',
                        color: 'var(--color-text)',
                        outline: 'none'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                />
                <button
                    onClick={handleGuess}
                    style={{
                        padding: '10px 20px',
                        fontSize: '1.2rem',
                        backgroundColor: 'var(--color-text)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    Submit
                </button>
            </div>

            {feedback && (
                <div style={{
                    marginTop: '20px',
                    fontSize: '1.2rem',
                    color: feedback === 'Correct!' ? 'var(--color-primary)' : 'var(--color-secondary)'
                }}>
                    {feedback}
                </div>
            )}
        </div>
    );
};

export default TimedGame;
