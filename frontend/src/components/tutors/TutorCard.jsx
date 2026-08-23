import React from 'react';
import { Link } from 'react-router-dom';
import { calculateDistanceKm, formatDistance } from '../../utils/locationUtils';
import './TutorCard.css';

const TutorCard = ({ tutor, userCoordinates, onUnlock }) => {
  const tutorUser = tutor.user || {};
  const photoUrl = tutor.profilePhoto?.url || tutor.profilePhoto || tutorUser.avatar || '';
  const name = tutorUser.name || tutor.name || 'Tutor';
  const isVerified = tutor.kycStatus === 'VERIFIED';

  const feeAmount = tutor.fees?.amount || 0;
  const feeFreq = tutor.fees?.frequency || 'Month';
  const feeDisplay = `₹${feeAmount} / ${feeFreq.toLowerCase()}`;

  // Haversine distance calculation
  const tutorLat = tutor.location?.coordinates?.coordinates?.[1];
  const tutorLng = tutor.location?.coordinates?.coordinates?.[0];

  const userLat = userCoordinates?.latitude;
  const userLng = userCoordinates?.longitude;

  const distanceKm =
    tutorLat && tutorLng && userLat && userLng
      ? calculateDistanceKm(userLat, userLng, tutorLat, tutorLng)
      : null;

  const distStr = formatDistance(distanceKm);

  return (
    <div className="mn-tutor-full-card">
      <div className="mn-tutor-main-row">
        {/* Tutor Photo */}
        <div className="mn-tutor-avatar-frame">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="mn-tutor-avatar-img" />
          ) : (
            <span className="mn-tutor-avatar-fallback">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mn-tutor-info-wrap">
          <div className="mn-tutor-head-row">
            <h3 className="mn-tutor-card-name">
              <span>{name}</span>
              {isVerified && <span className="mn-verified-pill">✓ Verified</span>}
            </h3>

            {/* Rating */}
            <div className="mn-tutor-rating-pill">
              <span>⭐</span> {tutor.averageRating || '4.8'}{' '}
              <span style={{ opacity: 0.7, fontWeight: 500 }}>
                ({tutor.totalReviews || 12})
              </span>
            </div>
          </div>

          <p className="mn-tutor-headline-txt">
            {tutor.professionalHeadline || 'Professional Home & Online Educator'}
          </p>

          <div className="mn-tutor-meta-line">
            <span>
              📍{' '}
              <strong>
                {tutor.location?.area ? `${tutor.location.area}, ` : ''}
                {tutor.location?.city || 'Local Area'}
              </strong>
            </span>
            {distStr && <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>📏 {distStr}</span>}
            <span>
              • 🎓 <strong>{tutor.experience?.years || 0} Yrs Exp.</strong>
            </span>
          </div>

          {/* Subject Pills */}
          <div className="mn-tutor-chips-row">
            {tutor.subjects?.slice(0, 4).map((s) => (
              <span key={s} className="mn-subject-pill-tag">
                {s}
              </span>
            ))}
            {tutor.subjects?.length > 4 && (
              <span className="mn-subject-more-tag">
                +{tutor.subjects.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mn-tutor-card-footer">
        <div>
          <span className="mn-tutor-fee-lbl">Expected Fee</span>
          <p className="mn-tutor-fee-amount">{feeDisplay}</p>
        </div>

        <div className="mn-tutor-actions-group">
          <Link
            to={`/tutor/${tutor._id || tutor.user?._id || tutor.id}`}
            className="mn-tutor-btn-outline"
          >
            View Profile
          </Link>
          {onUnlock && (
            <button
              type="button"
              onClick={() => onUnlock(tutor._id || tutor.user?._id || tutor.id)}
              className="mn-tutor-btn-unlock"
            >
              Unlock Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorCard;
