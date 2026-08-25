// ============================================================
// components/common/PhotoCropModal.jsx
// Interactive Profile Photo Cropper using react-easy-crop
// Circular 1:1 Aspect Ratio • Zoom 1x-3x • 400x400 output • Mobile Touch Zoom
// ============================================================

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const PhotoCropModal = ({ isOpen, imageSrc, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  const onCropAreaComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedData = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedData);
      onClose();
    } catch (err) {
      console.error('Error cropping image:', err);
      alert('Photo crop karne me error aaya. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Apni photo ko adjust karein 📸
            </h3>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              💡 Face ko beech me rakhein, clear background
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base"
          >
            ✕
          </button>
        </div>

        {/* Cropper Body */}
        <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold w-12">🔍 Zoom:</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-sky-400 font-bold min-w-[36px] text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveCrop}
              className="flex-1 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <span>✂️</span>
              <span>{isProcessing ? 'Saving Photo...' : 'Crop & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropModal;
