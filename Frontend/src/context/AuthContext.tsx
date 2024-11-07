import React, { createContext, useState, useContext, ReactNode } from "react";
import axios from "axios";

interface User {
  username: string;
  role: "admin" | "user";
  token: string; // Lägg till token i User-typen
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });
      const { user: loggedInUser, token } = response.data; // Anta att token kommer med svaret
      setUser({ ...loggedInUser, token }); // Spara även token

      // Spara token i localStorage eller sessionStorage om så önskas
      localStorage.setItem("token", token);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.message || "Invalid credentials");
      } else {
        alert("An error occurred during login");
      }
    }
  };

  const logout = () => {
    setUser(null);
    // Rensa token från localStorage eller sessionStorage
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
