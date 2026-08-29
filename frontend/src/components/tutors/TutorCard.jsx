import React from 'react';
import { Link } from 'react-router-dom';
import { calculateDistanceKm, formatDistance } from '../../utils/locationUtils';
import './TutorCard.css';

const TutorCard = ({ tutor, userCoordinates, onUnlock }) => {
  const tutorUser = tutor.user || {};
  const photoUrl = tutor.profilePhoto?.url || tutor.profilePhoto || tutorUser.avatar || '';
  const name = tutorUser.name || tutor.name || 'Tutor';
  const isVerified = tutor.kycStatus === 'VERIFIED';

  const feeAmount = tutor.fees?.amount || tutor.hourlyRate || 0;
  const rawFreq = (tutor.fees?.frequency || (tutor.hourlyRate ? 'Hour' : 'Month')).toString().toUpperCase();
  const isHourly = rawFreq.includes('HOUR') || rawFreq === 'HOURLY';
  const cleanFreq = isHourly ? 'hr' : 'mo';
  const feeDisplay = feeAmount > 0 ? `₹${feeAmount} / ${cleanFreq}` : 'Fee on request';

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
            <img
              src={photoUrl}
              alt={name}
              className="mn-tutor-avatar-img w-full h-full object-cover object-center"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <span className="mn-tutor-avatar-fallback">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mn-tutor-info-wrap">
          <div className="mn-tutor-head-row">
            <h3 className="mn-tutor-card-name" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span>{name}</span>
              {isVerified && <span className="mn-verified-pill">✓ Verified</span>}
              {(tutor.isTop || tutor.isSubscribed || tutorUser.isSubscribed) && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '900',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                  }}
                >
                  ⭐ TOP
                </span>
              )}
              {tutor.isNew && !(tutor.isTop || tutor.isSubscribed || tutorUser.isSubscribed) && (
                <span
                  style={{
                    background: '#DCFCE7',
                    color: '#166534',
                    border: '1px solid #BBF7D0',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '900',
                    letterSpacing: '0.5px',
                  }}
                >
                  🌱 NEW
                </span>
              )}
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
