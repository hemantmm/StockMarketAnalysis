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
        axios.post('https://stockmarketanalysis-2.onrender.com/SignUp', {
            username:name,
            email,
            password,
        },{
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false,
        })
        .then((response) => {
            console.log(response.data);
            router.push('/Login');
        })
        .catch((error) => {
            console.error('There was an error!', error);
        });
    };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Sign Up</h1>
      <form className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="border border-gray-300 p-2 rounded"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 p-2 rounded"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 p-2 w-md rounded"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-purple-600 text-xl font-bold text-white p-2 cursor-pointer rounded-lg hover:bg-white hover:text-purple-600 transition duration-200"
        >
          Sign Up
        </button>
      </form>
        <div className="mt-4 flex items-center justify-between flex-col space-y-4">
            <p className="text-gray-600">
            Already have an account?{' '}
            </p>

            <button
                className="bg-purple-600 text-xl hover:bg-white hover:text-purple-600 text-white font-bold py-2 w-md cursor-pointer rounded-lg focus:outline-none focus:shadow-outline"
                onClick={handleLoginPage}
            >
                Login
            </button>
            </div>
        <div className="mt-4">
            <p className="text-gray-600">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-blue-500 hover:underline">
                Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-500 hover:underline">
                Privacy Policy
            </a>
            </p>
            </div>
    </div>
  );
}
export default SignUpPage;