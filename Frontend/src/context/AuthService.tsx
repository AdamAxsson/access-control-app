// authService.ts
export const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
  
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = exp * 1000;
    const now = Date.now();
  
    if (expirationTime - now < 5 * 60 * 1000) {
      renewToken();
    }
  
    return token;
  };
  
  export const renewToken = async () => {
    try {
      const response = await fetch("/api/protected/renew-token", {
        method: "GET",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const newToken = response.headers.get("Authorization")?.split(" ")[1];
      if (newToken) localStorage.setItem("token", newToken);
    } catch (error) {
      console.error("Failed to renew token:", error);
    }
  };
  
  export const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  