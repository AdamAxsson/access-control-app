import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const apiRequest = async (url: string, body: object) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validation for username and password
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError("Username must only contain letters and numbers.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      // Check password validity on the backend
      await apiRequest("http://localhost:5000/api/check-password", { username, password });

      // Register the user
      const registerData = await apiRequest("http://localhost:5000/api/register", { username, password });

      // Assuming registerData contains a JWT token
      const token = registerData.token; // Make sure the backend sends the token on successful registration

      // Store the JWT token in localStorage or a cookie (make sure it's secure)
      localStorage.setItem("jwtToken", token);

      // Navigate to the user's page (replace "/user" with the correct user page path)
      navigate("/userpage");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
