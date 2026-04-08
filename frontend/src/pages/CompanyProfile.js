import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { companies } from '../services/api';
import toast from 'react-hot-toast';

const CompanyProfile = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', industry: '', companySize: '',
    foundedYear: '', website: '', headquarters: '', locations: [], benefits: []
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await companies.getMyCompany();
      setCompany(response.data.company);
      if (response.data.company) {
        setFormData({
          name: response.data.company.name || '',
          description: response.data.company.description || '',
          industry: response.data.company.industry || '',
          companySize: response.data.company.company_size || '',
          foundedYear: response.data.company.founded_year || '',
          website: response.data.company.website || '',
          headquarters: response.data.company.headquarters || '',
          locations: response.data.company.locations || [],
          benefits: response.data.company.benefits || []
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (company) {
        await companies.update(company.id, formData);
        toast.success('Company updated successfully!');
      } else {
        await companies.create(formData);
        toast.success('Company created successfully!');
      }
      fetchCompany();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '50vh' }}><div className="loading-spinner"></div></div>;
  }

  const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
      
      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="input" rows={4} value={formData.description} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input type="text" name="industry" className="input" value={formData.industry} onChange={handleChange} placeholder="e.g. Technology" />
              </div>
              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select name="companySize" className="input" value={formData.companySize} onChange={handleChange}>
                  <option value="">Select size</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size} employees</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Founded Year</label>
                <input type="number" name="foundedYear" className="input" value={formData.foundedYear} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Headquarters</label>
                <input type="text" name="headquarters" className="input" value={formData.headquarters} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input type="url" name="website" className="input" value={formData.website} onChange={handleChange} placeholder="https://..." />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
            </button>
          </form>
        </div>

        <div>
          {company && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{company.stats?.total_jobs || 0}</div>
                  <div className="text-sm text-gray-500">Total Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{company.stats?.total_applications || 0}</div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;