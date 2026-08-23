import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const StudentRequirementsPage = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { showToast } = useToast();

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await client.get('/requirements/me');
      const payload = response.data?.data;
      const list = payload?.requirements || payload?.data || (Array.isArray(payload) ? payload : []);
      setRequirements(Array.isArray(list) ? list : []);
    } catch (err) {
      setRequirements([]);
      showToast('Failed to fetch requirements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tuition requirement?')) return;
    try {
      setDeletingId(id);
      await client.delete(`/requirements/${id}`);
      showToast('Requirement deleted successfully', 'success');
      setRequirements(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete requirement', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-center text-gray-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-semibold text-gray-600">Loading Tuition Requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tuition Requirements</h1>
            <p className="text-gray-600 mt-1">Manage your posted tuition requirements and student requests</p>
          </div>
          <Link to="/post-requirement" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-sm flex items-center gap-2">
            <span>+</span> Post New Requirement
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {requirements.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <span className="text-4xl block mb-2">📋</span>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Requirements Posted Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Post what subject and class you need help with to connect with top tutors.</p>
              <Link to="/post-requirement" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                Post Your First Requirement
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requirements.map((req) => {
                const budgetText = typeof req.budget === 'object' && req.budget !== null
                  ? `₹${req.budget.amount || 0}/${req.budget.frequency === 'Hour' ? 'hr' : 'mo'}`
                  : `₹${req.budget || 0}/mo`;

                const subjectsText = Array.isArray(req.subjects) ? req.subjects.join(', ') : req.subjects || 'All Subjects';
                const classText = req.studentClass || req.class || 'Class 10';

                return (
                  <div key={req._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-blue-900">{req.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Posted on {new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'OPEN' || req.status === 'Open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {req.status || 'OPEN'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600 bg-slate-50 p-3.5 rounded-lg">
                      <div>
                        <span className="block text-gray-400 text-xs uppercase tracking-wider font-semibold">Student</span>
                        <span className="font-medium text-gray-800">{req.studentName} ({classText})</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-xs uppercase tracking-wider font-semibold">Subjects</span>
                        <span className="font-medium text-gray-800 truncate block">{subjectsText}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-xs uppercase tracking-wider font-semibold">Mode</span>
                        <span className="font-medium text-gray-800">{req.teachingMode}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-xs uppercase tracking-wider font-semibold">Budget</span>
                        <span className="font-medium text-emerald-700 font-bold">{budgetText}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3 mt-2 text-sm text-gray-500 flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs text-gray-500">📍 {req.location?.city ? `${req.location.city}${req.location.area ? `, ${req.location.area}` : ''}` : 'Location Available'}</span>
                      <div className="flex items-center gap-3">
                        <Link to="/search" className="text-blue-600 hover:underline font-semibold text-xs">
                          🔍 Find Matching Tutors
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(req._id)}
                          disabled={deletingId === req._id}
                          className="text-xs text-red-600 hover:text-red-800 font-bold border border-red-200 px-2.5 py-1 rounded hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {deletingId === req._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRequirementsPage;
