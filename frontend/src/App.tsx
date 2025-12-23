import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RetroBoard from './pages/RetroBoard';
import JoinRetro from './pages/JoinRetro';

// Redirect component to handle legacy /retro/:retroId URLs
function RedirectToJoin() {
  const { retroId } = useParams<{ retroId: string }>();
  return <Navigate to={`/retro/${retroId}/join`} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* Join/Preview page - no WebSocket connection, safe for Teams bot preview */}
      <Route path="/retro/:retroId/join" element={<JoinRetro />} />
      {/* Actual retro board - WebSocket connection happens here */}
      <Route path="/retro/:retroId/board" element={<RetroBoard />} />
      {/* Legacy route - redirect to join page for backwards compatibility */}
      <Route path="/retro/:retroId" element={<RedirectToJoin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
