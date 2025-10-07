'use client';
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

const SignUpPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPage = () => {
    router.push('/Login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    axios.post('https://stockmarketanalysis-node.onrender.com/SignUp', {
      username: name,
      email,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false,
    })
    .then(() => {
      router.push('/Login');
    })
    .catch((error) => {
      console.error('There was an error!', error);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 via-orange-100 to-white">
      <h1 className="text-4xl font-bold mb-4 text-orange-700">Sign Up</h1>
      <form className="flex flex-col space-y-4 bg-white/80 rounded-2xl shadow-2xl px-10 pt-8 pb-10 w-full max-w-md border border-teal-300">
        <input
          type="text"
          placeholder="Username"
          className="border border-orange-300 p-2 rounded text-teal-900 bg-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border border-orange-300 p-2 rounded text-teal-900 bg-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-orange-300 p-2 rounded text-teal-900 bg-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-orange-500 text-xl font-bold text-white p-2 cursor-pointer rounded-lg hover:bg-orange-600 transition duration-200"
        >
          Sign Up
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between flex-col space-y-4">
        <p className="text-teal-700">
          Already have an account?
        </p>
        <button
          className="bg-teal-100 text-xl hover:bg-orange-100 hover:text-teal-700 text-orange-700 font-bold py-2 w-md cursor-pointer rounded-lg focus:outline-none focus:shadow-outline"
          onClick={handleLoginPage}
        >
          Login
        </button>
      </div>
      <div className="mt-4">
        <p className="text-teal-700">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-orange-500 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-orange-500 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
export default SignUpPage;