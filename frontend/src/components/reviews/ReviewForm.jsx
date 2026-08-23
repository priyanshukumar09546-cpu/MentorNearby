import React, { useState } from 'react';

const ReviewForm = ({ onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <form className="card" onSubmit={(e) => { e.preventDefault(); onSubmit({ rating, comment }); }}>
      <h4>Write a Review</h4>
      <div className="form-group mt-4">
        <label className="form-label">Rating</label>
        <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Comment</label>
        <textarea className="form-textarea" value={comment} onChange={(e) => setComment(e.target.value)} required />
      </div>
      <button className="btn btn-primary" type="submit">Submit Review</button>
    </form>
  );
};
export default ReviewForm;
