import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CompanyProfile from './pages/CompanyProfile';
import PostJob from './pages/PostJob';
import Applications from './pages/Applications';
import SavedJobs from './pages/SavedJobs';
import SearchResults from './pages/SearchResults';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import CandidateSearch from './pages/CandidateSearch';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '100vh' }}><div className="loading-spinner"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
        <Route path="/search" element={<SearchResults />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['job_seeker', 'recruiter', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/company-profile" element={
          <ProtectedRoute allowedRoles={['recruiter']}>
            <CompanyProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/post-job" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <PostJob />
          </ProtectedRoute>
        } />
        
        <Route path="/applications" element={
          <ProtectedRoute allowedRoles={['job_seeker', 'recruiter', 'admin']}>
            <Applications />
          </ProtectedRoute>
        } />
        
        <Route path="/saved-jobs" element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <SavedJobs />
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute allowedRoles={['job_seeker', 'recruiter', 'admin']}>
            <Notifications />
          </ProtectedRoute>
        } />
        
        <Route path="/messages" element={
          <ProtectedRoute allowedRoles={['job_seeker', 'recruiter', 'admin']}>
            <Messages />
          </ProtectedRoute>
        } />
        
        <Route path="/candidates" element={
          <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
            <CandidateSearch />
          </ProtectedRoute>
        } />
      </Routes>
      <Footer />
      {user && <Chatbot />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;