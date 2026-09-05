const crypto = require('crypto');

function paymentMode() {
  const mode = (process.env.PAYMENT_MODE || 'mock').toLowerCase();
  const hasKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  if (mode === 'razorpay' && hasKeys) return 'razorpay';
  return 'mock';
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;

  if (paymentMode() === 'mock') {
    return signature === `mock_sig_${orderId}_${paymentId}`;
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
}

module.exports = { paymentMode, verifyPaymentSignature };
