import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Heart } from 'lucide-react';
import { users } from '../services/api';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const response = await users.getSavedJobs();
      setSavedJobs(response.data.savedJobs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await users.unsaveJob(jobId);
      setSavedJobs(savedJobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>

      {loading ? (
        <div className="text-center p-6"><div className="loading-spinner"></div></div>
      ) : savedJobs.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No saved jobs</h3>
          <p>Save jobs to view them later</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {savedJobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="flex justify-between">
                <div className="company-badge">
                  <img src={job.company_logo || 'https://via.placeholder.com/48'} alt={job.company_name} className="company-logo" />
                  <div>
                    <Link to={`/jobs/${job.id}`} className="font-semibold">{job.title}</Link>
                    <div className="text-sm text-gray-500">{job.company_name}</div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => handleUnsave(job.id)}>
                  <Heart size={18} fill="currentColor" /> Unsave
                </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;