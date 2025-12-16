import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState('All');
    const navigate = useNavigate();

    const tabs = ['Casual', 'Expert', 'Timed', 'All'];

    const [data, setData] = useState([]);

    React.useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/leaderboard?mode=${activeTab}`);
                if (response.ok) {
                    const result = await response.json();
                    // Map to format { rank, user, score }
                    const formattedData = result.map((item, index) => ({
                        rank: index + 1,
                        user: item.username,
                        score: item.score
                    }));
                    setData(formattedData);
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        };

        fetchLeaderboard();
    }, [activeTab]);

    return (
        <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', padding: '20px', position: 'relative' }}>
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
            <h1 style={{ marginBottom: '30px' }}>Leaderboard</h1>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === tab ? 'var(--color-text)' : 'transparent',
                            color: activeTab === tab ? 'var(--color-bg)' : 'var(--color-text)',
                            border: '1px solid var(--color-text)',
                            borderRadius: '20px',
                            fontWeight: 'bold'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', padding: '15px', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold' }}>
                    <div style={{ width: '50px' }}>Rank</div>
                    <div style={{ flex: 1 }}>User</div>
                    <div style={{ width: '100px', textAlign: 'right' }}>Score</div>
                </div>
                {data.map(item => (
                    <div key={item.rank} style={{ display: 'flex', padding: '15px', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ width: '50px' }}>{item.rank}</div>
                        <div style={{ flex: 1 }}>{item.user}</div>
                        <div style={{ width: '100px', textAlign: 'right' }}>{item.score}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
