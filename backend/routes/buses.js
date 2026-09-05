const express = require('express');
const Bus = require('../models/Bus');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const filter = {};
    if (from) filter.from = new RegExp(`^${from}$`, 'i');
    if (to) filter.to = new RegExp(`^${to}$`, 'i');
    if (date) filter.date = date;

    const buses = await Bus.find(filter).sort({ departureTime: 1 });
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch buses', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bus', error: err.message });
  }
});

module.exports = router;
