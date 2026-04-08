import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jobs, skills, companies } from '../services/api';
import { LayoutDashboard, Briefcase, MapPin, DollarSign, Clock, CheckCircle, Send, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PostJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [skillsList, setSkillsList] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', requirements: '', responsibilities: '',
    jobType: 'full_time', experienceLevel: 'mid', location: '', remoteType: 'hybrid',
    salaryMin: '', salaryMax: '', salaryCurrency: 'USD', isSalaryVisible: true,
    applicationDeadline: '', skillIds: []
  });

  useEffect(() => {
    fetchData();
  }, [editId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsRes, companyRes] = await Promise.all([
        skills.getAll(),
        companies.getMyCompany()
      ]);
      setSkillsList(skillsRes.data.skills || []);
      setCompany(companyRes.data.company);
      
      if (!companyRes.data.company) {
        toast.error('Please create a company profile first');
        navigate('/company-profile');
        return;
      }

      if (editId) {
        const jobRes = await jobs.getById(editId);
        const job = jobRes.data.job;
        
        // Format date for input
        let deadline = '';
        if (job.application_deadline) {
          deadline = job.application_deadline.split('T')[0];
        }

        setFormData({
          title: job.title || '',
          description: job.description || '',
          requirements: job.requirements || '',
          responsibilities: job.responsibilities || '',
          jobType: job.job_type || 'full_time',
          experienceLevel: job.experience_level || 'mid',
          location: job.location || '',
          remoteType: job.remote_type || 'hybrid',
          salaryMin: job.salary_min || '',
          salaryMax: job.salary_max || '',
          salaryCurrency: job.salary_currency || 'USD',
          isSalaryVisible: job.is_salary_visible ?? true,
          applicationDeadline: deadline,
          skillIds: job.skills?.map(s => s.id) || []
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSkillToggle = (skillId) => {
    const updated = formData.skillIds.includes(skillId)
      ? formData.skillIds.filter(id => id !== skillId)
      : [...formData.skillIds, skillId];
    setFormData({ ...formData, skillIds: updated });
  };

  const handleAddNewSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setAddingSkill(true);
    try {
      const res = await skills.create({ name: newSkill.trim() });
      const newSkillData = res.data.skill;
      setSkillsList([...skillsList, newSkillData]);
      setFormData({ ...formData, skillIds: [...formData.skillIds, newSkillData.id] });
      setNewSkill('');
      toast.success('Skill added!');
    } catch (error) {
      if (error.response?.status === 409) {
        const existingSkill = error.response.data.skill;
        if (existingSkill && !formData.skillIds.includes(existingSkill.id)) {
          setFormData({ ...formData, skillIds: [...formData.skillIds, existingSkill.id] });
          toast.success('Skill added!');
        } else {
          toast.error('Skill already selected');
        }
      } else {
        toast.error('Failed to add skill');
      }
    } finally {
      setAddingSkill(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null
      };

      if (editId) {
        await jobs.update(editId, data);
        toast.success('Job updated successfully!');
      } else {
        await jobs.create(data);
        toast.success('Job posted successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${editId ? 'update' : 'post'} job`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="loading-spinner mb-4"></div>
        <p className="text-gray-500">Loading job information...</p>
      </div>
    );
  }

  const jobTypes = ['full_time', 'part_time', 'contract', 'internship', 'remote'];
  const remoteTypes = ['onsite', 'remote', 'hybrid'];
  const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-primary bg-opacity-10 text-primary">
            <Briefcase size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{editId ? 'Edit Job Posting' : 'Post a New Job'}</h1>
            <p className="text-gray-500">{editId ? 'Make changes to your existing listing' : 'Reach thousands of qualified candidates today'}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6 p-4 bg-primary bg-opacity-10 rounded-lg border border-primary border-opacity-20">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Briefcase size={20} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Posting for</p>
                <p className="text-white font-bold">{company?.name}</p>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" /> Basic Information
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  className="input" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Senior Software Engineer" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea 
                  name="description" 
                  className="input min-h-[150px]" 
                  rows={6} 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  placeholder="Tell candidates about the role, team, and company culture..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Requirements</label>
                  <textarea 
                    name="requirements" 
                    className="input" 
                    rows={4} 
                    value={formData.requirements} 
                    onChange={handleChange} 
                    placeholder="Key qualifications and experience needed..." 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Responsibilities</label>
                  <textarea 
                    name="responsibilities" 
                    className="input" 
                    rows={4} 
                    value={formData.responsibilities} 
                    onChange={handleChange} 
                    placeholder="Day-to-day tasks and expectations..." 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-secondary" /> Job Details & Logistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="form-group">
                <label className="form-label">Job Type *</label>
                <select name="jobType" className="input" value={formData.jobType} onChange={handleChange}>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select name="experienceLevel" className="input" value={formData.experienceLevel} onChange={handleChange}>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Work Style</label>
                <select name="remoteType" className="input" value={formData.remoteType} onChange={handleChange}>
                  {remoteTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Specific Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3.5 text-gray-500" />
                <input 
                  type="text" 
                  name="location" 
                  className="input pl-10" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. San Francisco, CA or Remote" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-6">
              <div className="form-group">
                <label className="form-label">Salary Min</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-500" />
                  <input type="number" name="salaryMin" className="input pl-10" value={formData.salaryMin} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Salary Max</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-500" />
                  <input type="number" name="salaryMax" className="input pl-10" value={formData.salaryMax} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select name="salaryCurrency" className="input" value={formData.salaryCurrency} onChange={handleChange}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-8 items-center pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${formData.isSalaryVisible ? 'bg-primary' : 'bg-gray-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${formData.isSalaryVisible ? 'translate-x-4' : ''}`}></div>
                </div>
                <input type="checkbox" name="isSalaryVisible" className="hidden" checked={formData.isSalaryVisible} onChange={handleChange} />
                <span className="font-medium text-gray-400 group-hover:text-white transition-colors">Show Salary to Candidates</span>
              </label>

              <div className="flex items-center gap-3">
                <Clock size={18} className="text-gray-500" />
                <label className="form-label mb-0 w-24">Deadline:</label>
                <input type="date" name="applicationDeadline" className="input py-2" value={formData.applicationDeadline} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-primary" /> Required Skills & Expertise
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Select the key skills that our AI matching engine will use to rank candidates.</p>
            
            <form onSubmit={handleAddNewSkill} className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="input flex-1" 
                placeholder="Add new skill..." 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" disabled={addingSkill || !newSkill.trim()}>
                <Plus size={18} />
              </button>
            </form>
            
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {skillsList.map(skill => {
                const isActive = formData.skillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    className={`badge px-4 py-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isActive 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-glass-border/20 text-gray-400 hover:text-white border-glass-border'
                    }`}
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn btn-secondary btn-lg flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg flex-1 font-bold text-lg" disabled={saving}>
              {saving ? 'Processing...' : editId ? 'Update Job Posting' : 'Publish Job Opportunity'}
              {!saving && <Send size={20} className="ml-3" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;