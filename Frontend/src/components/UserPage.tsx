import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import sanitizeHtml from "sanitize-html"; // Importera biblioteket för att sanera användarinmatning

const UserPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>(""); // För att lagra meddelandet
  const [chatMessages, setChatMessages] = useState<string[]>([]); // För att lagra tidigare meddelanden

  // Hämta produkter från servern
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Could not load products.");
      }
    };

    fetchProducts();
  }, []);

  // Funktion för att reservera en produkt
  const handleReserve = async (productId: string, quantity: number) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/reserve",
        { productId, quantity },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      alert(response.data.message);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === productId
            ? { ...product, quantity: product.quantity - quantity }
            : product
        )
      );
    } catch (error) {
      console.error("Error reserving product:", error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  // Funktion för att ta bort en reservation
  const handleCancelReservation = async (productId: string, quantity: number) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/reserve/cancel",
        { productId, quantity },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      alert(response.data.message);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === productId
            ? { ...product, quantity: product.quantity + quantity }
            : product
        )
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  // Funktion för att hantera meddelandeinmatning
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  // Funktion för att skicka meddelande och skydda mot XSS
  const handleSendMessage = () => {
    if (message.trim()) {
      const sanitizedMessage = sanitizeHtml(message, {
        allowedTags: [ 'b', 'i', 'em', 'strong', 'p' ], // Tillåt säkra taggar
        allowedAttributes: {} // Förhindra alla attribut (t.ex. href, onclick etc.)
      });

      setChatMessages((prevMessages) => [...prevMessages, sanitizedMessage]);
      setMessage(""); // Töm inputfältet efter skickat meddelande
    }
  };

  return (
    <div>
      <h1>Welcome to the User Page, {user?.username}!</h1>
      <button onClick={logout}>Logout</button>

      <h2>Products</h2>
      {error && <p>{error}</p>}
      <div>
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product._id}>
              <h3>{product.name}</h3>
              <p>Price: {product.price} SEK</p>
              <p>Available: {product.quantity}</p>
              <button
                onClick={() => handleReserve(product._id, 1)}
                disabled={product.quantity <= 0}
              >
                Reserve 1 Product
              </button>
              <button
                onClick={() => handleCancelReservation(product._id, 1)}
                disabled={product.reservedBy.length === 0}
              >
                Cancel 1 Reservation
              </button>
            </div>
          ))
        ) : (
          <p>No products available</p>
        )}
      </div>

      <h2>Chat</h2>
      <div>
        <div style={{ maxHeight: "200px", overflowY: "scroll", border: "1px solid #ddd", padding: "10px" }}>
          {chatMessages.length > 0 ? (
            chatMessages.map((msg, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: msg }}></p> // Rendera meddelanden med säker HTML
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type your message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default UserPage;
