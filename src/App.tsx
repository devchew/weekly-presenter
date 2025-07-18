import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import CreateTeam from './pages/CreateTeam';
import TeamBoard from './pages/TeamBoard';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateTeam />} />
        <Route path="/team/:teamId" element={<TeamBoard />} />
      </Routes>
    </HashRouter>
  );
}

export default App;