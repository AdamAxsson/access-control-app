import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface LogEntry {
  timestamp: string;
  username: string;
  success: boolean;
  ip: string;
  userAgent: string;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get("/api/login-attempts", {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        setLogs(response.data);
      } catch (error) {
        console.error("Failed to fetch login attempts:", error);
      }
    };

    if (user && user.role === "admin") {
      fetchLogs();
    }
  }, [user]);

  if (!user || user.role !== "admin") {
    return <p>Access denied.</p>;
  }

  return (
    <div>
      <h2>Latest 100 Login Attempts</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Username</th>
            <th>Success</th>
            <th>IP Address</th>
            <th>User-Agent</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.username}</td>
              <td>{log.success ? "Yes" : "No"}</td>
              <td>{log.ip}</td>
              <td>{log.userAgent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminLogs;
