import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Help = () => {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', padding: '20px', position: 'relative' }}>
            <button
                onClick={() => navigate(-1)}
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
            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>How to Play</h1>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>Casual Mode</h2>
                <p>Guess the country based on 10 facts. You start with Fact 1 (100 points). If you guess wrong or skip, you get the next fact for fewer points.</p>
                <ul>
                    <li>Fact 1: 100 points</li>
                    <li>Fact 2: 90 points</li>
                    <li>...</li>
                    <li>Fact 10: 10 points</li>
                </ul>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>Expert Mode</h2>
                <p>Guess 10 countries with only 1 fact each (Fact #6-10). You get 100 points for every correct guess.</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>Timed Mode</h2>
                <p>Guess as many countries as you can in 3 minutes. You have 10 lives. Each correct guess is 100 points.</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>Country of the Day</h2>
                <p>A daily challenge available once every 24 hours. Everyone gets the same country. 100 points for a correct guess.</p>
            </div>
        </div>
    );
};

export default Help;
