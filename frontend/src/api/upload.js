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

export const uploadDocument = (file, govtIdType = 'Aadhaar Card') => {
  const formData = new FormData();
  formData.append('document', file);
  if (govtIdType) {
    formData.append('govtIdType', govtIdType);
  }
  return client.post('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadTutorId = (file, govtIdType = 'Aadhaar Card') => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('govtIdType', govtIdType);
  return client.post('/tutors/upload-id', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

