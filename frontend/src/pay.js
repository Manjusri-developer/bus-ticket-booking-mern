export function openCheckout({ order, user, onSuccess, onDismiss }) {
  if (order.mode !== 'razorpay' || typeof window.Razorpay !== 'function') {
    const ok = window.confirm(
      `Demo payment of ₹${(order.amount / 100).toFixed(0)}\n\nOK = pay (mock Razorpay)\nCancel = abort`
    );
    if (!ok) {
      onDismiss?.();
      return;
    }
    const paymentId = `pay_mock_${Date.now()}`;
    onSuccess({
      razorpay_order_id: order.orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: `mock_sig_${order.orderId}_${paymentId}`,
    });
    return;
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'GoRide',
    description: 'Bus ticket',
    order_id: order.orderId,
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
    },
    theme: { color: '#f5b942' },
    handler(response) {
      onSuccess(response);
    },
    modal: {
      ondismiss() {
        onDismiss?.();
      },
    },
  });

  rzp.on('payment.failed', (resp) => {
    onDismiss?.(resp?.error?.description || 'Payment failed');
  });
  rzp.open();
}
