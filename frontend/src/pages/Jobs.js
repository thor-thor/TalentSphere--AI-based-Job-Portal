import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Filter, X, Sparkles, Heart, Search } from 'lucide-react';
import { jobs, users } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Jobs = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobList, setJobList] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    jobType: searchParams.get('jobType') || '',
    remoteType: searchParams.get('remoteType') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    salaryMin: searchParams.get('salaryMin') || '',
    salaryMax: searchParams.get('salaryMax') || ''
  });

  useEffect(() => {
    fetchJobs();
    if (user?.role === 'job_seeker') {
      fetchRecommendations();
      fetchSavedJobs();
    }
  }, [pagination.page, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = { ...filters, page: pagination.page, limit: pagination.limit };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      const response = await jobs.getAll(params);
      setJobList(response.data.jobs || []);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await jobs.getMatches({ limit: 5 });
      setRecommendedJobs(response.data.jobs || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await users.getSavedJobs();
      const ids = new Set(response.data.savedJobs?.map(j => j.id) || []);
      setSavedJobIds(ids);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '', location: '', jobType: '', remoteType: '',
      experienceLevel: '', salaryMin: '', salaryMax: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleToggleSave = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (savedJobIds.has(jobId)) {
        await users.unsaveJob(jobId);
        setSavedJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        toast.success('Job removed from saved');
      } else {
        await users.saveJob(jobId);
        setSavedJobIds(prev => new Set(prev).add(jobId));
        toast.success('Job saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const jobTypes = ['full_time', 'part_time', 'contract', 'internship', 'remote'];
  const remoteTypes = ['onsite', 'remote', 'hybrid'];
  const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];

  const JobCard = ({ job, isMini = false }) => (
    <Link to={`/jobs/${job.id}`} className={`job-card ${isMini ? 'mini-job-card' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="company-badge">
          <img src={job.company_logo || '/placeholder.png'} alt={job.company_name} className="company-logo" style={{ width: isMini ? '40px' : '56px', height: isMini ? '40px' : '56px' }} />
          <div>
            <div className={`font-bold ${isMini ? 'text-sm' : 'text-lg'}`}>{job.title}</div>
            <div className="text-sm text-gray-500">{job.company_name}</div>
          </div>
        </div>
        {!isMini && user?.role === 'job_seeker' && (
          <button 
            className={`heart-btn ${savedJobIds.has(job.id) ? 'active' : ''}`}
            onClick={(e) => handleToggleSave(e, job.id)}
          >
            <Heart size={20} />
          </button>
        )}
      </div>
      
      <div className={`job-meta mt-4 ${isMini ? 'gap-2' : 'gap-4'}`}>
        <span className="job-meta-item text-xs"><MapPin size={14} /> {job.location || 'Remote'}</span>
        <span className="job-meta-item text-xs"><Briefcase size={14} /> {job.job_type?.replace('_', ' ')}</span>
      </div>

      <div className="flex justify-between items-center mt-6">
        {job.salary_min ? (
          <span className="salary-badge text-xs">
            ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-500">Salary Undisclosed</span>
        )}
        {user?.role === 'job_seeker' && job.match_percentage > 0 && (
          <div className="flex items-center gap-1 text-xs text-primary font-bold">
            <Sparkles size={12} /> {job.match_percentage}%
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="container py-8">
      <div className="jobs-page-wrapper">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <Filter size={18} /> Filters
            </h3>
            <button className="text-xs text-gray-500 hover:text-primary" onClick={clearFilters}>Clear</button>
          </div>

          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-gray-500">Location</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  name="location"
                  placeholder="City or remote..."
                  className="input pl-10"
                  value={filters.location}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-gray-500">Job Type</label>
              <select name="jobType" className="input" value={filters.jobType} onChange={handleFilterChange}>
                <option value="">All Types</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-gray-500">Experience</label>
              <select name="experienceLevel" className="input" value={filters.experienceLevel} onChange={handleFilterChange}>
                <option value="">All Levels</option>
                {experienceLevels.map(level => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-gray-500">Salary Rank</label>
              <div className="space-y-2">
                <input
                  type="number"
                  name="salaryMin"
                  placeholder="Min ($)"
                  className="input"
                  value={filters.salaryMin}
                  onChange={handleFilterChange}
                />
                <input
                  type="number"
                  name="salaryMax"
                  placeholder="Max ($)"
                  className="input"
                  value={filters.salaryMax}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main>
          {/* Header Search Bar */}
          <form 
            className="search-bar-premium"
            onSubmit={(e) => { e.preventDefault(); fetchJobs(); }}
          >
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search size={22} className="text-secondary" />
              <input
                type="text"
                name="search"
                placeholder="Search jobs by title, skills, or company..."
                className="input w-full"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <button type="submit" className="btn btn-primary px-8">Search</button>
          </form>

          {/* Recommendations Section */}
          {user?.role === 'job_seeker' && recommendedJobs.length > 0 && !filters.search && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-primary" />
                <h2 className="text-xl font-bold">Top Recommendations for You</h2>
              </div>
              <div className="recommendations-scroll">
                {recommendedJobs.map(job => (
                  <JobCard key={job.id} job={job} isMini />
                ))}
              </div>
            </section>
          )}

          {/* Jobs List */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {filters.search ? `Results for "${filters.search}"` : 'Discover Latest Jobs'}
              <span className="ml-2 text-sm text-gray-500 font-normal">({pagination.total} results)</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>
          ) : jobList.length === 0 ? (
            <div className="card text-center py-20 bg-glass">
              <Briefcase size={64} className="mx-auto text-gray-600 mb-4 opacity-20" />
              <h3 className="text-2xl font-bold text-gray-400 mb-2">No jobs matched your criteria</h3>
              <p className="text-gray-500 mb-8">Try adjusting your filters or search terms.</p>
              <button className="btn btn-outline" onClick={clearFilters}>Reset All Filters</button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobList.map(job => (
                <JobCard key={job.id} job={job} />
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  <button 
                    className="btn btn-outline btn-sm px-4" 
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      className={`btn btn-sm w-10 ${pagination.page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="btn btn-outline btn-sm px-4" 
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Jobs;