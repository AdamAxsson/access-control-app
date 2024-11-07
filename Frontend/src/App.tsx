import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import UserPage from "./components/UserPage";
import AdminPage from "./components/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Register from "./components/Register";
import AdminLogs from "./components/AdminLogs";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute requiredRole="user" />}>
            <Route path="/userpage" element={<UserPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/adminpage" element={<AdminPage />} />
            <Route path="/adminlogs" element={<AdminLogs />} />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
