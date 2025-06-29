'use client';
import axios from 'axios';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUpPage = () => {
    router.push('/SignUp');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('http://localhost:4000/Login', {
      email,
      password,
    })
    .then((response) => {
      console.log(response.data);
      // alert('Login successful');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('email', email);
      router.push('/');
    })
    .catch((error) => {
      console.error('There was an error!', error);
      alert('Login failed');
    });
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-white animate-gradient-move">
      <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">Login</h1>
      <form className="bg-white/20 backdrop-blur-2xl shadow-2xl rounded-2xl px-10 pt-8 pb-10 mb-4 w-full max-w-md">
        <div className="mb-6">
          <label className="block text-purple-700 text-sm font-bold mb-2" htmlFor="email">
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
          <label className="block text-purple-700 text-sm font-bold mb-2" htmlFor="password">
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
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg transition-all duration-300 mb-4 text-lg"
          onClick={handleLogin}
        >
          Login
        </button>
        <div className="flex flex-col items-center space-y-2 mt-4">
          <span className="text-purple-700 text-sm">Don&apos;t have an account?</span>
          <button
            className="w-full py-2 rounded-2xl bg-white/80 text-purple-700 font-bold hover:bg-purple-100 shadow-md transition-all duration-300"
            onClick={handleSignUpPage}
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
     
  );
}
export default LoginPage;