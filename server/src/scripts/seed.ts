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

  // ============ CREATE VENUES (Ahmedabad & Gandhinagar) ============
  const venues = await Venue.create([
    {
      name: 'PVR IMAX Acropolis',
      address: 'Acropolis Mall, 3rd Floor, Thaltej',
      city: 'Ahmedabad',
      state: 'Gujarat',
      zipCode: '380054',
      phone: '079-4890-1234',
      email: 'imax.ahmedabad@pvr.com'
    },
    {
      name: 'INOX Ahmedabad One',
      address: 'Ahmedabad One Mall, 4th Floor, Vastrapur',
      city: 'Ahmedabad',
      state: 'Gujarat',
      zipCode: '380015',
      phone: '079-4891-5678',
      email: 'ahmedabad.one@inox.com'
    },
    {
      name: 'Cinepolis Alpha One',
      address: 'Alpha One Mall, 3rd Floor, Vastrapur',
      city: 'Ahmedabad',
      state: 'Gujarat',
      zipCode: '380015',
      phone: '079-4892-9012',
      email: 'alphaone@cinepolis.com'
    },
    {
      name: 'Rajhans Cinemas SG Highway',
      address: 'Rajhans Complex, S.G. Highway, Bodakdev',
      city: 'Ahmedabad',
      state: 'Gujarat',
      zipCode: '380054',
      phone: '079-4893-3456',
      email: 'sghighway@rajhanscinemas.com'
    },
    {
      name: 'Wide Angle Multiplex',
      address: 'Shivranjani Cross Roads, Satellite',
      city: 'Ahmedabad',
      state: 'Gujarat',
      zipCode: '380015',
      phone: '079-2676-5432',
      email: 'info@wideangle.com'
    },
    {
      name: 'PVR Gandhinagar',
      address: 'Infocity Club Road, GIFT City',
      city: 'Gandhinagar',
      state: 'Gujarat',
      zipCode: '382355',
      phone: '079-4894-7890',
      email: 'gandhinagar@pvr.com'
    },
    {
      name: 'INOX Gandhinagar Central',
      address: 'Central Mall, Sector 21',
      city: 'Gandhinagar',
      state: 'Gujarat',
      zipCode: '382021',
      phone: '079-4895-2345',
      email: 'gandhinagar.central@inox.com'
    }
  ]);
  console.log(`🏢 Created ${venues.length} venues in Ahmedabad & Gandhinagar`);

  // ============ CREATE HALLS ============
  const halls: any[] = [];
  for (const venue of venues) {
    const isIMAX = venue.name.includes('IMAX');
    const isPremium = venue.name.includes('PVR') || venue.name.includes('Cinepolis');
    
    const hallsForVenue = await Hall.create([
      {
        venueId: venue._id,
        name: isIMAX ? 'IMAX Screen' : 'Screen 1 - Dolby Atmos',
        capacity: isIMAX ? 300 : 200,
        rows: isIMAX ? 15 : 10,
        seatsPerRow: 20,
        seatMap: generateSeatMap(isIMAX ? 15 : 10, 20, isPremium ? 250 : 180),
        amenities: isIMAX ? ['IMAX', 'Laser Projection', 'Dolby Atmos', 'Recliner Seats'] : ['Dolby Atmos', '4K Projection', 'Premium Sound']
      },
      {
        venueId: venue._id,
        name: 'Screen 2 - 4DX',
        capacity: 120,
        rows: 8,
        seatsPerRow: 15,
        seatMap: generateSeatMap(8, 15, isPremium ? 350 : 280),
        amenities: ['4DX', 'Motion Seats', 'Environmental Effects', 'Dolby Digital']
      },
      {
        venueId: venue._id,
        name: 'Screen 3 - Standard',
        capacity: 180,
        rows: 12,
        seatsPerRow: 15,
        seatMap: generateSeatMap(12, 15, isPremium ? 180 : 150),
        amenities: ['Dolby Digital', 'Cup Holders', 'Stadium Seating']
      }
    ]);
    halls.push(...hallsForVenue);
  }
  console.log(`🎬 Created ${halls.length} halls`);

  // ============ CREATE EVENTS (UPDATED 2025-2026 SLATE) ============
  const events = await Event.create([
    {
      title: 'War 2',
      description: 'A high-stakes action thriller set in the YRF spy universe, following a cross-border mission with elite operatives facing a global threat network.',
      durationMinutes: 168,
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
      genre: ['Action', 'Thriller'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2025-08-14'),
      director: 'Ayan Mukerji',
      cast: ['Hrithik Roshan', 'N. T. Rama Rao Jr.', 'Kiara Advani'],
      isActive: true
    },
    {
      title: 'Coolie',
      description: 'A large-scale Tamil action drama centered on a veteran smuggler drawn into an escalating conflict with a powerful syndicate.',
      durationMinutes: 172,
      posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80',
      genre: ['Action', 'Drama'],
      language: 'Tamil',
      rating: 'UA',
      releaseDate: new Date('2025-10-17'),
      director: 'Lokesh Kanagaraj',
      cast: ['Rajinikanth', 'Nagarjuna', 'Upendra'],
      isActive: true
    },
    {
      title: 'Kantara: Chapter 1',
      description: 'A mythic prequel exploring folklore, land, and legacy through an intense period action drama rooted in coastal Karnataka traditions.',
      durationMinutes: 160,
      posterUrl: 'https://images.unsplash.com/photo-1509248961895-b4c4a87b1f16?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&q=80',
      genre: ['Action', 'Drama', 'Mystery'],
      language: 'Kannada',
      rating: 'UA',
      releaseDate: new Date('2025-10-02'),
      director: 'Rishab Shetty',
      cast: ['Rishab Shetty'],
      isActive: true
    },
    {
      title: 'Avatar: Fire and Ash',
      description: 'The next chapter in the Avatar saga expands Pandora with new clans and escalating conflict across land, ocean, and sky.',
      durationMinutes: 190,
      posterUrl: 'https://images.unsplash.com/photo-1547499417-61a0fa592af6?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
      genre: ['Sci-Fi', 'Adventure'],
      language: 'English',
      rating: 'UA',
      releaseDate: new Date('2025-12-19'),
      director: 'James Cameron',
      cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
      isActive: true
    },
    {
      title: 'Avengers: Doomsday',
      description: 'Earth\'s mightiest heroes reunite against a multiversal-scale threat that forces unlikely alliances and major sacrifices.',
      durationMinutes: 182,
      posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1920&q=80',
      genre: ['Action', 'Sci-Fi', 'Adventure'],
      language: 'English',
      rating: 'UA',
      releaseDate: new Date('2026-05-01'),
      director: 'Anthony Russo, Joe Russo',
      cast: ['Ensemble Cast'],
      isActive: true
    },
    {
      title: 'The Mandalorian & Grogu',
      description: 'A cinematic continuation of the Star Wars storyline, taking Din Djarin and Grogu on a new mission across the Outer Rim.',
      durationMinutes: 136,
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
      genre: ['Sci-Fi', 'Adventure'],
      language: 'English',
      rating: 'UA',
      releaseDate: new Date('2026-05-22'),
      director: 'Jon Favreau',
      cast: ['Pedro Pascal'],
      isActive: true
    },
    {
      title: 'Toy Story 5',
      description: 'A new generation of toys and technology challenges old friendships as the gang finds fresh purpose in a changing world.',
      durationMinutes: 110,
      posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&q=80',
      genre: ['Animation', 'Family', 'Comedy'],
      language: 'English',
      rating: 'U',
      releaseDate: new Date('2026-06-19'),
      director: 'Pixar Team',
      cast: ['Tom Hanks', 'Tim Allen'],
      isActive: true
    },
    {
      title: 'Dune: Messiah',
      description: 'Following his rise to power, Paul Atreides navigates prophecy, politics, and consequences across a fractured empire.',
      durationMinutes: 175,
      posterUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1559060017-445fb9722f4a?w=1920&q=80',
      genre: ['Sci-Fi', 'Drama'],
      language: 'English',
      rating: 'UA',
      releaseDate: new Date('2026-12-18'),
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Florence Pugh'],
      isActive: true
    },
    {
      title: 'Pushpa 3: The Rampage',
      description: 'Pushpa\'s empire faces global pressure as rival factions and law enforcement close in, igniting a brutal final chapter.',
      durationMinutes: 188,
      posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80',
      genre: ['Action', 'Drama', 'Thriller'],
      language: 'Telugu',
      rating: 'A',
      releaseDate: new Date('2026-08-14'),
      director: 'Sukumar',
      cast: ['Allu Arjun', 'Rashmika Mandanna'],
      isActive: true
    },
    {
      title: 'Kalki 2898 AD: Part 2',
      description: 'The next phase of the epic sci-fi saga expands the battle between ancient prophecy and futuristic empires.',
      durationMinutes: 184,
      posterUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80',
      genre: ['Sci-Fi', 'Action', 'Fantasy'],
      language: 'Telugu',
      rating: 'UA',
      releaseDate: new Date('2026-10-22'),
      director: 'Nag Ashwin',
      cast: ['Prabhas', 'Deepika Padukone', 'Amitabh Bachchan'],
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
      
      // Pick 3-4 random halls for each movie each day
      const shuffledHalls = halls.sort(() => Math.random() - 0.5).slice(0, 4);
      
      for (const hall of shuffledHalls) {
        // 5 showtimes per hall
        const showtimes = [
          { hour: 9, minute: 30 },
          { hour: 12, minute: 45 },
          { hour: 16, minute: 0 },
          { hour: 19, minute: 15 },
          { hour: 22, minute: 30 }
        ];
        
        for (const time of showtimes) {
          const startTime = new Date(showDate);
          startTime.setHours(time.hour, time.minute, 0, 0);
          
          // Skip if showtime is in the past
          if (startTime < today) continue;
          
          const endTime = new Date(startTime.getTime() + event.durationMinutes * 60000);
          
          // Determine price based on hall amenities (in INR)
          let basePrice = 150;
          if (hall.amenities.includes('IMAX')) basePrice = 450;
          else if (hall.amenities.includes('4DX')) basePrice = 500;
          else if (hall.amenities.includes('Dolby Atmos')) basePrice = 280;
          
          // Evening/night shows are more expensive
          if (time.hour >= 18) basePrice = Math.round(basePrice * 1.2);
          
          try {
            const show = await Show.create({
              eventId: event._id,
              hallId: hall._id,
              startTime,
              endTime,
              price: basePrice,
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
  console.log('📊 SEED SUMMARY - CINEMATRIX');
  console.log('=============================================');
  console.log(`✅ Venues: ${venues.length} (Ahmedabad & Gandhinagar)`);
  console.log(`✅ Halls: ${halls.length}`);
  console.log(`✅ Movies: ${events.length} (Updated 2025-2026 slate)`);
  console.log(`✅ Shows: ${shows.length}`);
  console.log('\n🏢 Venues:');
  venues.forEach(v => console.log(`   - ${v.name}, ${v.city}`));
  console.log('\n🎬 Movies:');
  events.forEach(e => console.log(`   - ${e.title} (${e.language})`));
  console.log('\n🔐 Admin Login:');
  console.log('   Email: admin@cinematrix.com');
  console.log('   Password: Admin123!');
  console.log('\n📝 Sample API Calls:');
  console.log(`   GET /api/events - List all movies`);
  console.log(`   GET /api/events/${events[0]._id}/shows - Shows for ${events[0].title}`);
  console.log(`   GET /api/venues - List all venues`);
  console.log(`   GET /api/events/shows/${shows[0]?._id}/seats - Available seats`);
  console.log('=============================================\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
