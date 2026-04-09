import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { oauthLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      oauthLogin(token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } else if (error) {
      toast.error('OAuth login failed. Please try again.');
      navigate('/login');
    }
  }, [searchParams, oauthLogin, navigate]);

  return (
    <div className="flex items-center justify-center" style={{ height: '100vh' }}>
      <div className="loading-spinner"></div>
    </div>
  );
};

export default OAuthCallback;