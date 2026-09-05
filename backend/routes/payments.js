const express = require('express');
const Razorpay = require('razorpay');
const Bus = require('../models/Bus');
const auth = require('../middleware/auth');
const { paymentMode } = require('../utils/payments');

const router = express.Router();

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.get('/config', (_req, res) => {
  const mode = paymentMode();
  res.json({
    mode,
    keyId: mode === 'razorpay' ? process.env.RAZORPAY_KEY_ID : 'rzp_mock_local',
  });
});

router.post('/order', auth, async (req, res) => {
  try {
    const { busId, seats } = req.body;
    if (!busId || !seats?.length) {
      return res.status(400).json({ message: 'busId and seats are required.' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });

    const taken = seats.filter((s) => bus.bookedSeats.includes(s));
    if (taken.length) {
      return res.status(409).json({ message: `Seats already booked: ${taken.join(', ')}` });
    }

    const amountRupees = seats.length * bus.price;
    const amountPaise = amountRupees * 100;
    const mode = paymentMode();

    if (mode === 'mock') {
      return res.json({
        mode,
        orderId: `order_mock_${Date.now()}`,
        amount: amountPaise,
        currency: 'INR',
        keyId: 'rzp_mock_local',
      });
    }

    const order = await getRazorpay().orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `bus_${busId}_${Date.now()}`.slice(0, 40),
      notes: { busId: String(busId), seats: seats.join(','), userId: req.user.id },
    });

    res.json({
      mode,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not create payment order', error: err.message });
  }
});

module.exports = router;
