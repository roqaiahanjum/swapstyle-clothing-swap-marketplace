import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import CreateListing from './pages/CreateListing';
import ListingDetail from './pages/ListingDetail';
import EditListing from './pages/EditListing';
import SwapRequests from './pages/SwapRequests';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <Router>
            <div className="app-container">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/listings" element={<Listings />} />
                  <Route path="/listings/create" element={<CreateListing />} />
                  <Route path="/listings/:id" element={<ListingDetail />} />
                  <Route path="/listings/:id/edit" element={<EditListing />} />
                  <Route path="/swaps" element={<SwapRequests />} />
                  <Route path="/chat/:swapRequestId" element={<Chat />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </Router>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
