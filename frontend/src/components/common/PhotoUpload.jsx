import React, { useState, useRef } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const PhotoUpload = ({
  currentUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  label = 'Profile Photo',
  maxSizeMb = 5
}) => {
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid file format. Please upload JPG, PNG or WEBP.', 'error');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      showToast(`File size exceeds ${maxSizeMb}MB. Please choose a smaller image.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await client.post('/upload/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = response.data.data.url;
      const publicId = response.data.data.publicId;

      setPreviewUrl(uploadedUrl);
      if (onPhotoUploaded) {
        onPhotoUploaded(uploadedUrl, publicId);
      }
      showToast('Profile photo updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPhotoRemoved) {
      onPhotoRemoved();
    }
    showToast('Photo removed', 'info');
  };

  return (
    <div className="space-y-3 font-sans">
      <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#FBF9F5] p-5 rounded-2xl border border-[#E8E2D8]">
        {/* 150px Circular Photo Preview */}
        <div className="relative flex-shrink-0">
          <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-white border-2 border-[#E8E2D8] shadow-xs flex items-center justify-center text-[#667085]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-[#D6A13A]">👤</span>
            )}
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Upload Controls & Metadata */}
        <div className="space-y-3 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 bg-[#D6A13A] hover:bg-[#b88300] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>📷</span> {previewUrl ? 'Replace Photo' : 'Upload Photo'}
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="px-4 py-2.5 bg-white hover:bg-[#FCEAEA] text-[#D9534F] border border-[#E8E2D8] text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          <div className="space-y-1 text-xs text-[#667085]">
            <p className="font-semibold text-[#1F2937]">Accepted Formats: JPG, PNG, WEBP</p>
            <p>Maximum file size: {maxSizeMb} MB</p>
            <p className="text-[11px] text-[#667085]">Immediate real-time preview after selection.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
