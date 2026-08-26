import client from './client';

export const uploadPhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return client.post('/upload/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const normalizeType = (type) => {
  if (!type) return 'AADHAAR';
  const str = String(type).toUpperCase();
  if (str.includes('PAN')) return 'PAN';
  if (str.includes('VOTER')) return 'VOTER_ID';
  if (str.includes('DRIVING') || str.includes('LICENSE')) return 'DRIVING_LICENSE';
  if (str.includes('PASSPORT')) return 'PASSPORT';
  return 'AADHAAR';
};

export const uploadDocument = (file, govtIdType = 'AADHAAR') => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('govtIdType', normalizeType(govtIdType));
  return client.post('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadTutorId = (file, govtIdType = 'AADHAAR') => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('govtIdType', normalizeType(govtIdType));
  return client.post('/tutors/upload-id', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

