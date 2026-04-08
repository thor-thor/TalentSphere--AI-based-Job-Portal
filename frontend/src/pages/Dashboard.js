import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Sparkles, MapPin, Briefcase, User, FileText, Building, Users, Search, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import { jobs, applications, users, companies, analytics, assets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [matches, setMatches] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (user.role === 'job_seeker') {
        const [applicationsRes, savedJobsRes, matchesRes, analyticsRes] = await Promise.all([
          applications.getAll({ limit: 100 }),
          users.getSavedJobs(),
          jobs.getMatches({ limit: 3 }),
          analytics.getSeeker(),
          users.getProfile()
        ]);
        setProfile(profileRes.data.profile);
        setStats({
          applicationsCount: applicationsRes.data.total || 0,
          savedJobsCount: savedJobsRes.data.savedJobs?.length || 0,
          pendingCount: applicationsRes.data.applications?.filter(a => a.status === 'pending').length || 0,
          interviewCount: applicationsRes.data.applications?.filter(a => a.status === 'interview_scheduled').length || 0
        });
        setMatches(matchesRes.data.jobs || []);
        setAnalyticsData(analyticsRes.data);
      } else if (user.role === 'recruiter') {
        const [jobsRes, applicationsRes, companyRes, analyticsRes] = await Promise.all([
          jobs.getMyJobs(),
          applications.getAll({ limit: 100 }),
          companies.getMyCompany(),
          analytics.getRecruiter()
        ]);
        setStats({
          jobsCount: jobsRes.data.total || 0,
          applicationsCount: applicationsRes.data.total || 0,
          company: companyRes.data.company
        });
        setAnalyticsData(analyticsRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const SeekerDashboard = () => (
    <div>
      <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
        <div className="stats-card">
          <div className="stats-value">{stats.applicationsCount}</div>
          <div className="stats-label">Total Applications</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{stats.pendingCount}</div>
          <div className="stats-label">Pending</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{stats.interviewCount}</div>
          <div className="stats-label">Interview Scheduled</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{stats.savedJobsCount}</div>
          <div className="stats-label">Saved Jobs</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <Link to="/profile" className="btn btn-outline w-full justify-start">
              <User size={18} /> Edit Profile
            </Link>
            {profile?.resume_url && (
              <a href={assets.getResumeUrl(profile.resume_url)} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full justify-start" style={{ color: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
                <FileText size={18} /> View Resume
              </a>
            )}
            <Link to="/jobs" className="btn btn-outline w-full justify-start">
              <Briefcase size={18} /> Browse Jobs
            </Link>
            <Link to="/saved-jobs" className="btn btn-outline w-full justify-start">
              <FileText size={18} /> Saved Jobs
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={18} className="text-secondary" />
            <h3 className="text-lg font-semibold">Application Status</h3>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            {analyticsData?.statusDist?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    <Cell fill="var(--primary)" />
                    <Cell fill="var(--secondary)" />
                    <Cell fill="#ffc658" />
                    <Cell fill="#ff8042" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-panel)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No application data yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-secondary" size={24} />
          <h3 className="text-xl font-bold">Top Matches for You</h3>
        </div>
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          {matches.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id} className="job-card" style={{ padding: '1.25rem' }}>
              <div className="flex justify-between items-start mb-4">
                <div className="company-badge">
                  <img src={job.company_logo || '/placeholder.png'} alt={job.company_name} className="company-logo" style={{ width: '40px', height: '40px' }} />
                  <div>
                    <div className="font-semibold text-sm">{job.title}</div>
                    <div className="text-xs text-gray-500">{job.company_name}</div>
                  </div>
                </div>
                <div className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  {job.match_percentage}% Match
                </div>
              </div>
              <div className="job-meta">
                <div className="job-meta-item text-xs"><MapPin size={12} /> {job.location || 'Remote'}</div>
                <div className="job-meta-item text-xs"><Briefcase size={12} /> {job.job_type}</div>
              </div>
            </Link>
          ))}
          {matches.length === 0 && <div className="text-gray-500">Add more skills to your profile to see matches!</div>}
        </div>
      </div>
    </div>
  );

  const RecruiterDashboard = () => (
    <div>
      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        <div className="stats-card">
          <div className="stats-value">{stats.jobsCount}</div>
          <div className="stats-label">Active Jobs</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{stats.applicationsCount}</div>
          <div className="stats-label">Total Applications</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{stats.company?.name || 'N/A'}</div>
          <div className="stats-label">Company</div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <Link to="/company-profile" className="btn btn-outline w-full justify-start">
              <Building size={18} /> Company Profile
            </Link>
            <Link to="/post-job" className="btn btn-outline w-full justify-start">
              <Briefcase size={18} /> Post New Job
            </Link>
            <Link to="/applications" className="btn btn-outline w-full justify-start">
              <Users size={18} /> View Applications
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <LineIcon size={18} className="text-primary" />
            <h3 className="text-lg font-semibold">Application Trends</h3>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            {analyticsData?.appTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.appTrend}>
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-panel)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--primary)" fillOpacity={1} fill="url(#colorApp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No activity in the last 14 days</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.firstName}!</h1>
        <p className="text-gray-400 mb-8">Ready for your next big career move?</p>
        
        {user.role === 'job_seeker' && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.search.value;
              navigate(`/jobs?q=${q}`);
            }}
            className="search-bar-premium max-w-2xl px-2"
          >
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search size={22} className="text-primary" />
              <input
                name="search"
                type="text"
                placeholder="Search by job title, company, or keywords..."
                className="input w-full"
              />
            </div>
            <button type="submit" className="btn btn-primary px-8">Find Jobs</button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="text-center p-6"><div className="loading-spinner"></div></div>
      ) : user.role === 'job_seeker' ? (
        <SeekerDashboard />
      ) : (
        <RecruiterDashboard />
      )}
    </div>
  );
};

export default Dashboard;