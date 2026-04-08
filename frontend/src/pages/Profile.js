import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users, skills, assets } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileText, X, Check, Plus, Trash2, GraduationCap, Briefcase, Star, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [formData, setFormData] = useState({
    headline: '', summary: '', location: '', yearsOfExperience: 0,
    preferredJobType: [], preferredSalaryMin: 0, preferredSalaryMax: 0,
    linkedinUrl: '', portfolioUrl: '', noticePeriod: '', isOpenToWork: true
  });
  const [educationData, setEducationData] = useState({
    institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, grade: '', description: ''
  });
  const [experienceData, setExperienceData] = useState({
    companyName: '', jobTitle: '', location: '', startDate: '', endDate: '', isCurrent: false, description: ''
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, skillsRes] = await Promise.all([
        users.getProfile(),
        skills.getAll()
      ]);
      setProfile(profileRes.data.profile);
      setSkillsList(skillsRes.data.skills);
      if (profileRes.data.profile) {
        const p = profileRes.data.profile;
        setFormData({
          headline: p.headline || '',
          summary: p.summary || '',
          location: p.location || '',
          yearsOfExperience: p.years_of_experience || 0,
          preferredJobType: p.preferred_job_type || [],
          preferredSalaryMin: p.preferred_salary_min || 0,
          preferredSalaryMax: p.preferred_salary_max || 0,
          linkedinUrl: p.linkedin_url || '',
          portfolioUrl: p.portfolio_url || '',
          noticePeriod: p.notice_period || '',
          isOpenToWork: p.is_open_to_work ?? true
        });
        setSelectedSkills(p.skills?.map(s => s.id) || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await users.updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
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

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await users.uploadResume(formData);
      setProfile(prev => ({ ...prev, resume_url: response.data.resumeUrl }));
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await users.addEducation(educationData);
      toast.success('Education added!');
      setShowEducationModal(false);
      setEducationData({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, grade: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add education');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      await users.deleteEducation(id);
      toast.success('Education deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleExperienceSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await users.addExperience(experienceData);
      toast.success('Experience added!');
      setShowExperienceModal(false);
      setExperienceData({ companyName: '', jobTitle: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add experience');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (id) => {
    try {
      await users.deleteExperience(id);
      toast.success('Experience deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const handleSkillsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await users.updateSkills(selectedSkills);
      toast.success('Skills updated!');
      setShowSkillsModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update skills');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setAddingSkill(true);
    try {
      const res = await skills.create({ name: newSkill.trim() });
      const newSkillData = res.data.skill;
      setSkillsList([...skillsList, newSkillData]);
      setSelectedSkills([...selectedSkills, newSkillData.id]);
      setNewSkill('');
      toast.success('Skill added!');
    } catch (error) {
      if (error.response?.status === 409) {
        const existingSkill = error.response.data.skill;
        if (existingSkill && !selectedSkills.includes(existingSkill.id)) {
          setSelectedSkills([...selectedSkills, existingSkill.id]);
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(138, 43, 226); // Primary Color
    doc.text(`${user.firstName} ${user.lastName}`, 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(formData.headline || 'Professional Profile', 20, 28);
    
    // Contact Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Location: ${formData.location || 'N/A'} | LinkedIn: ${formData.linkedinUrl || 'N/A'}`, 20, 35);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(20, 40, pageWidth - 20, 40);

    let yPos = 50;

    // Summary
    if (formData.summary) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Professional Summary', 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setTextColor(80);
      const splitSummary = doc.splitTextToSize(formData.summary, pageWidth - 40);
      doc.text(splitSummary, 20, yPos);
      yPos += (splitSummary.length * 5) + 10;
    }

    // Experience
    if (profile?.work_experience?.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Experience', 20, yPos);
      yPos += 2;
      
      const expData = profile.work_experience.map(exp => [
        `${exp.jobTitle}\n${exp.companyName}`,
        `${new Date(exp.startDate).getFullYear()} - ${exp.isCurrent ? 'Present' : new Date(exp.endDate).getFullYear()}`,
        exp.description || ''
      ]);

      doc.autoTable({
        startY: yPos + 5,
        head: [['Role & Company', 'Period', 'Description']],
        body: expData,
        theme: 'striped',
        headStyles: { fillColor: [138, 43, 226] },
        margin: { left: 20, right: 20 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Education
    if (profile?.education?.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Education', 20, yPos);
      yPos += 2;

      const eduData = profile.education.map(edu => [
        `${edu.degree}\n${edu.institution}`,
        `${new Date(edu.startDate).getFullYear()} - ${edu.isCurrent ? 'Present' : new Date(edu.endDate).getFullYear()}`,
        edu.grade || ''
      ]);

      doc.autoTable({
        startY: yPos + 5,
        head: [['Degree & Institution', 'Period', 'Grade/Note']],
        body: eduData,
        theme: 'plain',
        headStyles: { fillColor: [0, 229, 255] }, // Secondary Color
        margin: { left: 20, right: 20 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Skills
    if (profile?.skills?.length > 0) {
      if (yPos > 260) { doc.addPage(); yPos = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Technical Skills', 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setTextColor(80);
      const skillsText = profile.skills.map(s => s.name).join(' • ');
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 40);
      doc.text(splitSkills, 20, yPos);
    }

    doc.save(`${user.firstName}_${user.lastName}_Resume.pdf`);
    toast.success('Resume PDF generated!');
  };

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '50vh' }}><div className="loading-spinner"></div></div>;
  }

  const jobTypes = ['full_time', 'part_time', 'contract', 'internship', 'remote'];

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Resume</label>
              <div className="flex items-center gap-4">
                {profile?.resume_url ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg flex-1" style={{ backgroundColor: 'rgb(240 253 244)', border: '1px solid rgb(187 247 208)' }}>
                    <Check size={20} style={{ color: 'rgb(34 197 94)' }} />
                    <span className="text-sm font-medium flex-1" style={{ color: 'rgb(22 101 52)' }}>Resume uploaded</span>
                    <a href={assets.getResumeUrl(profile.resume_url)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: 'rgb(34 197 94)' }}>View Resume</a>
                  </div>
                ) : (
                  <div className="flex-1 p-3 rounded-lg text-gray-500 text-sm" style={{ backgroundColor: 'var(--gray-100)' }}>No resume uploaded</div>
                )}
                <label className="btn btn-outline btn-sm cursor-pointer">
                  <Upload size={16} className="mr-1" />
                  {uploadingResume ? 'Uploading...' : 'Upload'}
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" disabled={uploadingResume} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Headline</label>
              <input type="text" name="headline" className="input" value={formData.headline} onChange={handleChange} placeholder="e.g. Senior Developer with 5+ years experience" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Summary</label>
              <textarea name="summary" className="input" rows={4} value={formData.summary} onChange={handleChange} placeholder="Tell us about yourself..." />
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" name="location" className="input" value={formData.location} onChange={handleChange} placeholder="City, Country" />
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input type="number" name="yearsOfExperience" className="input" value={formData.yearsOfExperience} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Job Type</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {jobTypes.map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input type="checkbox" name="preferredJobType" value={type} checked={formData.preferredJobType.includes(type)} onChange={(e) => {
                      const updated = e.target.checked ? [...formData.preferredJobType, type] : formData.preferredJobType.filter(t => t !== type);
                      setFormData({ ...formData, preferredJobType: updated });
                    }} />
                    {type.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Expected Salary (Min)</label>
                <input type="number" name="preferredSalaryMin" className="input" value={formData.preferredSalaryMin} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Salary (Max)</label>
                <input type="number" name="preferredSalaryMax" className="input" value={formData.preferredSalaryMax} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input type="url" name="linkedinUrl" className="input" value={formData.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            </div>

            <div className="form-group">
              <label className="form-label">Portfolio URL</label>
              <input type="url" name="portfolioUrl" className="input" value={formData.portfolioUrl} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label className="form-label">Notice Period</label>
              <input type="text" name="noticePeriod" className="input" value={formData.noticePeriod} onChange={handleChange} placeholder="e.g. 2 weeks, 1 month" />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isOpenToWork" checked={formData.isOpenToWork} onChange={handleChange} />
                <span className="font-medium">Open to Work</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleExportPDF} className="btn btn-outline flex-1">
                <Download size={18} className="mr-2" />
                Export as PDF
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Education</h2>
              <button type="button" onClick={() => setShowEducationModal(true)} className="btn btn-outline btn-sm">
                <Plus size={16} /> Add
              </button>
            </div>
            {profile?.education?.length > 0 ? (
              <div className="flex flex-col gap-4">
                {profile.education.map(edu => (
                  <div key={edu.id} className="flex justify-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <div>
                      <div className="font-medium">{edu.degree}</div>
                      <div className="text-sm text-gray-500">{edu.institution}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(edu.startDate).getFullYear()} - {edu.isCurrent ? 'Present' : edu.endDate ? new Date(edu.endDate).getFullYear() : ''}
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteEducation(edu.id)} className="text-error">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No education added yet</p>
            )}
          </div>

          <div className="card mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Experience</h2>
              <button type="button" onClick={() => setShowExperienceModal(true)} className="btn btn-outline btn-sm">
                <Plus size={16} /> Add
              </button>
            </div>
            {profile?.work_experience?.length > 0 ? (
              <div className="flex flex-col gap-4">
                {profile.work_experience.map(exp => (
                  <div key={exp.id} className="flex justify-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <div>
                      <div className="font-medium">{exp.jobTitle}</div>
                      <div className="text-sm text-gray-500">{exp.companyName}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(exp.startDate).getFullYear()} - {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteExperience(exp.id)} className="text-error">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No experience added yet</p>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Skills</h2>
              <button type="button" onClick={() => setShowSkillsModal(true)} className="btn btn-outline btn-sm">
                <Plus size={16} /> Add
              </button>
            </div>
            {profile?.skills?.length > 0 ? (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {profile.skills.map(skill => (
                  <span key={skill.id} className="badge badge-primary">{skill.name}</span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills added yet</p>
            )}
          </div>
        </div>
      </div>

      {showEducationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Education</h2>
              <button onClick={() => setShowEducationModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleEducationSubmit}>
              <div className="form-group">
                <label className="form-label">Institution</label>
                <input type="text" className="input" value={educationData.institution} onChange={(e) => setEducationData({...educationData, institution: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Degree</label>
                <input type="text" className="input" value={educationData.degree} onChange={(e) => setEducationData({...educationData, degree: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Field of Study</label>
                <input type="text" className="input" value={educationData.fieldOfStudy} onChange={(e) => setEducationData({...educationData, fieldOfStudy: e.target.value})} />
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="input" value={educationData.startDate} onChange={(e) => setEducationData({...educationData, startDate: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="input" value={educationData.endDate} onChange={(e) => setEducationData({...educationData, endDate: e.target.value})} disabled={educationData.isCurrent} />
                </div>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={educationData.isCurrent} onChange={(e) => setEducationData({...educationData, isCurrent: e.target.checked, endDate: e.target.checked ? '' : educationData.endDate})} />
                  <span>Currently studying</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Grade</label>
                <input type="text" className="input" value={educationData.grade} onChange={(e) => setEducationData({...educationData, grade: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={educationData.description} onChange={(e) => setEducationData({...educationData, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Education'}</button>
            </form>
          </div>
        </div>
      )}

      {showExperienceModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Experience</h2>
              <button onClick={() => setShowExperienceModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleExperienceSubmit}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="input" value={experienceData.companyName} onChange={(e) => setExperienceData({...experienceData, companyName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input type="text" className="input" value={experienceData.jobTitle} onChange={(e) => setExperienceData({...experienceData, jobTitle: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="input" value={experienceData.location} onChange={(e) => setExperienceData({...experienceData, location: e.target.value})} />
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="input" value={experienceData.startDate} onChange={(e) => setExperienceData({...experienceData, startDate: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="input" value={experienceData.endDate} onChange={(e) => setExperienceData({...experienceData, endDate: e.target.value})} disabled={experienceData.isCurrent} />
                </div>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={experienceData.isCurrent} onChange={(e) => setExperienceData({...experienceData, isCurrent: e.target.checked, endDate: e.target.checked ? '' : experienceData.endDate})} />
                  <span>Currently working here</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={experienceData.description} onChange={(e) => setExperienceData({...experienceData, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Experience'}</button>
            </form>
          </div>
        </div>
      )}

      {showSkillsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Skills</h2>
              <button onClick={() => setShowSkillsModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddNewSkill} className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="input flex-1" 
                placeholder="Add new skill..." 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" disabled={addingSkill || !newSkill.trim()}>
                {addingSkill ? '...' : 'Add'}
              </button>
            </form>
            <form onSubmit={handleSkillsSubmit}>
              <div className="form-group">
                <label className="form-label">Select Skills</label>
                <div className="flex gap-2 flex-wrap" style={{ flexWrap: 'wrap', maxHeight: '300px', overflowY: 'auto' }}>
                  {skillsList.map(skill => (
                    <label key={skill.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer skill-checkbox-label">
                      <input type="checkbox" checked={selectedSkills.includes(skill.id)} onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSkills([...selectedSkills, skill.id]);
                        } else {
                          setSelectedSkills(selectedSkills.filter(id => id !== skill.id));
                        }
                      }} />
                      <span>{skill.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Skills'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;