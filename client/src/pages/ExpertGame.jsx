import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../contexts/SoundContext';

const ExpertGame = () => {
    const [countries, setCountries] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [score, setScore] = useState(0);
    const [gameStatus, setGameStatus] = useState('loading'); // loading, playing, feedback, finished
    const [feedback, setFeedback] = useState('');
    const navigate = useNavigate();
    const { playCorrect, playWrong, playEndGame } = useSound();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/game/expert`);
                if (!response.ok) {
                    throw new Error('Failed to fetch game data');
                }
                const data = await response.json();
                setCountries(data);
                setGameStatus('playing');
            } catch (error) {
                console.error('Error fetching game data:', error);
                setFeedback('Error loading game data. Please try again.');
                setGameStatus('error');
            }
        };

        fetchGameData();
    }, []);

    const handleGuess = () => {
        if (!guess.trim()) return;

        const currentCountry = countries[currentIndex];
        const isCorrect = guess.toLowerCase().trim() === currentCountry.name.toLowerCase();

        if (isCorrect) {
            playCorrect();
            setScore(prev => prev + 100);
            setFeedback('Correct!');
        } else {
            playWrong();
            setFeedback(`Incorrect. The answer was ${currentCountry.name}.`);
        }
        setGameStatus('feedback');
    };

    const handleNext = async () => {
        if (currentIndex < 9) {
            setCurrentIndex(prev => prev + 1);
            setGuess('');
            setFeedback('');
            setGameStatus('playing');
        } else {
            playEndGame();
            setGameStatus('finished');
            // Save score to DB
            const token = localStorage.getItem('decantry_token');
            if (token && score > 0) {
                try {
                    await fetch(`${API_URL}/api/user/score`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ mode: 'expert', points: score })
                    });
                } catch (err) {
                    console.error('Failed to save score:', err);
                }
            }
        }
    };

    if (gameStatus === 'loading') return <div>Loading...</div>;
    if (gameStatus === 'error') return <div style={{ textAlign: 'center', marginTop: '50px' }}>{feedback}</div>;

    if (gameStatus === 'finished') {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Game Over</h2>
                <p>Total Score: {score}</p>
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
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Score: {score}</h2>
            <div style={{ marginBottom: '10px' }}>Country {currentIndex + 1} / 10</div>

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
                {countries[currentIndex].fact}
            </div>

            {gameStatus === 'playing' ? (
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
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '1.5rem', color: feedback === 'Correct!' ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                        {feedback}
                    </div>
                    <button
                        onClick={handleNext}
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2rem',
                            backgroundColor: 'var(--color-text)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        Next Country
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExpertGame;
