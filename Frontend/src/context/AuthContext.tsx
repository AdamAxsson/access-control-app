import React, { createContext, useState, useContext, ReactNode } from "react";
import axios from "axios";

// Definiera User-typen med token
interface User {
  username: string;
  role: "admin" | "user"; // Här säkerställer vi att `role` är en strikt typ
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Hämta token från localStorage om den finns
  const storedToken = localStorage.getItem("token");
  
  // Initialisera användare baserat på om token finns
  const initialUser: User | null = storedToken
    ? { username: "", role: "user", token: storedToken } // Här initialiseras med token och en default användartyp
    : null;

  const [user, setUser] = useState<User | null>(initialUser); // Använd initialUser för state

  // Login-funktion för att autentisera användaren och lagra token
  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });
      const { user: loggedInUser, token } = response.data; // Anta att token skickas tillbaka från servern
      setUser({ ...loggedInUser, token }); // Spara användarinfo och token i state

      // Spara token i localStorage för framtida användning
      localStorage.setItem("token", token);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.message || "Invalid credentials");
      } else {
        alert("An error occurred during login");
      }
    }
  };

  // Logout-funktion som rensar användardata och tar bort token
  const logout = () => {
    setUser(null); // Rensa användardata från state
    localStorage.removeItem("token"); // Rensa token från localStorage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook för att använda AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
