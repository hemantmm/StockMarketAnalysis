/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaUserEdit, FaCamera, FaSave, FaTimes, FaHome } from "react-icons/fa";

const ProfilePage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{
    username?: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [, setAvatarFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [showAvatarOverlay, setShowAvatarOverlay] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUser(userObj);
        setUsername(userObj.username || "");
        setEmail(userObj.email || "");
        setAvatar(userObj.avatar || "");
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, username, email, avatar };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditing(false);
    setMessage("Profile updated!");
    setTimeout(() => setMessage(""), 2000);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cyan-900 via-purple-900 to-black">
        <div className="bg-white/10 p-8 rounded-2xl shadow-2xl text-white max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Profile</h1>
          <p className="mb-6">You must be logged in to view your profile.</p>
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            onClick={() => router.push("/Login")}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-purple-900 to-black flex items-center justify-center py-12 px-4">
      <div className="relative w-full max-w-xl mx-auto">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10">
          <div className="relative group">
            <div
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-2xl flex items-center justify-center border-8 border-white/10 overflow-hidden transition-all duration-300"
              onMouseEnter={() => setShowAvatarOverlay(true)}
              onMouseLeave={() => setShowAvatarOverlay(false)}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-full h-full rounded-full"
                />
              ) : (
                <span className="text-6xl font-bold text-white">{(username || email)[0]?.toUpperCase()}</span>
              )}
              {editing && (
                <button
                  type="button"
                  className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    showAvatarOverlay ? "opacity-100" : ""
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Avatar"
                >
                  <FaCamera className="text-white text-3xl" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-28 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl px-10 py-12 flex flex-col items-center border border-white/10 relative">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-300 mb-8">Manage your account information</p>
          {editing ? (
            <form onSubmit={handleSave} className="w-full space-y-6">
              <div>
                <label className="block mb-1 text-gray-300">Name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  maxLength={32}
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">Email</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  maxLength={64}
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-300">
                  Avatar URL (optional)
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Paste image URL or upload above"
                />
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white hover:scale-105 transition-transform"
                >
                  <FaSave /> Save
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-6 py-2 bg-gray-700 rounded-xl font-bold text-white hover:bg-gray-800"
                  onClick={() => setEditing(false)}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="w-full">
              <div className="mb-6">
                <div className="text-lg font-semibold text-white mb-1">
                  {username}
                </div>
                <div className="text-gray-300">{email}</div>
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-white hover:scale-105 transition-transform"
                  onClick={() => setEditing(true)}
                >
                  <FaUserEdit /> Edit Profile
                </button>
                <button
                  className="flex items-center gap-2 px-6 py-2 bg-gray-700 rounded-xl font-bold text-white hover:bg-gray-800"
                  onClick={() => router.push("/")}
                >
                  <FaHome /> Home
                </button>
              </div>
            </div>
          )}
          {message && (
            <div className="mt-6 text-shadow-green-400 font-semibold text-center animate-bounce">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
