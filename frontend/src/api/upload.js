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

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('document', file);
  return client.post('/upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
