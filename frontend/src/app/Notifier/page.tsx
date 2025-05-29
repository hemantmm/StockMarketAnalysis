'use client'
import React, { useState } from "react";
import axios from "axios";

const NotifierPage = () => {
  const [stock, setStock] = useState("");
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    try {
      await axios.post("https://stockmarketanalysis-1.onrender.com/set-alert", {
        stock,
        target_price: parseFloat(target),
        email,
      });
      alert("Alert saved!");
      setStock(""); setTarget(""); setEmail("");
    } catch (error) {
      alert("Error saving alert");
      console.error("There was an error saving the alert!", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-purple-500">
    <div className="p-8 max-w-md w-full rounded-lg bg-white text-purple-500 font-bold shadow-md">
    <h2 className="text-2xl font-semibold mb-6">Stock Price Alert</h2>
    <input
      type="text"
      placeholder="Stock symbol (e.g., RELIANCE)"
      value={stock}
      onChange={(e) => setStock(e.target.value)}
      className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      type="number"
      placeholder="Target price"
      value={target}
      onChange={(e) => setTarget(e.target.value)}
      className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      onClick={handleSubmit}
      className="w-full cursor-pointer bg-purple-500 text-white py-2 rounded-md hover:bg-white hover:text-purple-500 transition-colors duration-200 font-semibold"
    >
      Set Alert
    </button>
  </div>
</div>


  );
};

export default NotifierPage;
