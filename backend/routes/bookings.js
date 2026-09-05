const express = require('express');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { busId, seats, passengerName, passengerPhone } = req.body;
    if (!busId || !seats?.length || !passengerName || !passengerPhone) {
      return res.status(400).json({ message: 'busId, seats, passengerName and passengerPhone are required.' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });

    const taken = seats.filter((s) => bus.bookedSeats.includes(s));
    if (taken.length) {
      return res.status(409).json({ message: `Seats already booked: ${taken.join(', ')}` });
    }

    const invalid = seats.filter((s) => s < 1 || s > bus.totalSeats);
    if (invalid.length) {
      return res.status(400).json({ message: 'One or more seat numbers are invalid.' });
    }

    bus.bookedSeats.push(...seats);
    await bus.save();

    const booking = await Booking.create({
      user: req.user.id,
      bus: bus._id,
      seats,
      passengerName,
      passengerPhone,
      totalAmount: seats.length * bus.price,
    });

    const populated = await booking.populate('bus');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('bus').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
});

module.exports = router;
