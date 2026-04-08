import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Clock, Eye, Heart, Send, CheckCircle, XCircle, Upload, X, Sparkles, Edit, Power, Users as UsersIcon, FileText } from 'lucide-react';
import { jobs, applications, users, assets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchJob();
    if (user?.role === 'job_seeker') {
      fetchUserProfile();
    }
  }, [id, user?.id]);

  const fetchJob = async () => {
    try {
      const response = await jobs.getById(id);
      setJob(response.data.job);
    } catch (error) {
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await users.getProfile();
      setProfile(response.data.profile);
    } catch (error) {
      console.error(error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async () => {
    setApplying(true);
    try {
      await applications.apply({ jobId: id, coverLetter });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      setCoverLetter('');
      fetchJob();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setResumeFile(file);
  };

  const handleUploadResume = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      await users.uploadResume(formData);
      toast.success('Resume uploaded!');
      setResumeFile(null);
      fetchUserProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (job.isSaved) {
        await users.unsaveJob(id);
        toast.success('Job removed from saved');
      } else {
        await users.saveJob(id);
        toast.success('Job saved!');
      }
      fetchJob();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save job');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !job.is_active;
      await jobs.update(id, { isActive: newStatus });
      toast.success(`Job ${newStatus ? 'reopened' : 'closed'} successfully`);
      fetchJob();
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'badge-warning', icon: Clock },
      viewed: { class: 'badge-primary', icon: Eye },
      shortlisted: { class: 'badge-success', icon: CheckCircle },
      rejected: { class: 'badge-error', icon: XCircle },
      interview_scheduled: { class: 'badge-primary', icon: Clock },
      offer_extended: { class: 'badge-success', icon: CheckCircle },
      hired: { class: 'badge-success', icon: CheckCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`badge ${config.class}`}>
        <Icon size={12} /> {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '50vh' }}><div className="loading-spinner"></div></div>;
  }

  if (!job) return null;

  const isOwner = user?.id === job.recruiter_id;
  const canApply = user?.role === 'job_seeker';
  const matchedSkillsCount = job.skills?.filter(s => s.is_matched).length || 0;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          {/* Main Job Info */}
          <div className="card">
            <div className="flex justify-between items-start">
              <div className="company-badge">
                <img src={job.company_logo || '/placeholder.png'} alt={job.company_name} className="company-logo" style={{ width: 64, height: 64 }} />
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight mb-1">{job.title}</h1>
                  <div className="flex items-center gap-2">
                    <Link to={`/companies/${job.company_id}`} className="text-secondary hover:underline font-medium">{job.company_name}</Link>
                    {canApply && job.match_percentage > 0 && (
                      <span className={`badge flex items-center gap-1 ${job.match_percentage > 50 ? 'badge-success' : 'badge-warning'}`}>
                        <Sparkles size={14} /> {job.match_percentage}% Match
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {canApply && (
                <button className={`heart-btn ${job.isSaved ? 'active' : ''}`} onClick={handleSaveJob}>
                  <Heart size={22} />
                </button>
              )}
            </div>

            <div className="job-meta mt-6">
              <span className="job-meta-item"><MapPin size={18} /> {job.location || 'Remote'}</span>
              <span className="job-meta-item"><Briefcase size={18} /> {job.job_type?.replace('_', ' ')}</span>
              {job.remoteType && <span className="job-meta-item">{job.remoteType}</span>}
              <span className="job-meta-item"><Eye size={18} /> {job.views_count} views</span>
            </div>

            {job.salary_min && (
              <div className="mt-4">
                <span className="salary-badge text-lg px-4 py-2">
                  <DollarSign size={20} /> ${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                </span>
              </div>
            )}

            <hr className="my-8 opacity-10" />

            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-bold text-white mb-3">Job Overview</h3>
                <p className="text-gray-400 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
              </section>

              {job.requirements && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-3">Requirements</h3>
                  <p className="text-gray-400 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
                </section>
              )}

              {job.skills?.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Skills & Qualifications</h3>
                    {canApply && (
                      <span className="text-sm text-gray-500">
                        You match <span className="text-primary font-bold">{matchedSkillsCount}/{job.skills.length}</span> skills
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(skill => (
                      <span 
                        key={skill.id} 
                        className={`badge px-4 py-2 flex items-center gap-2 border ${
                          canApply && skill.is_matched 
                            ? 'border-primary bg-primary bg-opacity-10 text-primary' 
                            : 'border-glass-border bg-glass bg-opacity-50 text-gray-400'
                        }`}
                      >
                        {canApply && (
                          skill.is_matched ? <CheckCircle size={14} /> : <XCircle size={14} className="opacity-30" />
                        )}
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Card */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Application</h3>
            {canApply ? (
              <div className="space-y-4">
                {job.has_applied ? (
                  <div className="p-4 rounded-lg bg-success bg-opacity-10 border border-success border-opacity-20 text-center">
                    <div className="text-success font-bold mb-2">Already Applied</div>
                    {getStatusBadge(job.application_status)}
                  </div>
                ) : (
                  <button className="btn btn-primary w-full py-4 text-lg" onClick={handleApply} disabled={applying || !job.is_active}>
                    {applying ? 'Submitting...' : job.is_active ? 'Apply for this Job' : 'Job Closed'}
                  </button>
                )}
                {!job.is_active && (
                  <div className="text-center text-error text-sm font-medium">
                    This job is no longer accepting applications.
                  </div>
                )}
              </div>
            ) : isOwner ? (
              <div className="p-4 rounded-lg bg-primary bg-opacity-10 border border-primary border-opacity-20">
                <div className="text-primary font-bold text-center mb-2">Your Job Listing</div>
                <p className="text-sm text-gray-500 text-center">Manage your applicants and listing status here.</p>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary w-full">Login to Apply</Link>
            )}

            {job.application_deadline && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock size={16} />
                <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Admin Actions (Owner Only) */}
          {isOwner && (
            <div className="card border-primary border-opacity-30 bg-primary bg-opacity-5">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Edit size={18} /> Admin Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate(`/post-job?edit=${job.id}`)}
                  className="btn btn-outline w-full justify-start gap-3"
                >
                  <Edit size={18} /> Edit Job Posting
                </button>
                <button 
                  onClick={handleToggleStatus}
                  className={`btn w-full justify-start gap-3 ${job.is_active ? 'btn-error btn-outline' : 'btn-success btn-outline'}`}
                >
                  <Power size={18} /> {job.is_active ? 'Close Job Listing' : 'Reopen Job Listing'}
                </button>
                <Link 
                  to={`/applications?job_id=${job.id}`}
                  className="btn btn-outline w-full justify-start gap-3"
                >
                  <UsersIcon size={18} /> View {job.applications_count || 0} Applicants
                </Link>
              </div>
            </div>
          )}

          {/* Company Card */}
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">About the Company</h3>
            <div className="flex items-center gap-4 mb-4">
              <img src={job.company_logo || '/placeholder.png'} alt={job.company_name} className="company-logo" style={{ width: 48, height: 48 }} />
              <div>
                <Link to={`/companies/${job.company_id}`} className="font-bold text-white hover:text-secondary">{job.company_name}</Link>
                <p className="text-sm text-gray-500">{job.industry}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {job.headquarters && (
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin size={16} className="text-gray-600" /> {job.headquarters}
                </div>
              )}
              {job.website && (
                <a href={job.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-secondary hover:underline">
                  <Send size={16} /> Visit Company Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Apply for {job.title}</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="form-label mb-2 block font-medium">Cover Letter (Optional)</label>
                <textarea
                  className="input min-h-[150px] py-3"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the recruiter why you're a great fit for this role..."
                />
              </div>

              <div>
                <label className="form-label mb-2 block font-medium">Your Resume</label>
                {profile?.resume_url ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary bg-opacity-10 border border-primary border-opacity-20">
                    <div className="flex items-center gap-3 text-primary">
                      <FileText size={20} />
                      <span className="font-medium">Using your saved resume</span>
                    </div>
                    <a href={assets.getResumeUrl(profile.resume_url)} target="_blank" rel="noopener noreferrer" className="text-secondary text-sm font-bold hover:underline">Preview</a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-glass-border rounded-xl p-6 text-center">
                    <Upload size={32} className="mx-auto text-gray-600 mb-2" />
                    <label className="text-primary font-bold cursor-pointer block mb-1">
                      Click to upload resume
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-500">{resumeFile ? resumeFile.name : 'PDF, DOC, or DOCX up to 5MB'}</p>
                    {resumeFile && (
                      <button onClick={handleUploadResume} disabled={uploadingResume} className="btn btn-secondary btn-sm mt-3 px-6">
                        {uploadingResume ? 'Uploading...' : 'Confirm Upload'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowApplyModal(false)} className="btn btn-outline flex-1 py-3">Cancel</button>
                <button onClick={handleSubmitApplication} disabled={applying || (!profile?.resume_url && !resumeFile)} className="btn btn-primary flex-1 py-3 font-bold">
                  {applying ? 'Submitting...' : 'Send Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;