require('dotenv').config();
const mongoose = require('mongoose');
const Bus = require('./models/Bus');

const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);

const dates = [0, 1, 2].map((offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return fmt(d);
});

const routes = [
  { from: 'Bengaluru', to: 'Chennai', duration: '6h 30m' },
  { from: 'Bengaluru', to: 'Hyderabad', duration: '8h 15m' },
  { from: 'Bengaluru', to: 'Mysuru', duration: '3h 00m' },
  { from: 'Chennai', to: 'Bengaluru', duration: '6h 45m' },
];

const operators = ['RedLine Travels', 'SkyWay Express', 'Coastal Riders', 'Metro Coach'];
const types = ['AC Sleeper', 'Volvo AC', 'Non-AC Seater'];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Bus.deleteMany({});

  const buses = [];
  for (const date of dates) {
    for (const route of routes) {
      buses.push({
        operator: operators[Math.floor(Math.random() * operators.length)],
        from: route.from,
        to: route.to,
        departureTime: '21:30',
        arrivalTime: '04:00',
        duration: route.duration,
        date,
        price: 650 + Math.floor(Math.random() * 500),
        totalSeats: 40,
        bookedSeats: [1, 2, 12],
        type: types[Math.floor(Math.random() * types.length)],
      });
      buses.push({
        operator: operators[Math.floor(Math.random() * operators.length)],
        from: route.from,
        to: route.to,
        departureTime: '06:15',
        arrivalTime: '12:45',
        duration: route.duration,
        date,
        price: 499 + Math.floor(Math.random() * 400),
        totalSeats: 40,
        bookedSeats: [5, 18],
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  }

  await Bus.insertMany(buses);
  console.log(`Seeded ${buses.length} buses for dates ${dates.join(', ')}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
