// ============================================================
// utils/cropImage.js
// Canvas utility for client-side image cropping, resizing (400x400) & compression (<300KB)
// ============================================================

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  const targetSize = 400; // Output 400x400 professional avatar
  canvas.width = targetSize;
  canvas.height = targetSize;

  ctx.imageSmoothingQuality = 'high';
  ctx.imageSmoothingEnabled = true;

  // Render cropped image onto 400x400 canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const croppedUrl = URL.createObjectURL(blob);
        const croppedFile = new File([blob], 'tutor_profile_photo.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve({
          blob,
          file: croppedFile,
          url: croppedUrl,
        });
      },
      'image/jpeg',
      0.88 // 88% quality keeps size < 300KB
    );
  });
}
