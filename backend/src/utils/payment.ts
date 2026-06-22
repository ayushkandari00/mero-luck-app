export const VALID_PAYMENT_METHODS = ['esewa', 'khalti', 'phonepay', 'fonepay'] as const;

export type PaymentMethod = typeof VALID_PAYMENT_METHODS[number] | null;

export function getPaymentDetails(paymentMethod: PaymentMethod, orderId: string) {
  if (paymentMethod === 'esewa') {
    return {
      gateway: 'esewa',
      merchantId: process.env.ESEWA_TEST_MERCHANT_ID || 'meroluck-test@esewa',
      serviceType: process.env.ESEWA_SERVICE_TYPE || 'EPAYMENT',
      referenceNo: orderId,
      amountKey: 'amt',
      instructions:
        'Open the eSewa app, choose Merchant Payment, then enter Merchant ID, service type, exact amount, and order reference. Finally upload the receipt screenshot.',
      testMode: process.env.NODE_ENV !== 'production',
    };
  }

  return {
    gateway: paymentMethod || 'bank',
    upiId: process.env.PAYMENT_UPI_ID || 'meroluck@bank',
    accountHolder: 'Mero Luck Collectibles Pvt Ltd',
    bankName: 'Nepal Investment Mega Bank',
    accountNumber: '00100200300405',
    ifsc: 'NIMB0000001',
    instructions:
      paymentMethod === 'khalti' || paymentMethod === 'phonepay' || paymentMethod === 'fonepay'
        ? 'Use the selected app or UPI to pay the exact amount, then upload a screenshot of the completed transaction.'
        : 'Use the bank/UPI details above to pay the exact amount, then upload a screenshot of the completed transaction.',
  };
}
