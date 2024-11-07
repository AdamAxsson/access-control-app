import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const navigateRegister = () => {
    navigate("/register");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Utökad validering av specialtecken
    const specialCharRegex = /[<>&"';]/;
    if (specialCharRegex.test(username) || specialCharRegex.test(password)) {
      alert("Special characters like '<', '>', '&', etc., are not allowed.");
      return;
    }

    try {
      await login(username, password);
      
      // Om inloggning lyckas, navigera beroende på roll
      if (username === "admin") {
        navigate("/adminpage");
      } else if (username === "user") {
        navigate("/userpage");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      // Hantera inloggningsfel
      if (error.message.includes("Account locked")) {
        setErrorMessage("Account temporarily locked due to too many failed login attempts. Please try again later.");
      } else {
        setErrorMessage("Invalid username or password.");
      }
    }
  };

  return (
    <>
      <div>
        <h2>Login</h2>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
      <div>
        <h2>Register new user</h2>
        <button type="button" onClick={navigateRegister}>Register here</button>
      </div>
    </>
  );
};

export default Login;
