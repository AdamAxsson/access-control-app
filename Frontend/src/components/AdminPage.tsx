import React from "react";
import { useAuth } from "../context/AuthContext";

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <h1>Please log in to access this page.</h1>;
  }

  return (
    <div>
      <h1>Welcome to the Admin Page, {user.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminPage;
