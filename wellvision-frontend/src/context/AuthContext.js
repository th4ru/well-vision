import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
  try {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.error('Corrupted authUser in localStorage:', err);
    localStorage.removeItem('authUser');
    return null;
  }
});


  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
