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

  // ============ CREATE EVENTS (LATEST 2024-2025 MOVIES) ============
  const events = await Event.create([
    {
      title: 'Pushpa 2: The Rule',
      description: 'Pushpa Raj returns in this action-packed sequel, continuing his rise in the red sandalwood smuggling syndicate. Facing new enemies and greater challenges, Pushpa must protect his empire while dealing with a formidable new antagonist Bhanwar Singh Shekawat.',
      durationMinutes: 200,
      posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80',
      genre: ['Action', 'Drama', 'Thriller'],
      language: 'Telugu',
      rating: 'UA',
      releaseDate: new Date('2024-12-05'),
      director: 'Sukumar',
      cast: ['Allu Arjun', 'Rashmika Mandanna', 'Fahadh Faasil'],
      isActive: true
    },
    {
      title: 'Stree 2',
      description: 'The horror-comedy sequel returns to Chanderi where the residents face a new terrifying threat called Sarkata. Vicky and his friends must once again confront supernatural forces to save their town and the women from an ancient headless evil.',
      durationMinutes: 150,
      posterUrl: 'https://images.unsplash.com/photo-1509248961895-b4c4a87b1f16?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&q=80',
      genre: ['Horror', 'Comedy', 'Thriller'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2024-08-15'),
      director: 'Amar Kaushik',
      cast: ['Rajkummar Rao', 'Shraddha Kapoor', 'Pankaj Tripathi', 'Aparshakti Khurana'],
      isActive: true
    },
    {
      title: 'Bhool Bhulaiyaa 3',
      description: 'The third installment of the blockbuster horror-comedy franchise brings back Rooh Baba in a clash with Manjulika. Get ready for double the horror, double the comedy, and double the twists.',
      durationMinutes: 158,
      posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1604975701397-6365ccbd028a?w=1920&q=80',
      genre: ['Horror', 'Comedy'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2024-11-01'),
      director: 'Anees Bazmee',
      cast: ['Kartik Aaryan', 'Vidya Balan', 'Madhuri Dixit', 'Triptii Dimri'],
      isActive: true
    },
    {
      title: 'Singham Again',
      description: 'Bajirao Singham returns in Rohit Shetty\'s most ambitious cop universe crossover. When a powerful crime syndicate threatens the nation, Singham teams up with Simmba, Sooryavanshi, and Lady Singham for an epic battle of good vs evil.',
      durationMinutes: 175,
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
      genre: ['Action', 'Drama', 'Thriller'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2024-11-01'),
      director: 'Rohit Shetty',
      cast: ['Ajay Devgn', 'Kareena Kapoor', 'Deepika Padukone', 'Ranveer Singh', 'Akshay Kumar', 'Tiger Shroff'],
      isActive: true
    },
    {
      title: 'Kalki 2898 AD',
      description: 'Set in a dystopian future of 2898 AD, this epic sci-fi saga follows the story of Kalki as prophesied saviors rise to protect humanity. An ambitious blend of mythology and futuristic storytelling.',
      durationMinutes: 181,
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
      genre: ['Sci-Fi', 'Action', 'Fantasy'],
      language: 'Telugu',
      rating: 'UA',
      releaseDate: new Date('2024-06-27'),
      director: 'Nag Ashwin',
      cast: ['Prabhas', 'Deepika Padukone', 'Amitabh Bachchan', 'Kamal Haasan', 'Disha Patani'],
      isActive: true
    },
    {
      title: 'Fighter',
      description: 'India\'s first aerial action franchise follows elite Air Force pilots of the Air Dragons squadron as they undertake dangerous missions. A tribute to the Indian Air Force with breathtaking aerial combat sequences.',
      durationMinutes: 166,
      posterUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1559060017-445fb9722f4a?w=1920&q=80',
      genre: ['Action', 'Drama', 'Thriller'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2024-01-25'),
      director: 'Siddharth Anand',
      cast: ['Hrithik Roshan', 'Deepika Padukone', 'Anil Kapoor', 'Karan Singh Grover'],
      isActive: true
    },
    {
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. He must choose between the love of his life and the fate of the known universe.',
      durationMinutes: 166,
      posterUrl: 'https://images.unsplash.com/photo-1547499417-61a0fa592af6?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
      genre: ['Sci-Fi', 'Adventure', 'Drama'],
      language: 'English',
      rating: 'UA',
      releaseDate: new Date('2024-03-01'),
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler', 'Florence Pugh'],
      isActive: true
    },
    {
      title: 'Deadpool & Wolverine',
      description: 'Deadpool\'s peaceful existence comes crashing down when the TVA recruits him to help safeguard the multiverse alongside a reluctant Wolverine pulled from a different timeline.',
      durationMinutes: 127,
      posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1920&q=80',
      genre: ['Action', 'Comedy', 'Sci-Fi'],
      language: 'English',
      rating: 'A',
      releaseDate: new Date('2024-07-26'),
      director: 'Shawn Levy',
      cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
      isActive: true
    },
    {
      title: 'Devara: Part 1',
      description: 'A fearsome sea-based action drama about a legendary coastal guardian. When threats emerge from both land and sea, Devara must rise to protect his people and his legacy in this epic tale of power and redemption.',
      durationMinutes: 172,
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
      genre: ['Action', 'Drama', 'Thriller'],
      language: 'Telugu',
      rating: 'UA',
      releaseDate: new Date('2024-09-27'),
      director: 'Koratala Siva',
      cast: ['Jr. NTR', 'Janhvi Kapoor', 'Saif Ali Khan'],
      isActive: true
    },
    {
      title: 'Venom: The Last Dance',
      description: 'Eddie Brock and Venom are on the run. Hunted by both of their worlds, they must make devastating choices that bring the curtain down on Venom and Eddie\'s last dance.',
      durationMinutes: 140,
      posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80',
      genre: ['Action', 'Sci-Fi', 'Thriller'],
      language: 'English',
      rating: 'UA',
      releaseDate: new Date('2024-10-25'),
      director: 'Kelly Marcel',
      cast: ['Tom Hardy', 'Chiwetel Ejiofor', 'Juno Temple'],
      isActive: true
    },
    {
      title: 'Khel Khel Mein',
      description: 'A group of friends decide to play a game where they must share everything on their phones including messages, calls, and notifications. What starts as fun soon unravels secrets that threaten their relationships.',
      durationMinutes: 145,
      posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&q=80',
      genre: ['Comedy', 'Drama'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2024-08-15'),
      director: 'Mudassar Aziz',
      cast: ['Akshay Kumar', 'Taapsee Pannu', 'Fardeen Khan', 'Vaani Kapoor'],
      isActive: true
    },
    {
      title: 'The Sabarmati Report',
      description: 'A gripping investigative drama that uncovers the truth behind the 2002 Godhra train burning. A journalist\'s relentless pursuit of facts leads to shocking revelations about that fateful day.',
      durationMinutes: 145,
      posterUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80',
      genre: ['Drama', 'Thriller'],
      language: 'Hindi',
      rating: 'UA',
      releaseDate: new Date('2024-11-15'),
      director: 'Dheeraj Sarna',
      cast: ['Vikrant Massey', 'Raashii Khanna', 'Ridhi Dogra'],
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
  console.log(`✅ Movies: ${events.length} (Latest 2024-2025 releases)`);
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
