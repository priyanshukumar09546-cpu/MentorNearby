// ============================================================
// components/studyResources/PrintModal.jsx
// MentorNearby — Direct Print My Notes & Doorstep Delivery Modal
// Fully Functional Ordering: Nearby Print Store, Blinkit & Zepto
// Razorpay Online Payment + Cash on Delivery + Database Order Tracking
// ============================================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { createPrintOrder, verifyPrintPayment } from '../../api/studyResources';

const PRINT_PROVIDERS = [
  {
    code: 'LOCAL_PARTNER',
    name: 'Nearby Print Store',
    service: 'Local Xerox & Binding Hubs',
    tagline: 'Doorstep Delivery in 24-36 hrs',
    icon: '🏪',
    badge: '● Direct Order Available',
    theme: {
      bg: '#EFF6FF',
      color: '#1E40AF',
      badgeBg: '#DCFCE7',
      badgeColor: '#15803D',
      iconBg: '#DBEAFE',
    },
    description: 'Crisp black & white or color spiral prints delivered directly to your study desk with tracking.',
  },
  {
    code: 'BLINKIT',
    name: 'Blinkit Print',
    service: 'Instant 10-15 Min Doorstep Delivery',
    tagline: '⚡ Delivered in 10-15 minutes',
    icon: '⚡',
    badge: '⚡ 10-Min Delivery',
    theme: {
      bg: '#FEF9C3',
      color: '#854D0E',
      badgeBg: '#FEF08A',
      badgeColor: '#854D0E',
      iconBg: '#FEF08A',
    },
    description: 'High-speed document printing with instant 10-15 minute delivery across major metro areas.',
    externalUrl: 'https://blinkit.com/prn',
  },
  {
    code: 'ZEPTO',
    name: 'Zepto Print',
    service: 'Quick Printing & Delivery',
    tagline: '🛵 Instant printing & delivery',
    icon: '🛵',
    badge: '🛵 Quick Delivery',
    theme: {
      bg: '#F5F3FF',
      color: '#6D28D9',
      badgeBg: '#EDE9FE',
      badgeColor: '#6D28D9',
      iconBg: '#EDE9FE',
    },
    description: 'Crisp color or B&W notes prints delivered directly to your doorstep in minutes via quick commerce.',
    externalUrl: 'https://www.zeptonow.com',
  },
];

const PrintModal = ({ isOpen, onClose, resourceTitle = '', resource = null }) => {
  const { user } = useAuth();

  // Navigation steps: 'SELECT_PROVIDER' | 'ORDER_FORM' | 'PROVIDER_BRIDGE' | 'CONFIRMED'
  const [step, setStep] = useState('SELECT_PROVIDER');
  const [selectedProvider, setSelectedProvider] = useState(PRINT_PROVIDERS[0]);

  // Customer Delivery Info
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    street: '',
    city: user?.city || 'Bareilly',
    state: 'Uttar Pradesh',
    pincode: '',
  });

  // Print Specifications
  const [specifications, setSpecifications] = useState({
    copies: 1,
    pageRange: 'All Pages',
    pageCount: 12, // Standard estimated chapter notes length
    colorMode: 'BW', // 'BW' | 'COLOR'
    printSides: 'DOUBLE', // 'DOUBLE' | 'SINGLE'
    binding: 'SPIRAL', // 'NONE' | 'SPIRAL' | 'SOFTCOVER'
  });

  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' | 'COD'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Sync user info when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_PROVIDER');
      setErrorMsg('');
      setPlacedOrder(null);
      if (user) {
        setCustomer((prev) => ({
          ...prev,
          name: prev.name || user.name || '',
          phone: prev.phone || user.phone || '',
          email: prev.email || user.email || '',
          city: prev.city || user.city || 'Bareilly',
        }));
      }
    }
  }, [isOpen, user]);

  // Modal Escape key and overflow locking
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time Pricing Calculation
  const calculatePricing = () => {
    const pages = Math.max(1, Number(specifications.pageCount) || 12);
    const copies = Math.max(1, Number(specifications.copies) || 1);

    let ratePerPage = 2.0;
    if (specifications.colorMode === 'COLOR') {
      ratePerPage = specifications.printSides === 'DOUBLE' ? 4.5 : 6.0;
    } else {
      ratePerPage = specifications.printSides === 'DOUBLE' ? 1.5 : 2.0;
    }

    const printCost = Math.round(pages * copies * ratePerPage);

    let bindingUnit = 0;
    if (specifications.binding === 'SPIRAL') bindingUnit = 30;
    else if (specifications.binding === 'SOFTCOVER') bindingUnit = 60;

    const bindingCost = bindingUnit * copies;
    const subtotal = printCost + bindingCost;
    const deliveryCost = subtotal >= 299 ? 0 : 40;
    const totalAmount = subtotal + deliveryCost;

    return { printCost, bindingCost, deliveryCost, totalAmount, ratePerPage };
  };

  const pricing = calculatePricing();
  const docTitle = resourceTitle || resource?.title || 'Selected Study Notes & Formula Sheets';

  // Handle Provider Selection
  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider);
    if (provider.code === 'LOCAL_PARTNER') {
      setStep('ORDER_FORM');
    } else {
      setStep('PROVIDER_BRIDGE');
    }
  };

  // Submit Order (Razorpay Online or Cash on Delivery)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!customer.name.trim()) return setErrorMsg('Please enter customer full name.');
    if (!customer.phone.trim() || customer.phone.trim().length < 10) {
      return setErrorMsg('Please enter a valid 10-digit mobile number for delivery updates.');
    }
    if (!customer.street.trim()) return setErrorMsg('Please enter your complete delivery street address.');
    if (!customer.city.trim()) return setErrorMsg('Please enter your city.');
    if (!customer.pincode.trim() || customer.pincode.trim().length < 6) {
      return setErrorMsg('Please enter a valid 6-digit postal PIN code.');
    }

    try {
      setLoading(true);

      const orderPayload = {
        customer,
        document: {
          title: docTitle,
          resourceId: resource?._id || null,
          classLevel: resource?.classLevel || '',
          subject: resource?.subject || '',
        },
        provider: {
          code: selectedProvider.code,
          name: selectedProvider.name,
        },
        specifications,
        paymentMethod,
      };

      const res = await createPrintOrder(orderPayload);
      const createdOrder = res.data?.order || res.order;
      const razorpayData = res.data?.razorpay || res.razorpay;

      // Case A: Cash on Delivery (Immediate confirmation)
      if (paymentMethod === 'COD' || !razorpayData) {
        setPlacedOrder(createdOrder);
        setStep('CONFIRMED');
        return;
      }

      // Case B: Razorpay Online Payment
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const options = {
        key: razorpayData.keyId,
        amount: Math.round(razorpayData.amount * 100),
        currency: razorpayData.currency || 'INR',
        name: 'MentorNearby',
        description: `Print Order: ${docTitle.substring(0, 30)}`,
        image: '/logo.png',
        order_id: razorpayData.orderId,
        prefill: {
          name: customer.name,
          contact: customer.phone,
          email: customer.email || '',
        },
        theme: {
          color: '#EA580C',
        },
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await verifyPrintPayment({
              orderId: createdOrder.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setPlacedOrder(verifyRes.data?.order || createdOrder);
            setStep('CONFIRMED');
          } catch (verErr) {
            console.error('Payment verification failed:', verErr);
            setErrorMsg(verErr.response?.data?.message || 'Payment signature verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setErrorMsg(`Payment Failed: ${resp.error.description || 'Transaction declined'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Order creation failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Unable to create print order. Please try again.');
    } finally {
      if (paymentMethod === 'COD') setLoading(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        margin: 0,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: step === 'ORDER_FORM' ? '580px' : '520px',
          width: '100%',
          maxHeight: '92vh',
          maxHeight: '92dvh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          margin: 'auto',
          transition: 'max-width 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* 1. MODAL HEADER                                              */}
        {/* ============================================================ */}
        <div
          style={{
            padding: '22px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            position: 'relative',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FFF7ED',
              color: '#EA580C',
              border: '1px solid #FFEDD5',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}
          >
            <span>🖨️</span>
            <span>DIRECT PRINT &amp; DOORSTEP DELIVERY</span>
          </div>

          <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', margin: '4px 0 2px' }}>
            Want a physical copy of your notes?
          </h3>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
            Get your formula sheets and notes printed and delivered directly to your doorstep.
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 18,
              right: 20,
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: 15,
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* ============================================================ */}
        {/* 2. MODAL BODY                                                */}
        {/* ============================================================ */}
        <div style={{ padding: '20px 24px' }}>
          {/* Target Document Banner */}
          {docTitle && step !== 'CONFIRMED' && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: 24 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Document
                </span>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {docTitle}
                </div>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECDD3',
                color: '#991B1B',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 1: SELECT PROVIDER                                      */}
          {/* ------------------------------------------------------------ */}
          {step === 'SELECT_PROVIDER' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  Choose Delivery Provider
                </span>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                  ✓ Live Ordering Enabled
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PRINT_PROVIDERS.map((provider) => (
                  <div
                    key={provider.code}
                    data-provider-code={provider.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectProvider(provider)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectProvider(provider); }}
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 14,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#EA580C';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 88, 12, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: provider.theme.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        {provider.icon}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 900, color: '#0F172A' }}>
                            {provider.name}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                            • {provider.service}
                          </span>
                        </div>
                        <p style={{ fontSize: 11.5, color: '#64748B', margin: '3px 0 0', lineHeight: 1.35 }}>
                          {provider.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          background: provider.theme.badgeBg,
                          color: provider.theme.badgeColor,
                          padding: '3px 8px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {provider.badge}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#EA580C' }}>
                        Order Now →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informational Footer Note */}
              <p
                style={{
                  fontSize: 11.5,
                  color: '#64748B',
                  textAlign: 'center',
                  margin: '18px 0 0',
                  lineHeight: 1.5,
                }}
              >
                All prints are created using premium 75+ GSM paper with high-resolution laser technology and sturdy binding options.
              </p>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 2: DIRECT PRINT ORDER CONFIGURATION FORM                 */}
          {/* ------------------------------------------------------------ */}
          {step === 'ORDER_FORM' && (
            <form onSubmit={handlePlaceOrder}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_PROVIDER')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  ← Change Provider
                </button>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                  🏪 Verified Local Printing Partner
                </span>
              </div>

              {/* Specifications Grid */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Printing Specifications
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* Copies */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Number of Copies
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setSpecifications((s) => ({ ...s, copies: Math.max(1, s.copies - 1) }))}
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>
                        {specifications.copies}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSpecifications((s) => ({ ...s, copies: Math.min(50, s.copies + 1) }))}
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Page Count */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Estimated Pages
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={specifications.pageCount}
                      onChange={(e) => setSpecifications({ ...specifications, pageCount: Math.max(1, Number(e.target.value) || 1) })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 12,
                        fontWeight: 700,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Color Mode & Sides */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Color Mode
                    </label>
                    <select
                      value={specifications.colorMode}
                      onChange={(e) => setSpecifications({ ...specifications, colorMode: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                    >
                      <option value="BW">Black &amp; White (₹1.50/p)</option>
                      <option value="COLOR">Full Color (₹4.50/p)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Print Sides
                    </label>
                    <select
                      value={specifications.printSides}
                      onChange={(e) => setSpecifications({ ...specifications, printSides: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                    >
                      <option value="DOUBLE">Double-Sided (Back-to-Back)</option>
                      <option value="SINGLE">Single-Sided (One-Sided)</option>
                    </select>
                  </div>
                </div>

                {/* Binding Options */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Binding Choice
                  </label>
                  <select
                    value={specifications.binding}
                    onChange={(e) => setSpecifications({ ...specifications, binding: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                  >
                    <option value="SPIRAL">Spiral Binding with Transparent Cover (+₹30)</option>
                    <option value="NONE">None / Corner Stapled (+₹0)</option>
                    <option value="SOFTCOVER">Softcover Book Binding (+₹60)</option>
                  </select>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Delivery Address &amp; Contact
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priyanshu Kumar"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      placeholder="10-digit number"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '') })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                    Street / Flat / House Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House no., Building, Area name, Landmark"
                    value={customer.street}
                    onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="6-digit PIN"
                      value={customer.pincode}
                      onChange={(e) => setCustomer({ ...customer, pincode: e.target.value.replace(/\D/g, '') })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary & Pricing Breakdown */}
              <div
                style={{
                  background: '#FFF7ED',
                  border: '1.5px solid #FED7AA',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                  <span>Printing ({specifications.pageCount} pages × {specifications.copies} copies):</span>
                  <span>₹{pricing.printCost}</span>
                </div>
                {pricing.bindingCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                    <span>{specifications.binding === 'SPIRAL' ? 'Spiral Binding' : 'Softcover Binding'}:</span>
                    <span>₹{pricing.bindingCost}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 6 }}>
                  <span>Doorstep Delivery:</span>
                  <span>{pricing.deliveryCost === 0 ? <strong style={{ color: '#059669' }}>FREE</strong> : `₹${pricing.deliveryCost}`}</span>
                </div>
                <div style={{ borderTop: '1px dashed #FDBA74', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#9A3412' }}>
                  <span>Total Amount:</span>
                  <span>₹{pricing.totalAmount}</span>
                </div>
              </div>

              {/* Payment Method Radio Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label
                    style={{
                      border: `1.5px solid ${paymentMethod === 'ONLINE' ? '#EA580C' : '#E2E8F0'}`,
                      background: paymentMethod === 'ONLINE' ? '#FFF7ED' : '#FFFFFF',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === 'ONLINE'}
                      onChange={() => setPaymentMethod('ONLINE')}
                    />
                    <span>💳 Online (Razorpay)</span>
                  </label>

                  <label
                    style={{
                      border: `1.5px solid ${paymentMethod === 'COD' ? '#EA580C' : '#E2E8F0'}`,
                      background: paymentMethod === 'COD' ? '#FFF7ED' : '#FFFFFF',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <span>💵 Cash on Delivery</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_PROVIDER')}
                  style={{
                    flex: 1,
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    background: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  }}
                >
                  {loading
                    ? 'Processing Order...'
                    : paymentMethod === 'ONLINE'
                    ? `Pay ₹${pricing.totalAmount} & Place Order →`
                    : `Place Order (Pay on Delivery) →`}
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 3: BLINKIT / ZEPTO DIRECT ACCESS BRIDGE                 */}
          {/* ------------------------------------------------------------ */}
          {step === 'PROVIDER_BRIDGE' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: selectedProvider.theme.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 12px',
                }}
              >
                {selectedProvider.icon}
              </div>

              <h4 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
                Order via {selectedProvider.name}
              </h4>
              <p style={{ fontSize: 13, color: '#64748B', maxWidth: 420, margin: '0 auto 18px', lineHeight: 1.5 }}>
                {selectedProvider.description} You can open the official {selectedProvider.name} service to upload your notes and get them delivered in 10-15 minutes.
              </p>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 20,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Fast Order Steps:
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#334155', lineHeight: 1.6 }}>
                  <li>Click <strong>Open {selectedProvider.name}</strong> below.</li>
                  <li>Upload your downloaded PDF from MentorNearby.</li>
                  <li>Enter your address for 10-15 min doorstep delivery.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_PROVIDER')}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <a
                  href={selectedProvider.externalUrl || 'https://blinkit.com/prn'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: 13.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  }}
                >
                  <span>Open {selectedProvider.name} ↗</span>
                </a>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 4: ORDER CONFIRMED SCREEN                               */}
          {/* ------------------------------------------------------------ */}
          {step === 'CONFIRMED' && placedOrder && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  border: '2px solid #10B981',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 12px',
                }}
              >
                ✓
              </div>

              <div
                style={{
                  display: 'inline-block',
                  background: '#DCFCE7',
                  color: '#15803D',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 20,
                  marginBottom: 8,
                }}
              >
                ● ORDER PLACED SUCCESSFULLY
              </div>

              <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>
                Your Print Order is Confirmed!
              </h4>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 16px' }}>
                Our printing partner has received your order and started document preparation.
              </p>

              {/* Order Meta Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 18,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Order ID:</span>
                  <strong style={{ fontSize: 12.5, color: '#0F172A' }}>{placedOrder.orderId}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Total Amount:</span>
                  <strong style={{ fontSize: 12.5, color: '#EA580C' }}>₹{placedOrder.totalAmount || placedOrder.pricing?.totalAmount}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Payment Status:</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
                    {placedOrder.paymentStatus || placedOrder.payment?.status || 'VERIFIED'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Delivery Address:</span>
                  <span style={{ fontSize: 11.5, color: '#0F172A', textAlign: 'right', maxWidth: 220 }}>
                    {customer.street}, {customer.city} ({customer.pincode})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a
                  href="/student/purchases"
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  View in My Orders
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (for Step 1) */}
        {step === 'SELECT_PROVIDER' && (
          <div
            style={{
              padding: '14px 24px',
              background: '#F8FAFC',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PrintModal;
