import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <h1>Please log in to access this page.</h1>;
  }

  const goToAdminLogs = () => {
    navigate("/adminlogs");
  };

  return (
    <div>
      <h1>Welcome to the Admin Page, {user.username}!</h1>
      <button onClick={goToAdminLogs}>Go to Admin Logs</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminPage;
