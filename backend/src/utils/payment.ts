import crypto from 'crypto';

export const VALID_PAYMENT_METHODS = ['esewa'] as const;

export type PaymentMethod = typeof VALID_PAYMENT_METHODS[number] | null;

export function generateEsewaSignature(amount: number, transactionUuid: string, productCode: string, secretKey: string) {
  const message = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

export function verifyEsewaSignature(data: string, secretKey: string) {
  try {
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(decodedData);
    
    // As per eSewa documentation, verify the signature sent in the data
    const message = `transaction_code=${parsedData.transaction_code},status=${parsedData.status},total_amount=${parsedData.total_amount},transaction_uuid=${parsedData.transaction_uuid},product_code=${parsedData.product_code},signed_field_names=${parsedData.signed_field_names}`;
    
    // Sometimes eSewa uses different format for signature verification, but typically it expects the same fields.
    // Wait, the documentation actually says the verification signature is generated from the signed_field_names provided in the decoded data.
    const signedFieldNames = parsedData.signed_field_names.split(',');
    const messageParts = signedFieldNames.map((field: string) => `${field}=${parsedData[field]}`);
    const constructedMessage = messageParts.join(',');
    
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(constructedMessage).digest('base64');
    
    return {
      isValid: expectedSignature === parsedData.signature,
      parsedData
    };
  } catch (error) {
    return { isValid: false, parsedData: null };
  }
}

export function getPaymentDetails(paymentMethod: PaymentMethod, orderId: string, amount: number = 0) {
  if (paymentMethod === 'esewa') {
    const merchantId = process.env.ESEWA_TEST_MERCHANT_ID || 'EPAYTEST';
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    
    return {
      gateway: 'esewa',
      merchantId,
      productCode: merchantId,
      signature: generateEsewaSignature(amount, orderId, merchantId, secretKey),
      amountKey: 'amount',
      amount: amount,
      taxAmount: 0,
      totalAmount: amount,
      transactionUuid: orderId,
      successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
      failureUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`,
      url: process.env.ESEWA_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      instructions:
        'Pay instantly using eSewa web portal or use the Merchant QR code in your eSewa app. (For testing use mobile: 9806800001, MPIN: 1122)',
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
