'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, Upload, CheckCircle2, Clipboard, ChevronRight, QrCode } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

type PaymentGateway = 'esewa' | 'khalti' | 'phonepay' | 'fonepay';

type PaymentDetails = {
  gateway?: string;
  merchantId?: string;
  serviceType?: string;
  referenceNo?: string;
  instructions?: string;
  testMode?: boolean;
  upiId?: string;
  accountHolder?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
};

const GATEWAYS: { id: PaymentGateway; label: string; color: string; bg: string; border: string; textColor: string; logo: string; desc: string }[] = [
  {
    id: 'esewa',
    label: 'eSewa',
    color: 'from-green-600 to-green-700',
    bg: 'bg-green-950/30',
    border: 'border-green-500/40',
    textColor: 'text-green-400',
    logo: '🟢',
    desc: 'Nepal\'s #1 digital wallet',
  },
  {
    id: 'khalti',
    label: 'Khalti',
    color: 'from-purple-600 to-purple-800',
    bg: 'bg-purple-950/30',
    border: 'border-purple-500/40',
    textColor: 'text-purple-400',
    logo: '🟣',
    desc: 'Fast & secure payments',
  },
  {
    id: 'phonepay',
    label: 'PhonePay',
    color: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-950/30',
    border: 'border-blue-500/40',
    textColor: 'text-blue-400',
    logo: '🔵',
    desc: 'India\'s trusted UPI app',
  },
  {
    id: 'fonepay',
    label: 'Fonepay',
    color: 'from-red-600 to-red-700',
    bg: 'bg-red-950/30',
    border: 'border-red-500/40',
    textColor: 'text-red-400',
    logo: '🔴',
    desc: 'Nepal\'s instant bank transfer & QR',
  },
];

// QR code placeholder per gateway - swap with real images when available
const QR_IMAGES: Record<PaymentGateway, string | null> = {
  esewa: null,   // Replace with actual QR image path e.g. '/qr/esewa.png'
  khalti: null,  // Replace with actual QR image path e.g. '/qr/khalti.png'
  phonepay: null, // Replace with actual QR image path e.g. '/qr/phonepay.png'
  fonepay: null,
};

export default function PurchaseModal() {
  const { buyModalOpen, setBuyModal } = useAuthStore();
  const [step, setStep] = useState<'details' | 'gateway' | 'payment' | 'completed'>('details');
  const [loading, setLoading] = useState(false);

  // Coin quantity / Shipping address details
  const [quantity, setQuantity] = useState(1);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Nepal');

  // Payment gateway
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);

  // Generated order details
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected payment proof file
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  if (!buyModalOpen) return null;

  const handleClose = () => {
    setBuyModal(null);
    setStep('details');
    setQuantity(1);
    setReceiptFile(null);
    setUploadedFileName('');
    setErrorMsg('');
    setSelectedGateway(null);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) {
      setErrorMsg('Please select a payment gateway.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      if (buyModalOpen === 'coin') {
        await apiFetch('/users/me', {
          method: 'POST',
          body: JSON.stringify({ street, city, state, postalCode, country }),
        });
        const res = await apiFetch('/purchases/buy-coin', {
          method: 'POST',
          body: JSON.stringify({ quantity, paymentMethod: selectedGateway }),
        });
        setOrderId(res.transaction.orderId);
        setAmount(res.transaction.amount);
        setPaymentDetails(res.paymentDetails);
        setStep('payment');
      } else {
        const res = await apiFetch('/purchases/buy-token', {
          method: 'POST',
          body: JSON.stringify({ paymentMethod: selectedGateway }),
        });
        setOrderId(res.transaction.orderId);
        setAmount(res.transaction.amount);
        setPaymentDetails(res.paymentDetails);
        setStep('payment');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setErrorMsg('Please select a payment receipt screenshot.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    try {
      await apiFetch(`/purchases/upload-proof/${orderId}`, {
        method: 'POST',
        body: formData,
      });
      setStep('completed');
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const activeGateway = GATEWAYS.find((g) => g.id === selectedGateway);

  const stepConfig = [
    { id: 'details', label: 'Details' },
    { id: 'gateway', label: 'Payment' },
    { id: 'payment', label: 'Pay & Confirm' },
    { id: 'completed', label: 'Done' },
  ];
  const currentStepIndex = stepConfig.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0b0f0c] border border-amber-500/20 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.12)] flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/10 bg-zinc-950">
          <div>
            <h3 className="text-lg font-bold text-gold-gradient font-serif">
              Purchase {buyModalOpen === 'coin' ? 'Physical Lucky Coin' : 'Digital Lucky Token'}
            </h3>
            <p className="text-[11px] text-zinc-400">Secure entry checkout</p>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 gap-2">
          {stepConfig.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  idx < currentStepIndex ? 'bg-green-500 text-black' :
                  idx === currentStepIndex ? 'bg-amber-500 text-black' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {idx < currentStepIndex ? '✓' : idx + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${idx === currentStepIndex ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {s.label}
                </span>
              </div>
              {idx < stepConfig.length - 1 && (
                <div className={`flex-1 h-px ${idx < currentStepIndex ? 'bg-green-500/50' : 'bg-zinc-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {/* ─── STEP: DETAILS ─── */}
          <AnimatePresence mode="wait">
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {buyModalOpen === 'coin' ? (
                  <>
                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider">Premium Physical Coin Package</h4>
                      <p className="text-xs text-zinc-300">
                        Each coin is engraved with a unique, verified 6-digit lucky number and shipped with custom collector boxing.
                        Cost: <span className="text-amber-400 font-bold">₹2,500</span> per coin.
                      </p>
                      <div className="flex items-center space-x-3 pt-2">
                        <label className="text-xs text-zinc-400">Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs w-16 text-center font-bold"
                        />
                        <span className="text-xs text-[#f5d06f] font-bold">Total: ₹{quantity * 2500}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[#f5d06f] font-serif text-sm">Delivery Address</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Street Address</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 12 Lalitpur Marg"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">City</label>
                            <input type="text" required placeholder="Kathmandu" value={city} onChange={(e) => setCity(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">State / Province</label>
                            <input type="text" required placeholder="Bagmati" value={state} onChange={(e) => setState(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">Postal Code</label>
                            <input type="text" required placeholder="44600" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">Country</label>
                            <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-green-950/20 border border-green-500/20 p-5 rounded-xl space-y-3">
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Digital Lucky Token Entry</h4>
                    <p className="text-xs text-zinc-300">
                      A budget-friendly choice. You get a unique digital lucky number immediately generated in your profile.
                      Cost: <span className="text-[#f5d06f] font-bold">₹250</span>.
                    </p>
                    <div className="text-xs text-[#f5d06f] font-bold pt-2 border-t border-zinc-800">
                      Total Amount Due: ₹250
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (buyModalOpen === 'coin' && (!street || !city || !state || !postalCode)) {
                      setErrorMsg('Please fill in all delivery address fields.');
                      return;
                    }
                    setErrorMsg('');
                    setStep('gateway');
                  }}
                  className="w-full py-2.5 rounded-lg bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ─── STEP: GATEWAY SELECTION ─── */}
            {step === 'gateway' && (
              <motion.div
                key="gateway"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">Choose Payment Method</h4>
                  <p className="text-[11px] text-zinc-400">Select your preferred payment gateway to receive a QR code</p>
                </div>

                <div className="space-y-3">
                  {GATEWAYS.map((gw) => (
                    <button
                      key={gw.id}
                      onClick={() => setSelectedGateway(gw.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 group ${
                        selectedGateway === gw.id
                          ? `${gw.bg} ${gw.border} shadow-[0_0_20px_rgba(0,0,0,0.4)]`
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {/* Gateway Logo / Icon Area */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gw.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                        {gw.id === 'esewa' && (
                          <span className="font-black text-white text-xs tracking-tight">e</span>
                        )}
                        {gw.id === 'khalti' && (
                          <span className="font-black text-white text-xs tracking-tight">K</span>
                        )}
                        {gw.id === 'phonepay' && (
                          <span className="font-black text-white text-xs tracking-tight">Ph</span>
                        )}
                        {gw.id === 'fonepay' && (
                          <span className="font-black text-white text-xs tracking-tight">F</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm ${selectedGateway === gw.id ? gw.textColor : 'text-white'}`}>
                          {gw.label}
                        </div>
                        <div className="text-[11px] text-zinc-400">{gw.desc}</div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedGateway === gw.id ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                      }`}>
                        {selectedGateway === gw.id && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition"
                  >
                    Back
                  </button>
                  <button
                    disabled={!selectedGateway || loading}
                    onClick={handleCreateOrder as any}
                    className="flex-1 py-2.5 rounded-lg bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Generating...' : <>Confirm & Get QR <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP: PAYMENT (QR + Upload) ─── */}
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Order Summary */}
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="text-zinc-400">Order ID:</p>
                    <p className="font-bold text-white tracking-wider">{orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400">Total Amount:</p>
                    <p className="font-black text-[#f5d06f] text-sm">₹{amount}</p>
                  </div>
                </div>

                {/* Gateway Badge */}
                {activeGateway && (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${activeGateway.bg} border ${activeGateway.border}`}>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeGateway.color} flex items-center justify-center`}>
                      <span className="text-white text-[10px] font-black">
                        {activeGateway.id === 'esewa' ? 'e' : activeGateway.id === 'khalti' ? 'K' : activeGateway.id === 'phonepay' ? 'Ph' : 'F'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${activeGateway.textColor}`}>{activeGateway.label} Payment</p>
                      <p className="text-[10px] text-zinc-500">Scan QR or use the details below</p>
                    </div>
                  </div>
                )}

                {/* QR Code Display */}
                <div className="flex flex-col items-center p-5 bg-white rounded-2xl border-4 border-amber-600/20 shadow-inner">
                  {activeGateway && QR_IMAGES[activeGateway.id] ? (
                    <img
                      src={QR_IMAGES[activeGateway.id]!}
                      alt={`${activeGateway.label} QR Code`}
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-zinc-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 gap-2">
                      <QrCode className="w-16 h-16 text-zinc-400" />
                      <div className="text-center">
                        <p className="text-zinc-600 text-[11px] font-bold">QR Code</p>
                        <p className="text-zinc-400 text-[9px]">Coming soon</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 text-center">
                    <span className="text-[10px] text-zinc-600 font-bold tracking-wider uppercase">
                      Scan with {activeGateway?.label || 'your payment app'}
                    </span>
                    <p className="text-[9px] text-zinc-400 mt-0.5">Make sure to enter exact amount: <span className="font-bold text-zinc-700">₹{amount}</span></p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs">
                  <h4 className="text-[#f5d06f] font-bold uppercase tracking-wider text-[10px]">Payment Details</h4>

                  {paymentDetails?.gateway === 'esewa' ? (
                    <>
                      {[
                        { label: 'Merchant ID', value: paymentDetails.merchantId },
                        { label: 'Service Type', value: paymentDetails.serviceType },
                        { label: 'Reference No.', value: paymentDetails.referenceNo },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between border-b border-zinc-800 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-zinc-400">{label}:</span>
                          <span className="font-mono text-white flex items-center gap-1.5">
                            <span>{value}</span>
                            {value && (
                              <button onClick={() => copyToClipboard(value)} className="text-zinc-500 hover:text-[#f5d06f] transition-colors" title="Copy">
                                <Clipboard className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        </div>
                      ))}
                      {paymentDetails.testMode && (
                        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2 text-[10px] text-green-300">
                          eSewa test mode is active. Use the above merchant details to simulate payment, then upload the receipt screenshot.
                        </div>
                      )}
                    </>
                  ) : (
                    [
                      { label: 'Account Holder', value: paymentDetails?.accountHolder },
                      { label: 'Bank Name', value: paymentDetails?.bankName },
                      { label: 'Account Number', value: paymentDetails?.accountNumber },
                      { label: 'IFSC Code', value: paymentDetails?.ifsc },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between border-b border-zinc-800 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-zinc-400">{label}:</span>
                        <span className="font-mono text-white flex items-center gap-1.5">
                          <span>{value}</span>
                          {value && (
                            <button onClick={() => copyToClipboard(value)} className="text-zinc-500 hover:text-[#f5d06f] transition-colors" title="Copy">
                              <Clipboard className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {paymentDetails?.instructions && (
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] text-zinc-300">
                    <p className="font-bold text-zinc-100">Payment Instructions</p>
                    <p className="mt-2 leading-5">{paymentDetails.instructions}</p>
                  </div>
                )}

                {/* Upload Proof */}
                <form onSubmit={handleUploadProof} className="space-y-4 pt-2 border-t border-zinc-800">
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Upload Payment Receipt</h4>
                    <p className="text-[10px] text-zinc-400 mb-3">Upload a screenshot of the completed payment transaction</p>

                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-[#d4af37] bg-zinc-950 p-4 rounded-xl cursor-pointer transition-colors group">
                      <Upload className="w-6 h-6 text-zinc-500 group-hover:text-[#f5d06f] mb-2" />
                      <span className="text-xs text-zinc-400 group-hover:text-white">
                        {uploadedFileName ? uploadedFileName : 'Select receipt screenshot'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReceiptFile(e.target.files[0]);
                            setUploadedFileName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !receiptFile}
                    className="w-full py-2.5 rounded-lg bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {loading ? 'Uploading Receipt...' : 'Submit Payment Proof'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP: COMPLETED ─── */}
            {step === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </motion.div>
                <h4 className="text-xl font-bold font-serif text-white">Proof Uploaded Successfully!</h4>
                <p className="text-xs text-zinc-300 max-w-sm">
                  Our verification desk is confirming your receipt. An automated notification will alert you and assign your Lucky Number within 1–2 hours.
                </p>
                {activeGateway && (
                  <div className={`px-4 py-2 rounded-lg ${activeGateway.bg} border ${activeGateway.border} text-[11px] ${activeGateway.textColor} font-bold`}>
                    Payment via {activeGateway.label} — Pending Verification
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-lg bg-zinc-900 border border-amber-500/30 text-[#f5d06f] font-bold text-xs hover:bg-zinc-800 transition-colors"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
