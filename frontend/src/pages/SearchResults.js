import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSignSign } from 'lucide-react';
import { search } from '../services/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const l = searchParams.get('location') || '';
    setQuery(q);
    setLocation(l);
    if (q || l) {
      handleSearch();
    }
  }, [searchParams, pagination.page]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = { q: query, location, page: pagination.page, limit: pagination.limit };
      const response = await search.jobs(params);
      setJobs(response.data.jobs || []);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Results</h1>
        {query && <p className="text-gray-500">Showing results for "{query}"</p>}
      </div>

      <div className="search-box mb-6">
        <input
          type="text"
          placeholder="Search jobs..."
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <input
          type="text"
          placeholder="Location..."
          className="search-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>Search</button>
      </div>

      {loading ? (
        <div className="text-center p-6"><div className="loading-spinner"></div></div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No jobs found</h3>
          <p>Try different keywords</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {jobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id} className="job-card">
                <div className="company-badge">
                  <img src={job.company_logo || 'https://via.placeholder.com/48'} alt={job.company_name} className="company-logo" />
                  <div>
                    <div className="font-semibold">{job.title}</div>
                    <div className="text-sm text-gray-500">{job.company_name}</div>
                  </div>
                </div>
                <div className="job-meta mt-4">
                  <span className="job-meta-item"><MapPin size={14} /> {job.location || 'Remote'}</span>
                  <span className="job-meta-item"><Briefcase size={14} /> {job.job_type?.replace('_', ' ')}</span>
                </div>
                {job.salary_min && (
                  <div className="mt-4">
                    <span className="salary-badge">
                      <DollarSign size={14} /> ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {pagination.total > pagination.limit && (
            <div className="pagination">
              <button className="pagination-btn" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
                Previous
              </button>
              <span className="pagination-btn active">{pagination.page}</span>
              <button className="pagination-btn" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;