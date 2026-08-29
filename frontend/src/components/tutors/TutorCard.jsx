import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { calculateDistanceKm, formatDistance } from '../../utils/locationUtils';
import './TutorCard.css';

const TutorCard = ({ tutor, userCoordinates, onUnlock }) => {
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const tutorUser = tutor.user || {};
  const photoUrl = tutor.profilePhoto?.url || tutor.profilePhoto || tutorUser.avatar || '';
  const name = tutorUser.name || tutor.name || 'Tutor';
  const isVerified = tutor.kycStatus === 'VERIFIED';

  const handleChatClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsChatLoading(true);
      const recipientId = tutor.user?._id || tutor._id || tutor.id;
      const res = await client.post('/chat/initiate', { recipientId });
      const data = res.data?.data || res.data || {};

      if (data.needSubscription || res.data?.needSubscription) {
        if (onUnlock) {
          onUnlock(recipientId);
        } else {
          navigate(`/subscription?redirect=${encodeURIComponent(`/chat?recipient=${recipientId}`)}`);
        }
        return;
      }

      const convId = data.conversationId || res.data?.conversationId;
      navigate(`/messages?chat=${convId || ''}&user=${recipientId}&recipient=${recipientId}`);
    } catch (err) {
      if (
        err.response?.status === 403 &&
        (err.response?.data?.needSubscription || err.response?.data?.code === 'SUBSCRIPTION_REQUIRED')
      ) {
        if (onUnlock) {
          onUnlock(tutor.user?._id || tutor._id || tutor.id);
        } else {
          navigate(`/subscription?redirect=${encodeURIComponent(`/chat?recipient=${tutor.user?._id || tutor._id || tutor.id}`)}`);
        }
      } else {
        navigate(`/messages?recipient=${tutor.user?._id || tutor._id || tutor.id}`);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const feeAmount = tutor.fees?.amount || tutor.monthlyFees || tutor.monthly_fees || tutor.fees || tutor.hourlyRate || tutor.price || 0;
  const feeDisplay = feeAmount > 0 ? `₹${Number(feeAmount).toLocaleString('en-IN')} / month` : 'Fee on request';

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

        <div className="mn-tutor-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleChatClick}
            disabled={isChatLoading}
            title="Chat with tutor"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#000000',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isChatLoading ? '...' : '💬'}
          </button>
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
