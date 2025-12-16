import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import Home from './pages/Home';
import CasualGame from './pages/CasualGame';
import ExpertGame from './pages/ExpertGame';
import TimedGame from './pages/TimedGame';
import DailyGame from './pages/DailyGame';
import CreateTable from './pages/CreateTable';
import JoinTable from './pages/JoinTable';
import TableRoom from './pages/TableRoom';
import MultiplayerGame from './pages/MultiplayerGame';
import Leaderboard from './pages/Leaderboard';
import Help from './pages/Help';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OAuthSuccess from './pages/OAuthSuccess';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Placeholder for pages not yet implemented
const Placeholder = ({ title }) => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h2>{title}</h2>
    <p>Coming soon...</p>
  </div>
);

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('decantry_user');
      const storedToken = localStorage.getItem('decantry_token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      } else {
        // Create guest session
        try {
          const response = await fetch('http://localhost:3000/api/auth/guest', { method: 'POST' });
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('decantry_token', data.token);
            localStorage.setItem('decantry_user', JSON.stringify(data.user));
            setUser(data.user);
          }
        } catch (error) {
          console.error('Failed to create guest session:', error);
        }
      }
    };
    initAuth();
  }, []);

  return (
    <Router>
      <Layout user={user}>

        {user && user.isGuest && (
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            color: 'var(--color-gray)',
            fontSize: '0.9rem',
            zIndex: 999
          }}>
            {user.username}
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/casual" element={<CasualGame />} />
          <Route path="/game/expert" element={<ExpertGame />} />
          <Route path="/game/timed" element={<TimedGame />} />
          <Route path="/game/daily" element={<DailyGame />} />
          <Route path="/lobby/join" element={<JoinTable />} />
          <Route path="/lobby/join/:tableId" element={<JoinTable />} />
          <Route path="/lobby/create" element={<CreateTable />} />
          <Route path="/lobby/room/:id" element={<TableRoom />} />
          <Route path="/game/multiplayer/:id" element={<MultiplayerGame />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/help" element={<Help />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
