import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database';
import { Event } from '../modules/event/event.model';
import { Show } from '../modules/event/show.model';
import { Booking } from '../modules/booking/booking.model';
import { User } from '../modules/auth/user.model';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars manually for script execution
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seed = async () => {
  await connectMongoDB();

  console.log('🧹 Cleaning up old data...');
  // Optional: Clear existing data to start fresh. Comment out if you want to keep old data.
  // await Booking.deleteMany({});
  // await Show.deleteMany({});
  // await Event.deleteMany({});
  // await User.deleteMany({}); // Be careful deleting users if you want to keep your login

  console.log('🌱 Seeding data...');

  // 1. Create Event (Movie)
  const movie = await Event.create({
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
    durationMinutes: 148,
    genre: ['Sci-Fi', 'Action'],
    isActive: true,
  });

  console.log(`🎬 Created Movie: ${movie.title} (${movie._id})`);

  // 2. Create Show (Screening)
  const showTime = new Date();
  showTime.setHours(showTime.getHours() + 24); // Tomorrow

  const show = await Show.create({
    eventId: movie._id,
    startTime: showTime,
    hallId: 'HALL_1',
    totalSeats: 50,
    price: 15.00,
    bookedSeats: [], // Start empty
  });

  console.log(`\n=============================================`);
  console.log(`🎟️  CREATED SHOW ID: ${show._id}`);
  console.log(`=============================================`);
  console.log(`Use this Show ID to test /lock and /confirm endpoints.`);
  console.log(`Example Seats: "A1", "A2", "B5"`);
  console.log(`\nDone.`);

  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
