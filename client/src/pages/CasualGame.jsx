import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../contexts/SoundContext';

const CasualGame = () => {
    const [facts, setFacts] = useState([]);
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [score, setScore] = useState(100);
    const [gameStatus, setGameStatus] = useState('loading'); // loading, playing, won, lost
    const [feedback, setFeedback] = useState('');
    const navigate = useNavigate();
    const { playWrong, playEndGame } = useSound();
    const [correctAnswer, setCorrectAnswer] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/game/casual`);
                if (!response.ok) {
                    throw new Error('Failed to fetch game data');
                }
                const data = await response.json();
                setFacts(data.facts);
                setCorrectAnswer(data.country);
                setGameStatus('playing');
            } catch (error) {
                console.error('Error fetching game data:', error);
                setFeedback('Error loading game data. Please try again.');
                setGameStatus('error');
            }
        };

        fetchGameData();
    }, []);

    const handleGuess = async () => {
        if (!guess.trim()) return;

        if (guess.toLowerCase().trim() === correctAnswer.toLowerCase()) {
            playEndGame();
            setGameStatus('won');
            setFeedback(`Correct! You earned ${score} points.`);

            // Save score to DB
            const token = localStorage.getItem('decantry_token');
            if (token) {
                try {
                    await fetch(`${API_URL}/api/user/score`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ mode: 'casual', points: score })
                    });
                } catch (err) {
                    console.error('Failed to save score:', err);
                }
            }
        } else {
            playWrong();
            setFeedback("Incorrect guess.");
            if (currentFactIndex < 9) {
                setCurrentFactIndex(prev => prev + 1);
                setScore(prev => prev - 10);
                setGuess('');
                setTimeout(() => setFeedback(''), 1500);
            } else {
                setGameStatus('lost');
                setFeedback(`Game Over. The country was ${correctAnswer}.`);
            }
        }
    };

    const handleSkip = () => {
        if (currentFactIndex < 9) {
            setCurrentFactIndex(prev => prev + 1);
            setScore(prev => prev - 10);
            setFeedback('Skipped.');
            setTimeout(() => setFeedback(''), 1000);
        } else {
            setGameStatus('lost');
            setFeedback(`Game Over. The country was ${correctAnswer}.`);
        }
    };

    if (gameStatus === 'loading') return <div>Loading...</div>;
    if (gameStatus === 'error') return <div style={{ textAlign: 'center', marginTop: '50px' }}>{feedback}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Points: {score}</h2>

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
                <div style={{ fontSize: '1rem', color: 'var(--color-gray)', marginBottom: '10px' }}>
                    Fact {currentFactIndex + 1}
                </div>
                {facts[currentFactIndex]}
            </div>

            {gameStatus === 'playing' && (
                <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '20px' }}>
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
                    <button
                        onClick={handleSkip}
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2rem',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text)',
                            border: '2px solid var(--color-border)',
                            fontWeight: 'bold'
                        }}
                    >
                        Skip
                    </button>
                </div>
            )}

            {feedback && (
                <div style={{
                    marginBottom: '20px',
                    fontSize: '1.2rem',
                    color: gameStatus === 'won' ? 'var(--color-primary)' : 'var(--color-secondary)'
                }}>
                    {feedback}
                </div>
            )}

            {/* Progress Indicators */}
            <div style={{ display: 'flex', gap: '5px' }}>
                {facts.map((_, index) => (
                    <div key={index} style={{
                        width: '30px',
                        height: '30px',
                        border: '2px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: index === currentFactIndex ? 'var(--color-dark-gray)' : 'transparent',
                        color: index < currentFactIndex ? 'var(--color-gray)' : 'var(--color-text)'
                    }}>
                        {index + 1}
                    </div>
                ))}
            </div>

            {(gameStatus === 'won' || gameStatus === 'lost') && (
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
            )}
        </div>
    );
};

export default CasualGame;
