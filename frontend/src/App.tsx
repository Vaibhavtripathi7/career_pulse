import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/login';
import Dashboard from './pages/dashboard';
import ProtectedRoute from './components/shared/protectedroute'; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}