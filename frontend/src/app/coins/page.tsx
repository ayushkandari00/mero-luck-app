'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ShoppingCart, CheckCircle, Clock, ChevronLeft, ChevronRight, QrCode, Upload, Clipboard, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

type Coin = {
  id: string;
  coinNumber: string;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  user?: { email: string; profile: { firstName: string; lastName: string } };
};

type PaymentGateway = 'esewa';

type PaymentDetails = {
  gateway?: string;
  merchantId?: string;
  productCode?: string;
  signature?: string;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  transactionUuid?: string;
  successUrl?: string;
  failureUrl?: string;
  url?: string;
  instructions?: string;
  testMode?: boolean;
};

const GATEWAYS: { id: PaymentGateway; label: string; color: string; bg: string; border: string; textColor: string; desc: string }[] = [
  {
    id: 'esewa',
    label: 'eSewa',
    color: 'from-green-600 to-green-700',
    bg: 'bg-green-950/30',
    border: 'border-green-500/40',
    textColor: 'text-green-400',
    desc: "Nepal's #1 digital wallet — instant & secure",
  },
];

export default function NumberedCoinsMarketplace() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'SOLD' | 'RESERVED'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  // Multi-step purchase state for numbered coin
  type PurchaseStep = 'gateway' | 'payment' | 'completed';
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('gateway');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any>(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  // Receipt upload state (for non-eSewa gateways - unused now)
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '100',
      });
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const res = await apiFetch(`/numbered-coins?${queryParams.toString()}`);
      setCoins(res.coins);
      setTotalPages(res.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch coins', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const handleOpenModal = (coin: Coin) => {
    setSelectedCoin(coin);
    setPurchaseStep('gateway');
    setSelectedGateway(null);
    setPurchaseSuccess(null);
    setPurchaseError('');
  };

  const handleCloseModal = () => {
    setSelectedCoin(null);
    setPurchaseStep('gateway');
    setSelectedGateway(null);
    setPurchaseSuccess(null);
    setPurchaseError('');
  };

  const handleConfirmGateway = async () => {
    if (!selectedCoin || !selectedGateway) return;
    setPurchaseLoading(true);
    setPurchaseError('');
    try {
      const res = await apiFetch('/numbered-coins/purchase', {
        method: 'POST',
        body: JSON.stringify({ coinNumber: selectedCoin.coinNumber, paymentMethod: selectedGateway }),
      });
      setPurchaseSuccess(res);
      setPaymentDetails(res.paymentDetails || null);
      setCoins((prev) => prev.map((c) => (c.id === selectedCoin.id ? { ...c, status: 'RESERVED' } : c)));
      setPurchaseStep('payment');
    } catch (error: any) {
      setPurchaseError(error.message || 'Failed to reserve coin');
    } finally {
      setPurchaseLoading(false);
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const activeGateway = GATEWAYS.find((g) => g.id === selectedGateway);

  return (
    <div className="bg-[#0b0f0c] min-h-screen text-white pb-20 border-b border-amber-500/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,138,71,0.15)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 relative">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold font-serif text-gold-gradient">
            Premium Numbered Coins
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Browse and secure your unique 6-digit lucky coin. Fixed supply of 100,000 exclusively minted coins.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-amber-500/20 p-4 rounded-xl">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search exact number (e.g. 000157)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'] as const).map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {loading && coins.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500">Loading premium collection...</div>
          ) : coins.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500">No coins found matching your criteria.</div>
          ) : (
            coins.map((coin) => (
              <motion.div
                key={coin.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => coin.status === 'AVAILABLE' && handleOpenModal(coin)}
                className={`
                  relative aspect-square rounded-full flex flex-col items-center justify-center border-2 transition-all cursor-pointer group
                  ${coin.status === 'AVAILABLE' ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-700/10 hover:shadow-[0_0_20px_rgba(245,208,111,0.3)] hover:scale-105' : ''}
                  ${coin.status === 'SOLD' ? 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed grayscale' : ''}
                  ${coin.status === 'RESERVED' ? 'border-blue-500/30 bg-blue-900/10 cursor-not-allowed' : ''}
                `}
              >
                <div className={`text-lg font-mono font-black tracking-widest ${
                  coin.status === 'AVAILABLE' ? 'text-amber-400' : 'text-zinc-500'
                }`}>
                  {coin.coinNumber}
                </div>

                {coin.status === 'SOLD' && (
                  <div className="absolute -bottom-2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> SOLD
                  </div>
                )}
                {coin.status === 'RESERVED' && (
                  <div className="absolute -bottom-2 bg-blue-900/50 border border-blue-500/50 text-blue-300 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> RESERVED
                  </div>
                )}
                {coin.status === 'AVAILABLE' && (
                  <div className="absolute -bottom-2 bg-green-500/20 border border-green-500/50 text-green-400 text-[9px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    BUY NOW
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 bg-zinc-900 rounded-lg disabled:opacity-50 hover:bg-zinc-800 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-zinc-400 text-sm">Page {page} of {totalPages.toLocaleString()}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 bg-zinc-900 rounded-lg disabled:opacity-50 hover:bg-zinc-800 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── PURCHASE MODAL (multi-step) ─── */}
      <AnimatePresence>
        {selectedCoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-amber-500/30 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(212,175,55,0.1)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-serif text-gold-gradient font-bold">Secure Your Coin</h3>
                  <p className="text-[11px] text-zinc-400">Coin #{selectedCoin.coinNumber}</p>
                </div>
                <button onClick={handleCloseModal} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Coin preview */}
              <div className="flex justify-center pt-5 pb-3 flex-shrink-0">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,208,111,0.2)]">
                  <span className="text-lg font-mono font-black text-amber-400">{selectedCoin.coinNumber}</span>
                </div>
              </div>

              {/* Price tag */}
              <div className="text-center pb-4 flex-shrink-0">
                <span className="text-sm text-zinc-400">Price: </span>
                <span className="text-green-400 font-mono text-lg font-bold">₹1,000</span>
              </div>

              {/* Error */}
              {purchaseError && (
                <div className="mx-6 mb-4 bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-xs flex-shrink-0">
                  {purchaseError}
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

                {/* ── GATEWAY SELECTION ── */}
                {purchaseStep === 'gateway' && (
                  <motion.div
                    key="gw-select"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Choose Payment Method</h4>
                      <p className="text-[11px] text-zinc-400">Select how you want to pay for this coin</p>
                    </div>

                    <div className="space-y-3">
                      {GATEWAYS.map((gw) => (
                        <button
                          key={gw.id}
                          onClick={() => setSelectedGateway(gw.id)}
                          className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                            selectedGateway === gw.id
                              ? `${gw.bg} ${gw.border}`
                              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gw.color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-black">
                              {gw.id === 'esewa' ? 'e' : gw.id === 'khalti' ? 'K' : gw.id === 'phonepay' ? 'Ph' : 'F'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm ${selectedGateway === gw.id ? gw.textColor : 'text-white'}`}>{gw.label}</div>
                            <div className="text-[10px] text-zinc-400">{gw.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedGateway === gw.id ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                          }`}>
                            {selectedGateway === gw.id && <div className="w-2 h-2 rounded-full bg-black" />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium transition text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!selectedGateway || purchaseLoading}
                        onClick={handleConfirmGateway}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition text-sm flex justify-center items-center gap-2 disabled:opacity-40"
                      >
                        {purchaseLoading ? 'Reserving...' : (
                          <><ShoppingCart className="w-4 h-4" /> Reserve & Pay</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── PAYMENT (QR + Upload) ── */}
                {purchaseStep === 'payment' && purchaseSuccess && (
                  <motion.div
                    key="gw-payment"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {/* Order info */}
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between text-xs">
                      <div>
                        <p className="text-zinc-400">Order ID</p>
                        <p className="text-white font-bold">{purchaseSuccess.transaction.orderId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-400">Amount</p>
                        <p className="text-[#f5d06f] font-black text-sm">₹{purchaseSuccess.transaction.amount}</p>
                      </div>
                    </div>

                    {/* Gateway badge */}
                    {activeGateway && (
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${activeGateway.bg} border ${activeGateway.border}`}>
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeGateway.color} flex items-center justify-center`}>
                          <span className="text-white text-[10px] font-black">
                            {activeGateway.id === 'esewa' ? 'e' : activeGateway.id === 'khalti' ? 'K' : activeGateway.id === 'phonepay' ? 'Ph' : 'F'}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${activeGateway.textColor}`}>{activeGateway.label} Payment Selected</p>
                      </div>
                    )}

                    {/* eSewa Merchant QR */}
                    <div className="flex flex-col items-center p-4 bg-white rounded-2xl border-2 border-green-500/20">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`esewa://pay?merchantId=${paymentDetails?.merchantId || 'EPAYTEST'}&amount=${purchaseSuccess.transaction.amount}&ref=${purchaseSuccess.transaction.orderId}`)}`}
                        alt="eSewa Merchant QR"
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                      <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase tracking-wider">
                        Scan with eSewa App → Merchant Payment
                      </p>
                      <p className="text-[9px] text-zinc-400">Pay exactly: <span className="font-bold text-zinc-600">₹{purchaseSuccess.transaction.amount}</span></p>
                    </div>

                    {/* eSewa Payment Details */}
                    <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl space-y-2 text-xs">
                      <p className="text-[#f5d06f] text-[10px] font-bold uppercase tracking-wider">Payment Details</p>
                      {[
                        { label: 'Merchant ID', value: paymentDetails?.merchantId },
                        { label: 'Reference No.', value: purchaseSuccess?.transaction?.orderId },
                      ].map(({ label, value }) => value && (
                        <div key={label} className="flex justify-between items-center border-b border-zinc-800 pb-1.5 last:border-0">
                          <span className="text-zinc-400">{label}:</span>
                          <span className="font-mono text-white flex items-center gap-1.5">
                            {value}
                            <button onClick={() => copyToClipboard(value)} className="text-zinc-500 hover:text-[#f5d06f]">
                              <Clipboard className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                      ))}
                      {paymentDetails?.testMode && (
                        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2 text-[10px] text-green-300">
                          🧪 Sandbox — Login: 9806800001, Password: Nepal@123, MPIN: 1122
                        </div>
                      )}
                    </div>

                    {paymentDetails?.instructions && (
                      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] text-zinc-300">
                        <p className="font-bold text-zinc-100">Payment Instructions</p>
                        <p className="mt-2 leading-5">{paymentDetails.instructions}</p>
                      </div>
                    )}

                    {/* Action Form */}
                    {paymentDetails?.gateway === 'esewa' ? (
                      <form action={paymentDetails.url} method="POST" className="space-y-3 pt-4 border-t border-zinc-800">
                        <input type="hidden" name="amount" value={paymentDetails.amount} />
                        <input type="hidden" name="tax_amount" value={paymentDetails.taxAmount} />
                        <input type="hidden" name="total_amount" value={paymentDetails.totalAmount} />
                        <input type="hidden" name="transaction_uuid" value={paymentDetails.transactionUuid} />
                        <input type="hidden" name="product_code" value={paymentDetails.productCode} />
                        <input type="hidden" name="product_service_charge" value="0" />
                        <input type="hidden" name="product_delivery_charge" value="0" />
                        <input type="hidden" name="success_url" value={paymentDetails.successUrl} />
                        <input type="hidden" name="failure_url" value={paymentDetails.failureUrl} />
                        <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
                        <input type="hidden" name="signature" value={paymentDetails.signature} />
                        
                        <button
                          type="submit"
                          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2"
                        >
                          Proceed to eSewa Web Gateway <ChevronRight className="w-4 h-4" />
                        </button>
                        <p className="text-center text-[10px] text-zinc-500 mt-2">
                          If you paid via Merchant QR, you can close this window. Your payment will be verified manually.
                        </p>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* ── COMPLETED ── */}
                {purchaseStep === 'completed' && (
                  <motion.div
                    key="gw-done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">Proof Uploaded!</h3>
                    <p className="text-zinc-400 text-sm">
                      Your coin is reserved. Our team will verify your payment within 1–2 hours and confirm your purchase.
                    </p>
                    {activeGateway && (
                      <div className={`inline-block px-4 py-1.5 rounded-lg ${activeGateway.bg} border ${activeGateway.border} text-[11px] ${activeGateway.textColor} font-bold`}>
                        Paid via {activeGateway.label} — Pending Verification
                      </div>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="w-full py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl font-bold transition"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
