'use client';
import axios from 'axios';
// import { useRouter } from "next/router";
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
    await axios.post('http://localhost:5000/Login', {
      email,
      password,
    })
    .then((response) => {
      console.log(response.data);
      alert('Login successful');
      localStorage.setItem('token', response.data.token);
      router.push('/');
    })
    .catch((error) => {
      console.error('There was an error!', error);
      alert('Login failed');
    });
    // router.push('/Home');
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Login Page</h1>
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Username:
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            id="username"
            name="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password:
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-red-500 text-xs italic">Please choose a password.</p>
        </div>
        <div className="flex items-center justify-between flex-col">
          <button
            className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleLogin}
          >
            Login
          </button>
          {/* <a className=" align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 mt-4" href="#">
            Forgot Password?
          </a> */}
        </div>
        <div className="flex items-center justify-between flex-col space-y-4">
          <a className=" align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 mt-4" href="#">
            Don&apos;t have an account?
          </a>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer rounded focus:outline-none focus:shadow-outline"
            onClick={handleSignUpPage}
          >
            Sign Up
          </button>
          
        </div>
        {/* <div className="flex items-center justify-between flex-col">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleHomePage}
          >
            Login with Google
          </button>
          <a className=" align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 mt-4" href="#">
            Login with Facebook
          </a>
        </div> */}
        {/* <div className="flex items-center justify-between flex-col">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleHomePage}
          >
            Login with Twitter
          </button>
          <a className=" align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 mt-4" href="#">
            Login with LinkedIn
          </a>
        </div> */}
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;2025 HMM. All rights reserved.
      </p>
    </div>
     
  );
}
export default LoginPage;