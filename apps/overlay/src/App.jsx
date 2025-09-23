import { Navigate, Route, Routes } from 'react-router-dom';

import AlertOverlay from './screens/AlertOverlay.jsx';
import ChatOverlay from './screens/ChatOverlay.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/overlay/chat" element={<ChatOverlay />} />
      <Route path="/overlay/alert" element={<AlertOverlay />} />
      <Route path="*" element={<Navigate to="/overlay/chat" replace />} />
    </Routes>
  );
}