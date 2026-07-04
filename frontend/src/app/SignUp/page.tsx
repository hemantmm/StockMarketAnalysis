
'use client';

import axios from 'axios';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_API_BASE = (
  process.env.NEXT_PUBLIC_AUTH_API_BASE ||
  (process.env.NODE_ENV === 'production'
    ? 'https://stockmarketanalysis-node.onrender.com'
    : 'http://127.0.0.1:4000')
).replace(/\/$/, '');

const SignUpPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLoginPage = () => {
    router.push('/Login');
  };

  const validateForm = () => {
    if (!name.trim()) {
      setErrorMsg('Username is required');
      return false;
    }
    if (name.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      return false;
    }
    if (!email.trim()) {
      setErrorMsg('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setErrorMsg('Password is required');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await axios.post(`${AUTH_API_BASE}/SignUp`, {
        username: name,
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false,
      });
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/Login');
      }, 2000);
    } catch (error) {
      console.error('There was an error!', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      setErrorMsg(axiosError?.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f59e0b22,transparent_45%),radial-gradient(circle_at_bottom_left,#06b6d444,transparent_50%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#1e293b_100%)]" />
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-12">
        <aside className="hidden rounded-3xl border border-white/15 bg-white/5 p-10 backdrop-blur-2xl lg:block">
          <p className="mb-5 inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            MarketSense Dashboard
          </p>
          <h1 className="font-serif text-5xl font-semibold leading-tight text-slate-50">Start trading with clarity.</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
            Create your account to build watchlists, manage holdings, paper trade strategies, and get AI-driven stock insights.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Watchlists</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">Ready</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paper Trades</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">Instant</p>
            </div>
          </div>
        </aside>

        <div className="rounded-3xl border border-white/15 bg-slate-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8 md:p-10">
          <div className="mb-7">
            <p className="text-sm uppercase tracking-[0.18em] text-amber-300">Get started</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-slate-100">Create Account</h2>
            <p className="mt-2 text-sm text-slate-300">Set up your MarketSense workspace in seconds.</p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-xl border border-red-300/50 bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-xl border border-emerald-300/50 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="username">
                Username
              </label>
              <input
                className="w-full rounded-xl border border-slate-600/70 bg-slate-800/75 px-4 py-3 text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full rounded-xl border border-slate-600/70 bg-slate-800/75 px-4 py-3 text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-slate-600/70 bg-slate-800/75 px-4 py-3 pr-20 text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-semibold uppercase tracking-wide text-cyan-200 transition-colors hover:text-cyan-100"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-slate-600/70 bg-slate-800/75 px-4 py-3 pr-20 text-slate-50 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-semibold uppercase tracking-wide text-cyan-200 transition-colors hover:text-cyan-100"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-linear-to-r from-cyan-400 to-amber-400 px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-px hover:shadow-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2z" />
                  </svg>
                  Creating account
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="my-6 h-px w-full bg-linear-to-r from-transparent via-slate-500/60 to-transparent" />

          <button
            type="button"
            onClick={handleLoginPage}
            className="w-full rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-300/20"
          >
            Sign In Instead
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
export default SignUpPage;
