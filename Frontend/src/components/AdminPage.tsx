import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  // const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productStock, setProductStock] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) {
    return <h1>Please log in to access this page.</h1>;
  }

  const goToAdminLogs = () => {
    navigate("/adminlogs");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
// Rätt produktfält i frontend
        const response = await axios.post("/api/products", {
          name: productName,
          price: productPrice,
          quantity: productStock, 

      });

      if (response.status === 201) {
        setSuccess("Product created successfully!");
        setProductName("");
        // setProductDescription("");
        setProductPrice(0);
        setProductStock(0);
      }
    } catch (err) {
      setError("Failed to create product. Please try again.");
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Welcome to the Admin Page, {user.username}!</h1>
      <button onClick={goToAdminLogs}>Go to Admin Logs</button>
      <button onClick={logout}>Logout</button>

      <h2>Create a New Product</h2>
      <form onSubmit={handleCreateProduct}>
        <label>
          Product Name:
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </label>
        <br />

        {/* <label>
          Description:
          <textarea
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            required
          />
        </label> */}
        <br />

        <label>
          Price:
          <input
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(Number(e.target.value))}
            required
          />
        </label>
        <br />

        <label>
          Stock:
          <input
            type="number"
            value={productStock}
            onChange={(e) => setProductStock(Number(e.target.value))}
            required
          />
        </label>
        <br />

        <button type="submit">Create Product</button>
      </form>

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AdminPage;
