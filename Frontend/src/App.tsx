import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import UserPage from './components/UserPage';
import AdminPage from './components/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Register from './components/Register';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login Route */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register/>} />

          
          {/* Protected Route for user */}
          <Route element={<ProtectedRoute requiredRole="user" />}>
            <Route path="/userpage" element={<UserPage />} />
          </Route>

          {/* Protected Route for admin */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/adminpage" element={<AdminPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
