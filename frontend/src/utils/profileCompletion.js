// ============================================================
// profileCompletion.js
// Dynamic Profile Completion Calculator for Student & Tutor
// ============================================================

/**
 * Calculate Student Profile Completion Percentage & Missing Fields
 */
export const calculateStudentCompletion = (user, profile) => {
  const hasBasicInfo = !!(user?.name && (user?.phone || profile?.whatsappNumber || profile?.parentDetails?.phone) && (profile?.location?.city || profile?.location?.area || profile?.location?.state));
  const photo = user?.avatar || profile?.profilePhoto?.url || profile?.profilePhoto;
  const hasPhoto = !!(photo && typeof photo === 'string' && photo.length > 5 && !photo.includes('placeholder') && !photo.includes('default'));
  const hasAcademic = !!(profile?.academicDetails?.degree || profile?.studentDetails?.class || profile?.academicDetails?.college || profile?.studentDetails?.board);
  
  const goals = profile?.learningGoals || profile?.academicDetails?.learningGoals;
  const hasGoals = Array.isArray(goals) ? goals.length > 0 : (typeof goals === 'string' && goals.trim().length > 0);
  
  const subjects = profile?.preferredSubjects || profile?.academicDetails?.preferredSubjects || profile?.academicDetails?.subjectsRequired;
  const hasSubjects = Array.isArray(subjects) ? subjects.length > 0 : (typeof subjects === 'string' && subjects.trim().length > 0);
  
  const bio = profile?.bio || profile?.aboutMe;
  const hasBio = !!(bio && bio.trim().length > 0);

  const checklist = [
    { id: 'basic', label: 'Basic Information', completed: hasBasicInfo, weight: 20 },
    { id: 'academic', label: 'Academic Details', completed: hasAcademic, weight: 20 },
    { id: 'photo', label: 'Profile Photo', completed: hasPhoto, weight: 15 },
    { id: 'goals', label: 'Learning Goals', completed: hasGoals, weight: 15 },
    { id: 'subjects', label: 'Preferred Subjects', completed: hasSubjects, weight: 15 },
    { id: 'bio', label: 'Short Bio', completed: hasBio, weight: 15 },
  ];

  let score = 0;
  checklist.forEach(item => {
    if (item.completed) score += item.weight;
  });

  const percentage = Math.min(100, Math.round(score));
  return { percentage, checklist };
};

/**
 * Calculate Tutor Profile Completion Percentage & Missing Fields
 */
export const calculateTutorCompletion = (user, profile) => {
  const hasBasicInfo = !!(user?.name && (profile?.location?.city || profile?.location?.area) && (user?.phone || user?.email));
  const photo = user?.avatar || profile?.profilePhoto?.url || profile?.profilePhoto;
  const hasPhoto = !!(photo && typeof photo === 'string' && photo.length > 5 && !photo.includes('placeholder') && !photo.includes('default'));
  const hasTeachingDetails = !!(profile?.bio && (profile?.teachingModes?.length > 0 || profile?.languages?.length > 0));
  const hasSubjects = !!(profile?.subjects?.length > 0 || profile?.grades?.length > 0);
  const hasExperience = !!((profile?.education?.length > 0) || (profile?.experience?.years !== undefined));
  const hasVideo = !!(profile?.introVideo?.url || (typeof profile?.introVideo === 'string' && profile?.introVideo.length > 5));

  const checklist = [
    { id: 'basic', label: 'Basic Information', completed: hasBasicInfo, weight: 20 },
    { id: 'photo', label: 'Profile Photo', completed: hasPhoto, weight: 15 },
    { id: 'teaching', label: 'Teaching Details', completed: hasTeachingDetails, weight: 20 },
    { id: 'subjects', label: 'Subjects & Courses', completed: hasSubjects, weight: 15 },
    { id: 'experience', label: 'Experience', completed: hasExperience, weight: 15 },
    { id: 'video', label: 'Introduction Video', completed: hasVideo, weight: 15 },
  ];

  let score = 0;
  checklist.forEach(item => {
    if (item.completed) score += item.weight;
  });

  const percentage = Math.min(100, Math.round(score));
  return { percentage, checklist };
};
