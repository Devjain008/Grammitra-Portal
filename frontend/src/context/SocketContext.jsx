import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { CONFIG } from '../utils/constants';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Only connect if user is logged in

  useEffect(() => {
    if (user) {
      // Initialize the connection to your backend
      const newSocket = io(CONFIG.SOCKET_URL, {
        query: { userId: user._id } // Pass user ID for private messaging later
      });

      setSocket(newSocket);

      // Cleanup on logout or unmount
      return () => newSocket.close();
    } else {
      if (socket) socket.close();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};