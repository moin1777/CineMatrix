import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database';
import { Event } from '../modules/event/event.model';
import { Show } from '../modules/event/show.model';
import { Booking } from '../modules/booking/booking.model';
import { User } from '../modules/auth/user.model';
import { Venue, Hall, generateSeatMap } from '../modules/venue/venue.model';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars manually for script execution
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seed = async () => {
  await connectMongoDB();

  console.log('🧹 Cleaning up old data...');
  await Booking.deleteMany({});
  await Show.deleteMany({});
  // Drop events collection entirely to remove old text index
  try {
    await mongoose.connection.db?.dropCollection('events');
  } catch {
    // Collection may not exist
  }
  await Hall.deleteMany({});
  await Venue.deleteMany({});
  // Keep users but reset their history
  await User.updateMany({}, { $set: { history: [] } });

  console.log('🌱 Seeding data...\n');

  // ============ CREATE ADMIN USER ============
  let adminUser = await User.findOne({ email: 'admin@cinematrix.com' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'admin@cinematrix.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin'
    });
    console.log('👤 Created admin user: admin@cinematrix.com / Admin123!');
  }

  // ============ CREATE VENUES ============
  const venues = await Venue.create([
    {
      name: 'Cinematrix Downtown',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '212-555-0100',
      email: 'downtown@cinematrix.com'
    },
    {
      name: 'Cinematrix Mall',
      address: '456 Shopping Center Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      phone: '310-555-0200',
      email: 'mall@cinematrix.com'
    }
  ]);
  console.log(`🏢 Created ${venues.length} venues`);

  // ============ CREATE HALLS ============
  const halls: any[] = [];
  for (const venue of venues) {
    const hallsForVenue = await Hall.create([
      {
        venueId: venue._id,
        name: 'Screen 1 - IMAX',
        capacity: 200,
        rows: 10,
        seatsPerRow: 20,
        seatMap: generateSeatMap(10, 20, 20),
        amenities: ['IMAX', 'Dolby Atmos', 'Recliner Seats']
      },
      {
        venueId: venue._id,
        name: 'Screen 2 - Standard',
        capacity: 150,
        rows: 10,
        seatsPerRow: 15,
        seatMap: generateSeatMap(10, 15, 12),
        amenities: ['Dolby Digital', 'Cup Holders']
      },
      {
        venueId: venue._id,
        name: 'Screen 3 - Premium',
        capacity: 80,
        rows: 8,
        seatsPerRow: 10,
        seatMap: generateSeatMap(8, 10, 25),
        amenities: ['4DX', 'Dolby Atmos', 'Recliner Seats', 'In-seat Service']
      }
    ]);
    halls.push(...hallsForVenue);
  }
  console.log(`🎬 Created ${halls.length} halls`);

  // ============ CREATE EVENTS (MOVIES) ============
  const events = await Event.create([
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      durationMinutes: 148,
      posterUrl: 'https://example.com/inception-poster.jpg',
      genre: ['Sci-Fi', 'Action', 'Thriller'],
      language: 'English',
      rating: 'PG-13',
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'],
      isActive: true
    },
    {
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.',
      durationMinutes: 152,
      posterUrl: 'https://example.com/dark-knight-poster.jpg',
      genre: ['Action', 'Crime', 'Drama'],
      language: 'English',
      rating: 'PG-13',
      director: 'Christopher Nolan',
      cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
      isActive: true
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      durationMinutes: 169,
      posterUrl: 'https://example.com/interstellar-poster.jpg',
      genre: ['Sci-Fi', 'Adventure', 'Drama'],
      language: 'English',
      rating: 'PG-13',
      director: 'Christopher Nolan',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
      isActive: true
    },
    {
      title: 'Parasite',
      description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
      durationMinutes: 132,
      posterUrl: 'https://example.com/parasite-poster.jpg',
      genre: ['Thriller', 'Drama', 'Comedy'],
      language: 'Korean',
      rating: 'R',
      director: 'Bong Joon-ho',
      cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'],
      isActive: true
    },
    {
      title: 'Avengers: Endgame',
      description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.',
      durationMinutes: 181,
      posterUrl: 'https://example.com/endgame-poster.jpg',
      genre: ['Action', 'Adventure', 'Sci-Fi'],
      language: 'English',
      rating: 'PG-13',
      director: 'Anthony Russo, Joe Russo',
      cast: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson'],
      isActive: true
    }
  ]);
  console.log(`🎥 Created ${events.length} movies`);

  // ============ CREATE SHOWS ============
  const shows: any[] = [];
  const today = new Date();
  
  for (const event of events) {
    // Create shows for the next 7 days
    for (let day = 0; day < 7; day++) {
      const showDate = new Date(today);
      showDate.setDate(showDate.getDate() + day);
      
      // Pick 2-3 random halls for each movie each day
      const shuffledHalls = halls.sort(() => Math.random() - 0.5).slice(0, 3);
      
      for (const hall of shuffledHalls) {
        // 3 showtimes per hall: 10:00, 14:00, 18:00, 21:00
        const showtimes = [10, 14, 18, 21];
        
        for (const hour of showtimes) {
          const startTime = new Date(showDate);
          startTime.setHours(hour, 0, 0, 0);
          
          // Skip if showtime is in the past
          if (startTime < today) continue;
          
          const endTime = new Date(startTime.getTime() + event.durationMinutes * 60000);
          
          try {
            const show = await Show.create({
              eventId: event._id,
              hallId: hall._id,
              startTime,
              endTime,
              price: hall.amenities.includes('IMAX') ? 20 : hall.amenities.includes('4DX') ? 25 : 12,
              totalSeats: hall.capacity,
              bookedSeats: []
            });
            shows.push(show);
          } catch (err) {
            // Skip conflicting shows silently
          }
        }
      }
    }
  }
  console.log(`🎟️  Created ${shows.length} shows`);

  // ============ SUMMARY ============
  console.log('\n=============================================');
  console.log('📊 SEED SUMMARY');
  console.log('=============================================');
  console.log(`✅ Venues: ${venues.length}`);
  console.log(`✅ Halls: ${halls.length}`);
  console.log(`✅ Movies: ${events.length}`);
  console.log(`✅ Shows: ${shows.length}`);
  console.log('\n🔐 Admin Login:');
  console.log('   Email: admin@cinematrix.com');
  console.log('   Password: Admin123!');
  console.log('\n📝 Sample API Calls:');
  console.log(`   GET /api/events - List all movies`);
  console.log(`   GET /api/events/${events[0]._id}/shows - Shows for Inception`);
  console.log(`   GET /api/venues - List all venues`);
  console.log(`   GET /api/events/shows/${shows[0]?._id}/seats - Available seats`);
  console.log('=============================================\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
