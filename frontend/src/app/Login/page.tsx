"use client";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUpPage = () => {
    router.push("/SignUp");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://stockmarketanalysis-node.onrender.com/Login",
        {
          email,
          password,
        }
      );

      console.log(response.data);
      localStorage.setItem("email", email);
      login(response.data.token, { username: response.data.username });
      router.push("/");
    } catch (error) {
      console.error("There was an error!", error);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-white animate-gradient-move">
      <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
        Login
      </h1>
      <form className="bg-white/20 backdrop-blur-2xl shadow-2xl rounded-2xl px-10 pt-8 pb-10 mb-4 w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label
            className="block text-purple-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="shadow appearance-none border border-white/30 rounded-xl w-full py-3 px-4 text-purple-900 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/60 placeholder-purple-400"
            type="text"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-8">
          <label
            className="block text-purple-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="shadow appearance-none border border-white/30 rounded-xl w-full py-3 px-4 text-purple-900 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/60 placeholder-purple-400"
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg transition-all duration-300 mb-4 text-lg disabled:opacity-70"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
        <div className="flex flex-col items-center space-y-2 mt-4">
          <span className="text-purple-700 text-sm">
            Don&apos;t have an account?
          </span>
          <button
            className="w-full py-2 rounded-2xl bg-white/80 text-purple-700 font-bold hover:bg-purple-100 shadow-md transition-all duration-300"
            onClick={handleSignUpPage}
            type="button"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};
export default LoginPage;