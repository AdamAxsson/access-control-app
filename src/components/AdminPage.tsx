import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome to the Admin Page, {user}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminPage;
