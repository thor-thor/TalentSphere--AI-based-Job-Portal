import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applications, assets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Briefcase, Clock, CheckCircle, XCircle, Calendar, MoreHorizontal, X } from 'lucide-react';

const Applications = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applicationList, setApplicationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, status]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (status) params.status = status;
      const response = await applications.getAll(params);
      setApplicationList(response.data.applications);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await applications.updateStatus(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCancelApplication = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    setCancellingId(id);
    try {
      await applications.delete(id);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to withdraw application');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { class: 'badge-warning', icon: Clock },
      viewed: { class: 'badge-primary', icon: Clock },
      shortlisted: { class: 'badge-success', icon: CheckCircle },
      rejected: { class: 'badge-error', icon: XCircle },
      interview_scheduled: { class: 'badge-primary', icon: Calendar },
      offer_extended: { class: 'badge-success', icon: CheckCircle },
      hired: { class: 'badge-success', icon: CheckCircle }
    };
    return config[status] || config.pending;
  };

  const statuses = ['pending', 'viewed', 'shortlisted', 'rejected', 'interview_scheduled', 'offer_extended', 'hired'];

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{user.role === 'job_seeker' ? 'My Applications' : 'Applications'}</h1>
      </div>

      <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
        <button className={`badge ${!status ? 'badge-primary' : 'badge-secondary'}`} onClick={() => { setStatus(''); setPagination(p => ({ ...p, page: 1 })); }}>
          All
        </button>
        {statuses.map(s => (
          <button key={s} className={`badge ${status === s ? 'badge-primary' : 'badge-secondary'}`} onClick={() => { setStatus(s); setPagination(p => ({ ...p, page: 1 })); }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center p-6"><div className="loading-spinner"></div></div>
      ) : applicationList.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No applications found</h3>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applicationList.map(app => (
            <div key={app.id} className="card">
              <div className="flex justify-between">
                <div>
                  <Link to={`/jobs/${app.job_id}`} className="font-semibold text-lg">{app.job_title}</Link>
                  <div className="text-gray-500">{app.company_name}</div>
                  {user.role === 'recruiter' && (
                    <div className="text-sm text-gray-500 mt-1">
                      {app.first_name} {app.last_name} • {app.email}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`badge ${getStatusConfig(app.status).class}`}>
                    {app.status.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Applied {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {user.role === 'job_seeker' && (
                <div className="mt-4 pt-4 border-t border-glass-border">
                  <button 
                    className="btn btn-error btn-sm"
                    onClick={() => handleCancelApplication(app.id)}
                    disabled={cancellingId === app.id}
                  >
                    {cancellingId === app.id ? 'Withdrawing...' : 'Withdraw Application'}
                  </button>
                </div>
              )}
              {app.cover_letter && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm">Cover Letter:</h4>
                  <p className="text-gray-600 text-sm mt-1">{app.cover_letter.substring(0, 200)}...</p>
                </div>
              )}
              {user.role === 'recruiter' && (
                <div className="mt-4 pt-4 border-t border-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Update Status:</span>
                    <select 
                      className="input input-sm py-1" 
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                      style={{ width: 'auto', minWidth: '150px' }}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/messages?user=${app.applicant_id}`} className="btn btn-outline btn-sm">
                      Message
                    </Link>
                    {app.resume_url && (
                      <a href={assets.getResumeUrl(app.resume_url)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                        View Resume
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default Applications;