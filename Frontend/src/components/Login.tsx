import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigateRegister = () => {
    navigate("/register");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const specialCharRegex = /[<>&"';]/;
    if (specialCharRegex.test(username) || specialCharRegex.test(password)) {
      alert("Special characters like '<', '>', '&', etc., are not allowed.");
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);

      if (username === "admin") {
        navigate("/adminpage");
      } else if (username === "user") {
        navigate("/userpage");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      if (error.message.includes("Account locked")) {
        setErrorMessage("Account temporarily locked due to too many failed login attempts. Please try again later.");
      } else if (error.response?.status === 500) {
        setErrorMessage("Server error. Please try again later.");
      } else {
        setErrorMessage("Invalid username or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.getElementById("username")?.focus();
  }, []);

  return (
    <>
      <div>
        <h2>Login</h2>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        {isLoading && <p><i className="fa fa-spinner fa-spin" /> Loading...</p>}
        <form onSubmit={handleSubmit}>
          <input
            id="username"
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
          <button type="submit" disabled={isLoading}>Login</button>
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
