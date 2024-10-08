import express from 'express';
import kue from 'kue';
import { createClient } from 'redis';
import { promisify } from 'util';

const app = express();
const client = createClient();
const getAsync = promisify(client.get).bind(client);
const queue = kue.createQueue();
const PORT = 1245;

let availableSeats = 50;
let reservationEnabled = true;

app.get('/available_seats', (req, res) => {
  res.json({ numberOfAvailableSeats: availableSeats });
});

app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    return res.json({ status: 'Reservation are blocked' });
  }

  const job = queue.create('reserve_seat').save((err) => {
    if (!err) res.json({ status: 'Reservation in process' });
  });

  job.on('complete', () => {
    console.log(`Seat reservation job ${job.id} completed`);
  }).on('failed', (err) => {
    console.log(`Seat reservation job ${job.id} failed: ${err}`);
  });
});

queue.process('reserve_seat', async (job, done) => {
  const currentSeats = await getAsync('available_seats') || availableSeats;
  if (currentSeats <= 0) {
    reservationEnabled = false;
    return done(new Error('Not enough seats available'));
  }

  availableSeats -= 1;
  client.set('available_seats', availableSeats);
  if (availableSeats <= 0) reservationEnabled = false;
  done();
});

app.get('/process', (req, res) => {
  res.json({ status: 'Queue processing' });
  queue.process('reserve_seat');
});

app.listen(PORT, () => {
  client.set('available_seats', 50);
  console.log(`Server running on port ${PORT}`);
});
