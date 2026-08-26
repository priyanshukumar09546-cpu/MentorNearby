import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const TutorRequestsPage = () => {
  const [activeTab, setActiveTab] = useState('nearby');
  const [requirements, setRequirements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'nearby') {
          // Assuming an endpoint to fetch open requirements
          const response = await client.get('/requirements');
          setRequirements(response.data.data.requirements);
        } else {
          // Placeholder for applications endpoint
          const response = await client.get('/requirements/my-applications');
          setApplications(response.data.data.applications);
        }
      } catch (err) {
        // showToast('Failed to fetch data', 'error');
        // fallback empty arrays
        setRequirements([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleApply = async (reqId) => {
    try {
      await client.post(`/requirements/${reqId}/apply`);
      showToast('Applied successfully!', 'success');
      // Refresh list
      const response = await client.get('/requirements');
      setRequirements(response.data.data.requirements);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Tuition Requests</h1>
          <p className="text-gray-600 mt-1">Find nearby tuition requirements and track your applications.</p>
          
          <div className="flex border-b border-gray-200 mt-6">
            <button 
              className={`py-3 px-6 font-medium text-sm border-b-2 ${activeTab === 'nearby' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('nearby')}
            >
              Nearby Requirements
            </button>
            <button 
              className={`py-3 px-6 font-medium text-sm border-b-2 ${activeTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('applications')}
            >
              My Applications
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : activeTab === 'nearby' ? (
          <div className="space-y-4">
            {requirements.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm text-gray-500">
                No nearby requirements found at the moment.
              </div>
            ) : (
              requirements.map((req) => (
                <div key={req._id || req.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-blue-900">{req.title || 'Tuition Requirement'}</h3>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                      {req.teachingMode || 'Online'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                    <div>
                      <span className="block text-gray-400 text-xs uppercase tracking-wider">Class</span>
                      <span className="font-medium text-gray-800">{req.studentClass || req.classLevel || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase tracking-wider">Subjects</span>
                      <span className="font-medium text-gray-800">{Array.isArray(req.subjects) ? req.subjects.join(', ') : (req.subject || 'All Subjects')}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase tracking-wider">Location</span>
                      <span className="font-medium text-gray-800">{req.teachingMode === 'Online' ? 'Online' : `${req.area || ''} ${req.city || ''}`.trim() || 'Nearby'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs uppercase tracking-wider">Budget</span>
                      <span className="font-medium text-gray-800">₹{req.budget || req.hourlyFee || 500}/mo</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Posted on {new Date(req.createdAt || Date.now()).toLocaleDateString()}</span>
                    <button 
                      onClick={() => handleApply(req._id || req.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium transition"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm text-gray-500">
                You haven't applied to any requirements yet.
              </div>
            ) : (
              applications.map((app) => (
                <div key={app._id || app.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{app.requirement?.title || 'Application'}</h3>
                  <p className="text-sm text-gray-600 mb-3">Applied on {new Date(app.createdAt || Date.now()).toLocaleDateString()}</p>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    app.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                    app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status || 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorRequestsPage;
