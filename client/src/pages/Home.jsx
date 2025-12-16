import React from 'react';
import { Link } from 'react-router-dom';

import { useSound } from '../contexts/SoundContext';

const GameModeCard = ({ title, description, to, onClick }) => (
    <Link to={to} className="game-card" onClick={onClick}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', width: '100%', wordWrap: 'break-word' }}>{title}</h3>
        {description && <p style={{ fontSize: '0.9rem', color: 'var(--color-gray)' }}>{description}</p>}
    </Link>
);

const Home = () => {
    const { playClick } = useSound();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 'calc(100vh - 60px)', // Full height minus navbar
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px', // Reduced gap
                marginTop: '20px', // Reduced top margin
                flex: 1,
                justifyContent: 'center' // Center vertically
            }}>
                <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '4rem', margin: '0 0 10px 0', letterSpacing: '4px' }}>DECANTRY</h1>

                {/* Top Row: 4 items */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <GameModeCard title="Casual Mode" to="/game/casual" onClick={playClick} />
                    <GameModeCard title="Expert Mode" to="/game/expert" onClick={playClick} />
                    <GameModeCard title="Timed Mode" to="/game/timed" onClick={playClick} />
                    <GameModeCard title="Country of the Day" to="/game/daily" onClick={playClick} />
                </div>

                {/* Bottom Row: 2 items */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <GameModeCard title="Join Table" to="/lobby/join" onClick={playClick} />
                    <GameModeCard title="Create Table" to="/lobby/create" onClick={playClick} />
                </div>
            </div>

            {/* Footer */}
            <div style={{
                width: '100%',
                padding: '20px',
                textAlign: 'center',
                color: 'var(--color-gray)',
                fontSize: '0.8rem',
                marginTop: 'auto'
            }}>
                <div style={{ marginBottom: '10px' }}>
                    <Link to="/privacy-policy" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer', margin: '0 10px' }}>Privacy Policy</Link>
                    |
                    <Link to="/terms-of-service" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer', margin: '0 10px' }}>Terms of Service</Link>
                </div>
                <div>
                    &copy; {new Date().getFullYear()} Decantry. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Home;
