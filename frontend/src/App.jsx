import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Signup from './pages/Signup'; // Ensure you have this
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Employment from './pages/Employment';
import LabourServices from './pages/LabourServices';
import FarmerAI from './pages/FarmerAI';
import Schemes from './pages/Schemes';
import Healthcare from './pages/Healthcare';
import Marketplace from './pages/Marketplace';
import Chat from './pages/Chat';
import Education from './pages/Education';
import YourShop from './pages/YourShop';
import YourBusiness from './pages/YourBusiness';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import YourWork from './pages/YourWork';
import Teachers from './pages/Teachers';

// 1. Create a Child component that uses the Auth context
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Routes>
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-village-cream">
            <div className="w-12 h-12 border-4 border-village-emerald border-t-transparent rounded-full animate-spin"></div>
          </div>
        } />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={user ? <AppLayout><Dashboard /></AppLayout> : <Navigate to="/" />} />
      <Route path="/farmer-ai" element={user ? <AppLayout><FarmerAI/></AppLayout> : <Navigate to="/" />} />
      <Route path="/employment" element={user ? <AppLayout><Employment /></AppLayout> : <Navigate to="/" />} />
      <Route path="/labour" element={user ? <AppLayout><LabourServices /></AppLayout> : <Navigate to="/" />} />
      <Route path="/marketplace" element={user ? <AppLayout><Marketplace /></AppLayout> : <Navigate to="/" />} />
      <Route path="/cart" element={user ? <AppLayout><Cart /></AppLayout> : <Navigate to="/" />} />
      <Route path="/orders" element={user ? <AppLayout><Orders /></AppLayout> : <Navigate to="/" />} />
      <Route path="/your-shop" element={user ? <AppLayout><YourShop /></AppLayout> : <Navigate to="/" />} />
      <Route path="/your-business" element={user ? <AppLayout><YourBusiness /></AppLayout> : <Navigate to="/" />} />
      <Route path="/your-work" element={user ? <AppLayout><YourWork /></AppLayout> : <Navigate to="/" />} />
      <Route path="/schemes" element={user ? <AppLayout><Schemes /></AppLayout> : <Navigate to="/" />} />
      <Route path="/education" element={user ? <AppLayout><Education /></AppLayout> : <Navigate to="/" />} />
      <Route path="/teachers" element={user ? <AppLayout><Teachers /></AppLayout> : <Navigate to="/" />} />
      <Route path="/healthcare" element={user ? <AppLayout><Healthcare /></AppLayout> : <Navigate to="/" />} />
      <Route path="/chat" element={user ? <AppLayout><Chat /></AppLayout> : <Navigate to="/" />} />
    </Routes>
  );
};

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-village-cream">
    <Sidebar />
    <div className="w-full md:w-auto md:ml-72 flex flex-col min-w-0 min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-10 pt-5">{children}</main>
    </div>
  </div>
);

// 2. Wrap the providers here
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <SocketProvider>
          <CallProvider>
            <CartProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </CartProvider>
          </CallProvider>
        </SocketProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;