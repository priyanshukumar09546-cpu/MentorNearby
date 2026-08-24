import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';

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
    <div className="mn-contact-root">
      <div className="mn-contact-container">
        
        {/* Header Hero */}
        <div className="mn-contact-hero">
          <div className="mn-contact-badge">
            <span>🎧</span>
            <span>GET IN TOUCH</span>
          </div>
          <h1 className="mn-contact-title">
            Contact MentorNearby Support
          </h1>
          <p className="mn-contact-sub">
            Have a question about finding nearby mentors, study resources, or tutor onboarding? We are here to help.
          </p>
        </div>

        <div className="mn-contact-layout">
          
          {/* Left: Contact Channels Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div className="mn-contact-channels-card">
              <h3 className="mn-contact-card-title">
                Contact Channels
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="mn-contact-channel-item">
                  <div className="mn-contact-icon-box blue">
                    ✉️
                  </div>
                  <div>
                    <div className="mn-contact-channel-label">Email Inquiries</div>
                    <a href="mailto:support@mentornearby.in" className="mn-contact-channel-link">
                      support@mentornearby.in
                    </a>
                  </div>
                </div>

                <div className="mn-contact-channel-item">
                  <div className="mn-contact-icon-box green">
                    💬
                  </div>
                  <div>
                    <div className="mn-contact-channel-label">WhatsApp Channel</div>
                    <a href="https://whatsapp.com/channel/0029Vb8bXCGHVvTgBlJSB43y" target="_blank" rel="noopener noreferrer" className="mn-contact-channel-link" style={{ color: 'var(--color-success, #059669)' }}>
                      Official WhatsApp Channel ↗
                    </a>
                  </div>
                </div>

                <div className="mn-contact-channel-item">
                  <div className="mn-contact-icon-box purple">
                    ✈️
                  </div>
                  <div>
                    <div className="mn-contact-channel-label">Telegram Community</div>
                    <a href="https://t.me/MentorNearbyOfficial" target="_blank" rel="noopener noreferrer" className="mn-contact-channel-link" style={{ color: '#229ED9' }}>
                      @MentorNearbyOfficial ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="mn-contact-quick-card">
              <h4 className="mn-contact-quick-title">
                Need Quick Answers?
              </h4>
              <p className="mn-contact-quick-desc">
                Check our Frequently Asked Questions or submit an urgent dispute report.
              </p>
              <div className="mn-contact-quick-btns">
                <Link to="/faqs" className="mn-contact-btn-outline">
                  Browse FAQs →
                </Link>
                <Link to="/report-issue" className="mn-contact-btn-filled">
                  Report Issue →
                </Link>
              </div>
            </div>

          </div>

          {/* Right: Message Form */}
          <div className="mn-contact-form-card">
            <h2 className="mn-contact-form-title">
              Send Us a Direct Message
            </h2>
            <p className="mn-contact-form-sub">
              Fill in your contact info and query below. Our team replies within 1 business day.
            </p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary, #0F172A)', marginBottom: 8 }}>
                  Thank You for Reaching Out!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #475569)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  We have received your message and will respond to <strong>{form.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                  className="mn-contact-submit-btn"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="mn-contact-label">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mn-contact-input"
                    />
                  </div>
                  <div>
                    <label className="mn-contact-label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mn-contact-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="mn-contact-label">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mn-contact-input"
                    />
                  </div>
                  <div>
                    <label className="mn-contact-label">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="mn-contact-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="mn-contact-label">
                    Your Message *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Write your question, feedback, or inquiry in detail..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mn-contact-textarea"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="mn-contact-submit-btn"
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

