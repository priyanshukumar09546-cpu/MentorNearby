import React from 'react';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';

const AdminGenericPage = ({ title }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AdminEmptyState 
        icon="🚧"
        title={title}
        message="This module is connected to the backend API but requires UI population."
      />
    </div>
  );
};

export default AdminGenericPage;
