const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    operator: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    duration: { type: String, required: true },
    date: { type: String, required: true },
    price: { type: Number, required: true },
    totalSeats: { type: Number, default: 40 },
    bookedSeats: { type: [Number], default: [] },
    type: { type: String, default: 'AC Sleeper' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
