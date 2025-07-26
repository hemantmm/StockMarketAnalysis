"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSignOutAlt, FaCog, FaHistory } from "react-icons/fa";

interface UserMenuProps {
  user: {
    username?: string;
    email: string;
  };
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = () => {
    // Clear all auth related items from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    
    // Redirect to home page
    router.push('/');
    
    // Refresh the page to reset all states
    window.location.reload();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
          {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block text-sm">{user.username || user.email.split('@')[0]}</div>
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-700 backdrop-blur-lg">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm text-white font-medium">{user.username || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          
          <button 
            onClick={() => router.push('/Portfolio')}
            className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            <FaHistory className="mr-2" />
            Trade History
          </button>
          
          <button 
            onClick={() => router.push('/Profile')}
            className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            <FaCog className="mr-2" />
            Settings
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
