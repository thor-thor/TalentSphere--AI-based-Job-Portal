import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-glass-border bg-dark py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-glass-gradient opacity-10 -z-10"></div>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-bold text-gradient">
              JobPortal
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              The world's leading platform for tech talent. We connect the next generation of innovators with the most impactful companies on the planet.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-primary transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors"><Github size={20} /></a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-gray-500">For Candidates</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link to="/companies" className="hover:text-primary transition-colors">Browse Companies</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition-colors">Candidate Profile</Link></li>
              <li><Link to="/saved-jobs" className="hover:text-primary transition-colors">Saved Jobs</Link></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-gray-500">For Employers</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/post-job" className="hover:text-primary transition-colors">Post a Job</Link></li>
              <li><Link to="/candidates" className="hover:text-primary transition-colors">Find Talent</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Employer Dashboard</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-gray-500">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3"><MapPin size={16} className="text-primary" /> 123 Tech Avenue, SF</li>
              <li className="flex items-center gap-3"><Mail size={16} className="text-primary" /> support@jobportal.io</li>
              <li className="flex items-center gap-3"><Phone size={16} className="text-primary" /> +1 (555) 000-1234</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>© 2026 JobPortal Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
