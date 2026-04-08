import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, User, Mail, Star, Filter, X } from 'lucide-react';
import { search } from '../services/api';
import toast from 'react-hot-toast';

const CandidateSearch = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: '',
    location: '',
    experienceMin: '',
    experienceMax: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

  useEffect(() => {
    fetchCandidates();
  }, [pagination.page]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await search.candidates({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setCandidates(response.data.candidates);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchCandidates();
  };

  const handleClearFilters = () => {
    setFilters({ skills: '', location: '', experienceMin: '', experienceMax: '' });
    setPagination(p => ({ ...p, page: 1 }));
    fetchCandidates();
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Talent Discovery</h1>
          <p className="text-gray-400">Search and connect with top candidates across the platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Filter size={18} /> Filters
              </h3>
              <button onClick={handleClearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X size={12} /> Clear All
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-widest text-gray-500 font-bold">Skills</label>
                <input 
                  type="text" 
                  className="input input-sm" 
                  placeholder="e.g. React, Node.js"
                  value={filters.skills}
                  onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-widest text-gray-500 font-bold">Location</label>
                <input 
                  type="text" 
                  className="input input-sm" 
                  placeholder="City or Remote"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="form-label text-xs uppercase tracking-widest text-gray-500 font-bold">Min Exp</label>
                  <input 
                    type="number" 
                    className="input input-sm" 
                    placeholder="Years"
                    value={filters.experienceMin}
                    onChange={(e) => setFilters({ ...filters, experienceMin: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs uppercase tracking-widest text-gray-500 font-bold">Max Exp</label>
                  <input 
                    type="number" 
                    className="input input-sm" 
                    placeholder="Years"
                    value={filters.experienceMax}
                    onChange={(e) => setFilters({ ...filters, experienceMax: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full btn-sm mt-4">
                Apply Filters
              </button>
            </form>
          </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]"><div className="loading-spinner"></div></div>
          ) : candidates.length === 0 ? (
            <div className="card text-center py-20 bg-glass">
              <Search size={48} className="mx-auto text-gray-600 mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-gray-400">No candidates found</h3>
              <p className="text-gray-500">Try adjusting your filters to broaden your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map(candidate => (
                <div key={candidate.id} className="card hover:border-primary transition-all duration-300 group">
                  <div className="flex gap-4 items-start mb-4">
                    <div className="w-16 h-16 rounded-full bg-glass-gradient flex items-center justify-center border border-glass-border overflow-hidden">
                      {candidate.profile_picture ? (
                        <img src={candidate.profile_picture} alt={candidate.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-primary opacity-50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{candidate.headline || 'Job Seeker'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} /> {candidate.location || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} /> {candidate.years_of_experience || 0} years experience
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {candidate.skills?.slice(0, 4).map((skill, index) => (
                      <span key={index} className="text-[10px] px-2 py-0.5 rounded bg-glass border border-glass-border">
                        {skill}
                      </span>
                    ))}
                    {candidate.skills?.length > 4 && (
                      <span className="text-[10px] text-gray-500">+{candidate.skills.length - 4} more</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/messages?user=${candidate.id}`} className="btn btn-primary btn-sm flex-1">
                      <Mail size={14} className="mr-2" /> Message
                    </Link>
                    <button className="btn btn-outline btn-sm px-3">
                      <Star size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.total > pagination.limit && (
            <div className="flex justify-center mt-12 gap-2">
              <button 
                className="btn btn-outline btn-sm px-4" 
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </button>
              <div className="flex items-center px-4 text-sm font-bold bg-glass rounded-lg border border-glass-border">
                {pagination.page}
              </div>
              <button 
                className="btn btn-outline btn-sm px-4" 
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateSearch;
