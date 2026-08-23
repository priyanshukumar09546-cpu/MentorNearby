import React from 'react';

const ReviewCard = ({ review }) => {
  return (
    <div className="card mb-4">
      <div className="flex justify-between">
        <h4 style={{ fontSize: '1rem' }}>{review.studentName}</h4>
        <div className="stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < review.rating ? 'star-filled' : 'star-empty'}>★</span>
          ))}
        </div>
      </div>
      <p className="text-sm text-secondary mt-2">{review.comment}</p>
    </div>
  );
};
export default ReviewCard;
