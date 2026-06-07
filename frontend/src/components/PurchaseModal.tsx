'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, Upload, CheckCircle2, QrCode, Clipboard } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function PurchaseModal() {
  const { buyModalOpen, setBuyModal, user } = useAuthStore();
  const [step, setStep] = useState<'details' | 'payment' | 'completed'>('details');
  const [loading, setLoading] = useState(false);
  
  // Coin quantity / Shipping address details
  const [quantity, setQuantity] = useState(1);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Nepal');
  
  // Generated order details
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
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
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (buyModalOpen === 'coin') {
        // Step 1: Update user shipping address
        await apiFetch('/users/me', {
          method: 'POST',
          body: JSON.stringify({
            street,
            city,
            state,
            postalCode,
            country,
          }),
        });

        // Step 2: Create Coin Order
        const res = await apiFetch('/purchases/buy-coin', {
          method: 'POST',
          body: JSON.stringify({ quantity }),
        });
        setOrderId(res.transaction.orderId);
        setAmount(res.transaction.amount);
        setPaymentDetails(res.paymentDetails);
        setStep('payment');
      } else {
        // Create Token Order
        const res = await apiFetch('/purchases/buy-token', {
          method: 'POST',
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
    alert('Copied to clipboard: ' + text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0b0f0c] border border-amber-500/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col max-h-[90vh]">
        
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
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

                  {/* Shipping Form */}
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
                          <input
                            type="text"
                            required
                            placeholder="Kathmandu"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">State / Province</label>
                          <input
                            type="text"
                            required
                            placeholder="Bagmati"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Postal Code</label>
                          <input
                            type="text"
                            required
                            placeholder="44600"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Country</label>
                          <input
                            type="text"
                            required
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white text-xs focus:outline-none"
                          />
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
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gold-gradient text-amber-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                {loading ? 'Generating Invoice...' : 'Generate Invoice & Pay'}
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-5">
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

              {/* UPI Payment section */}
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border-4 border-amber-600/30">
                  <div className="w-40 h-40 bg-zinc-200 flex items-center justify-center rounded-lg shadow-inner">
                    <QrCode className="w-32 h-32 text-zinc-900" />
                  </div>
                  <span className="text-[10px] text-zinc-600 mt-2 font-bold tracking-wider uppercase">Scan with PhonePe, GPay, Paytm</span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs">
                  <h4 className="text-[#f5d06f] font-bold uppercase tracking-wider text-[10px]">Payment Details</h4>
                  
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">UPI ID:</span>
                    <span className="font-mono text-white flex items-center space-x-1">
                      <span>{paymentDetails?.upiId}</span>
                      <button onClick={() => copyToClipboard(paymentDetails?.upiId)} className="text-[#f5d06f] hover:underline cursor-pointer">
                        <Clipboard className="w-3 h-3" />
                      </button>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Bank Name:</span>
                    <span className="text-white">{paymentDetails?.bankName}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-400">Account Number:</span>
                    <span className="font-mono text-white flex items-center space-x-1">
                      <span>{paymentDetails?.accountNumber}</span>
                      <button onClick={() => copyToClipboard(paymentDetails?.accountNumber)} className="text-[#f5d06f] hover:underline cursor-pointer">
                        <Clipboard className="w-3 h-3" />
                      </button>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">IFSC Code:</span>
                    <span className="font-mono text-white flex items-center space-x-1">
                      <span>{paymentDetails?.ifsc}</span>
                      <button onClick={() => copyToClipboard(paymentDetails?.ifsc)} className="text-[#f5d06f] hover:underline cursor-pointer">
                        <Clipboard className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload transaction proof */}
              <form onSubmit={handleUploadProof} className="space-y-4 pt-2 border-t border-zinc-800">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Upload Payment Receipt</h4>
                  <p className="text-[10px] text-zinc-400 mb-3">Upload a screenshot of the completed UPI/Bank transaction</p>
                  
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
            </div>
          )}

          {step === 'completed' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              <h4 className="text-xl font-bold font-serif text-white">Proof Uploaded Successfully</h4>
              <p className="text-xs text-zinc-300 max-w-sm">
                Our verification desk is confirming your receipt. An automated notification will alert you and assign your Lucky Number within 1-2 hours.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-zinc-900 border border-amber-500/30 text-[#f5d06f] font-bold text-xs hover:bg-zinc-800 transition-colors"
              >
                Close Window
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
