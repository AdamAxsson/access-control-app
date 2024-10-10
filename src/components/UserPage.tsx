import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome to the User Page, {user}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default UserPage;
