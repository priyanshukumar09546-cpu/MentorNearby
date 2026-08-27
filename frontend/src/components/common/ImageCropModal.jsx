// ============================================================
// components/common/ImageCropModal.jsx
// WhatsApp / Instagram Style Circular Image Cropper
// ============================================================

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import './ImageCropModal.css';

const ImageCropModal = ({ isOpen, imageSrc, onClose, onCropComplete }) => {
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

  const onCropAreaComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels || isProcessing) return;
    try {
      setIsProcessing(true);
      const croppedData = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      await onCropComplete(croppedData);
      onClose();
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="icm-modal-overlay" onClick={onClose}>
      <div className="icm-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* TOP BAR: WhatsApp / Instagram style */}
        <header className="icm-header">
          <button
            type="button"
            className="icm-close-btn"
            onClick={onClose}
            title="Cancel"
            disabled={isProcessing}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="icm-title-box">
            <span className="icm-title">Crop Photo</span>
            <span className="icm-subtitle">Move and scale to fit circle</span>
          </div>

          <button
            type="button"
            className={`icm-tick-btn ${isProcessing ? 'icm-loading' : ''}`}
            onClick={handleSaveCrop}
            title="Save Profile Photo"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="icm-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
        </header>

        {/* CROPPER CANVAS AREA */}
        <div className="icm-cropper-stage">
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

        {/* CONTROLS FOOTER */}
        <footer className="icm-footer">
          <div className="icm-zoom-control">
            <button
              type="button"
              className="icm-zoom-step-btn"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
              disabled={zoom <= 1}
            >
              −
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="icm-zoom-slider"
            />
            <button
              type="button"
              className="icm-zoom-step-btn"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
              disabled={zoom >= 3}
            >
              +
            </button>
            <span className="icm-zoom-val">{Math.round(zoom * 100)}%</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ImageCropModal;
