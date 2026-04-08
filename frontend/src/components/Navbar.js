import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Building, Search, Bell, User, LogOut, LayoutDashboard, FolderHeart, Send, Menu, X, MessageSquare, Users } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="TalentSphere" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
            TalentSphere
          </Link>

          <div className="navbar-links" style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/jobs" className="navbar-link">Find Jobs</Link>
            <Link to="/companies" className="navbar-link">Companies</Link>

            {user?.role === 'recruiter' && (
              <>
                <Link to="/post-job" className="nav-link">Post a Job</Link>
                <Link to="/candidates" className="nav-link">Find Talent</Link>
              </>
            )}

            {user ? (
              <>
                <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                <Link to="/messages" className="navbar-link" style={{ position: 'relative', marginTop: '4px' }}>
                  <MessageSquare size={20} />
                </Link>
                <Link to="/notifications" className="navbar-link" style={{ position: 'relative', marginTop: '4px' }}>
                  <Bell size={20} />
                </Link>
                <div className="dropdown" style={{ position: 'relative' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {user.firstName} {user.lastName}
                  </button>
                  {mobileMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--glass-border)',
                      backdropFilter: 'var(--glass-blur)',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--glass-shadow)',
                      padding: '0.5rem',
                      minWidth: '200px',
                      marginTop: '0.5rem'
                    }}>
                      {user.role === 'job_seeker' && (
                        <>
                          <Link to="/profile" className="dashboard-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            <User size={18} /> Profile
                          </Link>
                          <Link to="/saved-jobs" className="dashboard-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            <FolderHeart size={18} /> Saved Jobs
                          </Link>
                        </>
                      )}
                      {user.role === 'recruiter' && (
                        <>
                          <Link to="/company-profile" className="dashboard-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            <Building size={18} /> Company
                          </Link>
                          <Link to="/post-job" className="dashboard-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            <Send size={18} /> Post Job
                          </Link>
                          <Link to="/applications" className="btn btn-outline w-full justify-start">
                            <Users size={18} /> View Applications
                          </Link>
                          <Link to="/candidates" className="btn btn-outline w-full justify-start">
                            <Search size={18} /> Search Candidates
                          </Link>
                        </>
                      )}
                      {user.role !== 'recruiter' && (
                        <Link to="/applications" className="dashboard-nav-link" onClick={() => setMobileMenuOpen(false)}>
                          <Briefcase size={18} /> Applications
                        </Link>
                      )}
                      <button onClick={handleLogout} className="dashboard-nav-link" style={{ width: '100%', textAlign: 'left' }}>
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;