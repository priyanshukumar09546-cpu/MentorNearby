import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const PostRequirementPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    studentName: '',
    studentClass: '',
    board: '',
    medium: 'English',
    subjects: '',
    teachingMode: 'Offline',
    address: '',
    area: '',
    city: '',
    pincode: '',
    budget: '',
    preferredGender: 'Any',
    requirements: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subjectsArray = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
      const payload = {
        ...formData,
        subjects: subjectsArray,
        budget: Number(formData.budget) || 0
      };
      await client.post('/requirements', payload);
      showToast('Tuition requirement posted successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post requirement', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-900 py-6 px-8">
          <h1 className="text-2xl font-bold text-white">Post a Tuition Requirement</h1>
          <p className="text-blue-100 mt-1">Find the perfect tutor by detailing what you need.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Title *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="e.g. Need Math Tutor for Class 10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
              <input type="text" name="studentName" required value={formData.studentName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Student's full name" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade *</label>
              <input type="text" name="studentClass" required value={formData.studentClass} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="e.g. Class 10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
              <input type="text" name="board" value={formData.board} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="CBSE, ICSE, State..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
              <select name="medium" value={formData.medium} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Regional">Regional</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (comma separated) *</label>
            <input type="text" name="subjects" required value={formData.subjects} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Math, Science, English..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Mode *</label>
              <select name="teachingMode" value={formData.teachingMode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                <option value="Offline">Offline (At Home)</option>
                <option value="Online">Online</option>
                <option value="Both">Both (Online/Offline)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (₹) *</label>
              <input type="number" name="budget" required value={formData.budget} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="e.g. 5000" />
            </div>
          </div>

          {formData.teachingMode !== 'Online' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                <input type="text" name="address" required={formData.teachingMode !== 'Online'} value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="House no, Street..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locality/Area *</label>
                <input type="text" name="area" required={formData.teachingMode !== 'Online'} value={formData.area} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="e.g. Andheri West" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" name="city" required={formData.teachingMode !== 'Online'} value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input type="text" name="pincode" required={formData.teachingMode !== 'Online'} value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="6-digit pincode" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tutor Gender Preference</label>
            <select name="preferredGender" value={formData.preferredGender} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition">
              <option value="Any">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Requirements</label>
            <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Any specific requirements (e.g. specific days, timing...)"></textarea>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-md transition disabled:opacity-70">
              {loading ? 'Posting...' : 'Post Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostRequirementPage;
