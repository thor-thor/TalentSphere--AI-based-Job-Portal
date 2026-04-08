import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Building, Globe, Users, Star, Briefcase, Clock, Calendar, Mail } from 'lucide-react';
import { companies, reviews as reviewsApi } from '../services/api';
import toast from 'react-hot-toast';

const CompanyDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const response = await companies.getById(id);
      setCompany(response.data.company);
    } catch (error) {
      toast.error('Company not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="loading-spinner"></div></div>;
  }

  if (!company) return null;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <img 
            src={company.logo_url || '/placeholder-company.png'} 
            alt={company.name} 
            className="w-24 h-24 rounded-xl object-cover bg-glass-border p-2"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.stats?.average_rating > 0 && (
                <div className="badge badge-success flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  {Number(company.stats.average_rating).toFixed(1)}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1"><Building size={16} /> {company.industry}</span>
              <span className="flex items-center gap-1"><MapPin size={16} /> {company.headquarters}</span>
              <span className="flex items-center gap-1"><Users size={16} /> {company.company_size} employees</span>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Globe size={16} /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-8 border-t border-glass-border pt-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'jobs' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Open Jobs ({company.stats?.job_count || 0})
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Reviews
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4">About {company.name}</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {company.description || 'No description available.'}
              </p>
              
              {company.benefits?.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4 text-secondary">Why work here?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-glass p-3 rounded-lg border border-glass-border">
                        <Sparkles size={16} className="text-secondary" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Open Positions</h3>
              {company.stats?.job_count > 0 ? (
                <div className="grid gap-4">
                  {/* Note: In a real app we'd fetch the actual jobs list here */}
                  <div className="card bg-glass text-center py-8">
                    <p className="text-gray-400">View all jobs from this company in our <Link to={`/jobs?company=${company.id}`} className="text-primary hover:underline">job board</Link>.</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No open positions at the moment.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Company Reviews</h3>
                {/* <button className="btn btn-sm btn-primary">Write a Review</button> */}
              </div>
              
              {company.reviews?.length > 0 ? (
                company.reviews.map((review) => (
                  <div key={review.id} className="card bg-glass border-glass-border">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-1 text-secondary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold mb-2">{review.title}</h4>
                    <div className="space-y-4 text-sm text-gray-300">
                      <div>
                        <span className="text-green-400 font-medium block mb-1">Pros</span>
                        <p>{review.pros}</p>
                      </div>
                      <div>
                        <span className="text-red-400 font-medium block mb-1">Cons</span>
                        <p>{review.cons}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-12">
                  <Star size={40} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">Be the first to review {company.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold mb-4">Company Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Industry</span>
                <span>{company.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Company size</span>
                <span>{company.company_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Founded</span>
                <span>{company.founded_year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Headquarters</span>
                <span>{company.headquarters}</span>
              </div>
            </div>
          </div>

          <div className="card bg-glass-gradient">
            <h3 className="font-bold mb-2 text-primary">Work with us</h3>
            <p className="text-sm text-gray-300 mb-4">Interested in joining our team? Check out our open positions or start a conversation.</p>
            <div className="space-y-3">
              <Link to={`/jobs?company=${company.id}`} className="btn btn-primary w-full btn-sm">
                See Open Jobs
              </Link>
              <Link to={`/messages?user=${company.user_id}`} className="btn btn-outline w-full btn-sm flex items-center justify-center gap-2">
                <Mail size={14} /> Message Company
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;