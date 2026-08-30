// ============================================================
// pages/Auth/RegisterPage.jsx
// MentorNearby Unified Registration (Student & Tutor Wizards)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import StudentRegistrationWizard from '../../components/students/StudentRegistrationWizard';
import TutorRegistrationWizard from '../../components/tutors/TutorRegistrationWizard';
import './LoginPage.css';

const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'TUTOR' || location.pathname.includes('tutor')) {
      setSelectedRole('TUTOR');
    } else {
      setSelectedRole('STUDENT');
    }
  }, [location]);

  // If Tutor role is selected, directly render the Unified Tutor Registration Wizard
  if (selectedRole === 'TUTOR') {
    return <TutorRegistrationWizard onBackToRoleSelect={() => setSelectedRole('STUDENT')} />;
  }

  // If Student role is selected, render the Reference-Matched Student Registration Wizard
  return <StudentRegistrationWizard onSwitchToTutor={() => setSelectedRole('TUTOR')} />;
};

export default RegisterPage;
