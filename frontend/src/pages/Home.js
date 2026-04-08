import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Users, ArrowRight, Star } from 'lucide-react';
import { jobs, companies } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, companiesRes] = await Promise.all([
        jobs.getAll({ limit: 6 }),
        companies.getAll({ limit: 4 })
      ]);
      setFeaturedJobs(jobsRes.data.jobs);
      setTopCompanies(companiesRes.data.companies);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?q=${searchQuery}&location=${location}`);
  };

  const jobTypes = [
    { label: 'Full Time', value: 'full_time' },
    { label: 'Remote', value: 'remote' },
    { label: 'Contract', value: 'contract' },
    { label: 'Internship', value: 'internship' }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-glass-gradient opacity-50 -z-10"></div>
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glass border border-glass-border text-xs font-bold text-primary mb-6 animate-fade-in">
            <Star size={14} fill="currentColor" />
            #1 JOB PLATFORM FOR TECH TALENT
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
            Elevate Your <span className="text-gradient">Career</span> <br /> 
            Beyond Gravity
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Find opportunities that match your potential with our AI-driven matching engine and professional community.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto p-2 rounded-2xl bg-glass border border-glass-border shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-3">
              <Search size={22} className="text-primary" />
              <input
                type="text"
                placeholder="Job title, keywords..."
                className="bg-transparent border-none focus:outline-none text-white w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-glass-border my-2"></div>
            <div className="flex-1 flex items-center gap-3 px-4 py-3">
              <MapPin size={22} className="text-secondary" />
              <input
                type="text"
                placeholder="City or Remote"
                className="bg-transparent border-none focus:outline-none text-white w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary px-8 py-4 text-lg">
              Find Jobs
            </button>
          </form>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <span className="text-sm text-gray-500 py-2">Popular tags:</span>
            {jobTypes.map(type => (
              <Link 
                to={`/jobs?jobType=${type.value}`} 
                key={type.value} 
                className="badge hover:bg-glass-border transition-colors border-glass-border"
              >
                {type.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-glass-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-1">12k+</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-1">800+</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Verified Companies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-1">45k</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Talent Profiles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-1">$2.4M</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Avg. Salaries</div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="container">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Opportunities</h2>
            <p className="text-gray-400">Hand-picked premium positions from industry leaders.</p>
          </div>
          <Link to="/jobs" className="btn btn-outline btn-sm hidden md:flex items-center gap-2">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id} className="card hover:border-primary transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-glass-border p-2 overflow-hidden">
                    <img src={job.company_logo || '/placeholder.png'} alt={job.company_name} className="w-full h-full object-cover rounded" />
                  </div>
                  <div className="badge badge-primary text-[10px] py-0.5 px-2">HOT JOB</div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-gray-400 text-sm mb-6">{job.company_name}</p>
                
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-6">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || 'Remote'}</span>
                  <span className="flex items-center gap-1"><Briefcase size={14} /> {job.job_type}</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-glass-border">
                  <span className="text-primary font-bold">
                    {job.salary_min ? `$${job.salary_min.toLocaleString()}` : 'Negotiable'}
                  </span>
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest">Applied 2d ago</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Trusted Companies */}
      <section className="container">
        <div className="card bg-glass text-center">
          <h2 className="text-2xl font-bold mb-10">Powering Talent for the World’s Greatest Teams</h2>
          {loading ? (
            <div className="loading-spinner mx-auto"></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {topCompanies.map(company => (
                <Link to={`/companies/${company.id}`} key={company.id} className="group hover:scale-105 transition-transform">
                  <img src={company.logo_url || '/placeholder.png'} alt={company.name} className="h-10 mx-auto opacity-50 group-hover:opacity-100 transition-opacity invert brightness-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container">
        <div className="card p-12 bg-glass-gradient border-glass-border flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Ready to find your next break?</h2>
            <p className="text-gray-300">Join 50,000+ professionals and get matched with companies seeking your unique skills.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/register" className="btn btn-primary px-10 py-4 shadow-xl">Get Started</Link>
            <Link to="/jobs" className="btn btn-outline px-10 py-4">Learn More</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;