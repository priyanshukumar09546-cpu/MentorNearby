import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF1F2', color: '#E11D48', padding: '6px 14px', borderRadius: 9999, fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
            <span>🎧</span>
            <span>GET IN TOUCH</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', margin: '0 0 12px' }}>
            Contact MentorNearby Support
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Have a question about finding nearby mentors, study resources, or tutor onboarding? We are here to help.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 36, alignItems: 'flex-start' }}>
          
          {/* Left: Contact Channels Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 18px' }}>
                Contact Channels
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    ✉️
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Email Inquiries</div>
                    <a href="mailto:support@mentornearby.in" style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', textDecoration: 'none' }}>
                      support@mentornearby.in
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    💬
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>WhatsApp Channel</div>
                    <a href="https://whatsapp.com/channel/0029Vb8bXCGHVvTgBlJSB43y" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14.5, fontWeight: 700, color: '#059669', textDecoration: 'none' }}>
                      Official WhatsApp Channel ↗
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FAF5FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    ✈️
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Telegram Community</div>
                    <a href="https://t.me/MentorNearbyOfficial" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14.5, fontWeight: 700, color: '#229ED9', textDecoration: 'none' }}>
                      @MentorNearbyOfficial ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div style={{ background: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: 18, padding: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#9F1239', margin: '0 0 8px' }}>
                Need Quick Answers?
              </h4>
              <p style={{ fontSize: 13, color: '#BE123C', lineHeight: 1.5, margin: '0 0 14px' }}>
                Check our Frequently Asked Questions or submit an urgent dispute report.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/faqs" style={{ background: '#FFFFFF', color: '#9F1239', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, textDecoration: 'none', border: '1px solid #FDA4AF' }}>
                  Browse FAQs →
                </Link>
                <Link to="/report-issue" style={{ background: '#E11D48', color: '#FFFFFF', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                  Report Issue →
                </Link>
              </div>
            </div>

          </div>

          {/* Right: Message Form */}
          <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: '36px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
              Send Us a Direct Message
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 24 }}>
              Fill in your contact info and query below. Our team replies within 1 business day.
            </p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #10B981', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  Thank You for Reaching Out!
                </h3>
                <p style={{ fontSize: 14, color: '#475569', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  We have received your message and will respond to <strong>{form.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                  style={{
                    background: '#0F172A',
                    color: '#FFF',
                    padding: '9px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                    Your Message *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Write your question, feedback, or inquiry in detail..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5, resize: 'vertical' }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 6,
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                  }}
                >
                  Send Message →
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
