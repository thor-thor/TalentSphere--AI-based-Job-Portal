import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Building } from 'lucide-react';
import { companies } from '../services/api';

const Companies = () => {
  const [companyList, setCompanyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });

  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, search, industry]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (industry) params.industry = industry;
      const response = await companies.getAll(params);
      setCompanyList(response.data.companies || []);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Top Companies</h1>
          <p className="text-gray-400">Discover great places to work and research your next career move.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button className={`badge px-4 py-1.5 ${!industry ? 'badge-primary' : 'badge-secondary'}`} onClick={() => { setIndustry(''); setPagination(p => ({ ...p, page: 1 })); }}>
          All Industries
        </button>
        {['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Manufacturing'].map(ind => (
          <button key={ind} className={`badge px-4 py-1.5 ${industry === ind ? 'badge-primary' : 'badge-secondary'}`} onClick={() => { setIndustry(ind); setPagination(p => ({ ...p, page: 1 })); }}>
            {ind}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><div className="loading-spinner"></div></div>
      ) : companyList.length === 0 ? (
        <div className="card text-center py-20 bg-glass">
          <Building size={48} className="mx-auto text-gray-600 mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-gray-400">No companies found</h3>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyList.map(company => (
              <Link to={`/companies/${company.id}`} key={company.id} className="card hover:border-primary transition-all duration-300 group flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-xl bg-glass-border p-2 mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                  <img 
                    src={company.logo_url || '/placeholder.png'} 
                    alt={company.name} 
                    className="w-full h-full object-cover rounded-lg" 
                  />
                </div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{company.name}</h3>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{company.industry}</p>
                
                {company.average_rating ? (
                  <div className="flex items-center gap-1 text-secondary mb-4">
                    <Star size={14} fill="currentColor" />
                    <span className="font-bold">{Number(company.average_rating).toFixed(1)}</span>
                    <span className="text-gray-500 text-xs text-normal">({company.review_count})</span>
                  </div>
                ) : (
                  <div className="h-4 mb-4"></div>
                )}

                <div className="mt-auto w-full pt-4 border-t border-glass-border flex justify-between items-center text-xs">
                  <span className="text-gray-500">{company.company_size}</span>
                  {company.job_count > 0 && (
                    <span className="text-primary font-bold">{company.job_count} Jobs</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

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
      )}
    </div>
  );
};

export default Companies;