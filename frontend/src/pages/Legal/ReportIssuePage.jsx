import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ReportIssuePage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    issueCategory: 'PAYMENT_OR_DOWNLOAD',
    subject: '',
    description: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: 'var(--color-bg, #FAF8F5)', minHeight: '80vh', padding: '48px 0 80px', color: 'var(--color-text-primary, #18181B)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-muted, #8C827A)', marginBottom: 24 }}>
          <Link to="/" style={{ color: 'var(--color-text-muted, #8C827A)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text-primary, #18181B)', fontWeight: 700 }}>Report an Issue</span>
        </div>

        <div style={{ background: 'var(--card-bg, #FFFFFF)', borderRadius: 20, border: '1px solid var(--card-border, #E8E2D8)', padding: '36px 40px', boxShadow: 'var(--card-shadow, 0 4px 20px rgba(0,0,0,0.04))' }}>
          
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-red, #E11D48)', background: 'var(--color-red-subtle, rgba(225, 29, 72, 0.08))', padding: '4px 10px', borderRadius: 6 }}>
              Support &amp; Resolution Desk
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-text-primary, #18181B)', margin: '10px 0 6px' }}>
              Report an Issue or Dispute
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #57534E)', lineHeight: 1.5, margin: 0 }}>
              Encountered a problem with a payment, study resource download, or tutor communication? Our moderation team investigates all reports within 24 hours.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>
                ✓
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary, #18181B)', marginBottom: 8 }}>
                Report Received Successfully!
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #57534E)', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Your ticket has been assigned to our resolution team. We will contact you at <strong>{formData.email}</strong> shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', issueCategory: 'PAYMENT_OR_DOWNLOAD', subject: '', description: '' });
                }}
                style={{
                  background: 'var(--color-gold, #D97706)',
                  color: '#FFF',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #18181B)', display: 'block', marginBottom: 6 }}>
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--card-border, #CBD5E1)', background: 'var(--input-bg, #FFFFFF)', color: 'var(--color-text-primary, #18181B)', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #18181B)', display: 'block', marginBottom: 6 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--card-border, #CBD5E1)', background: 'var(--input-bg, #FFFFFF)', color: 'var(--color-text-primary, #18181B)', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #18181B)', display: 'block', marginBottom: 6 }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--card-border, #CBD5E1)', background: 'var(--input-bg, #FFFFFF)', color: 'var(--color-text-primary, #18181B)', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #18181B)', display: 'block', marginBottom: 6 }}>
                    Category of Issue *
                  </label>
                  <select
                    value={formData.issueCategory}
                    onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--card-border, #CBD5E1)', fontSize: 13.5, background: 'var(--input-bg, #FFF)', color: 'var(--color-text-primary, #18181B)', boxSizing: 'border-box' }}
                  >
                    <option value="PAYMENT_OR_DOWNLOAD">💳 Payment &amp; PDF Download Issue</option>
                    <option value="TUTOR_SAFETY">🛡️ Tutor / Student Conduct or Safety</option>
                    <option value="ACCOUNT_ACCESS">👤 Account Login or Verification (KYC)</option>
                    <option value="BUG_REPORT">🐞 Platform Bug or Reader Glitch</option>
                    <option value="OTHER">📝 Other General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #18181B)', display: 'block', marginBottom: 6 }}>
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the problem"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--card-border, #CBD5E1)', background: 'var(--input-bg, #FFFFFF)', color: 'var(--color-text-primary, #18181B)', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary, #18181B)', display: 'block', marginBottom: 6 }}>
                  Detailed Description *
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Please describe what happened, including Order ID, transaction reference, or tutor profile name if applicable..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--card-border, #CBD5E1)', background: 'var(--input-bg, #FFFFFF)', color: 'var(--color-text-primary, #18181B)', fontSize: 13.5, resize: 'vertical', boxSizing: 'border-box' }}
                ></textarea>
              </div>

              <button
                type="submit"
                style={{
                  background: 'var(--color-red, #E11D48)',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 6,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)',
                }}
              >
                Submit Issue Report →
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReportIssuePage;

