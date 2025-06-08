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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-white animate-gradient-move">
      <div className="p-8 max-w-md w-full rounded-2xl bg-white/20 backdrop-blur-2xl text-purple-900 font-bold shadow-2xl border border-white/30">
        <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">Stock Price Alert</h2>
        <input
          type="text"
          placeholder="Stock symbol (e.g., RELIANCE)"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full mb-4 px-4 py-3 border border-white/30 rounded-xl bg-white/60 text-purple-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="number"
          placeholder="Target price"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full mb-4 px-4 py-3 border border-white/30 rounded-xl bg-white/60 text-purple-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-6 px-4 py-3 border border-white/30 rounded-xl bg-white/60 text-purple-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={handleSubmit}
          className="w-full cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors duration-200 font-semibold shadow-lg"
        >
          Set Alert
        </button>
      </div>
    </div>


  );
};

export default NotifierPage;
