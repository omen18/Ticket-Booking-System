import {
  Artist,
  Category,
  Discount,
  Event,
  Organizer,
  Review,
  Seat,
  User,
  Venue,
} from "@/types";

export const users: User[] = [
  {
    user_id: 1,
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91-9000000001",
    password: "hashed_password_1",
  },
  {
    user_id: 2,
    name: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    phone: "+91-9000000002",
    password: "hashed_password_2",
  },
  {
    user_id: 3,
    name: "Karan Mehta",
    email: "karan.mehta@example.com",
    phone: "+91-9000000003",
    password: "hashed_password_3",
  },
  {
    user_id: 4,
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "+91-9000000004",
    password: "hashed_password_4",
  },
  {
    user_id: 5,
    name: "Amit Verma",
    email: "amit.verma@example.com",
    phone: "+91-9000000005",
    password: "hashed_password_5",
  },
];

export const venues: Venue[] = [
  {
    venue_id: 1,
    venue_name: "Grand Cinema Hall Chennai",
    location: "Chennai",
    capacity: 300,
  },
  {
    venue_id: 2,
    venue_name: "Music Arena Bangalore",
    location: "Bangalore",
    capacity: 500,
  },
  {
    venue_id: 3,
    venue_name: "City Theatre Hyderabad",
    location: "Hyderabad",
    capacity: 200,
  },
  {
    venue_id: 4,
    venue_name: "Open Ground Mumbai",
    location: "Mumbai",
    capacity: 800,
  },
  {
    venue_id: 5,
    venue_name: "Convention Center Delhi",
    location: "Delhi",
    capacity: 600,
  },
];

export const categories: Category[] = [
  { category_id: 1, category_name: "Movie" },
  { category_id: 2, category_name: "Music" },
  { category_id: 3, category_name: "Theatre" },
  { category_id: 4, category_name: "Comedy" },
  { category_id: 5, category_name: "Festival" },
];

export const organizers: Organizer[] = [
  { organizer_id: 1, name: "CineScope Events", contact: "+91-8000000101" },
  { organizer_id: 2, name: "Sonic Live", contact: "+91-8000000102" },
  { organizer_id: 3, name: "StageCraft Productions", contact: "+91-8000000103" },
  { organizer_id: 4, name: "Laugh Track India", contact: "+91-8000000104" },
  { organizer_id: 5, name: "SeasonFest Collective", contact: "+91-8000000105" },
];

export const events: Event[] = [
  {
    event_id: 1,
    event_name: "Avengers Movie Night",
    event_date: "2026-04-10",
    venue_id: 1,
    category_id: 1,
    organizer_id: 1,
    admin_id: 1,
  },
  {
    event_id: 2,
    event_name: "AR Rahman Concert",
    event_date: "2026-05-05",
    venue_id: 2,
    category_id: 2,
    organizer_id: 2,
    admin_id: 1,
  },
  {
    event_id: 3,
    event_name: "Drama Night",
    event_date: "2026-04-20",
    venue_id: 3,
    category_id: 3,
    organizer_id: 3,
    admin_id: 1,
  },
  {
    event_id: 4,
    event_name: "Stand-up Comedy",
    event_date: "2026-06-01",
    venue_id: 4,
    category_id: 4,
    organizer_id: 4,
    admin_id: 1,
  },
  {
    event_id: 5,
    event_name: "Spring Festival",
    event_date: "2026-07-15",
    venue_id: 5,
    category_id: 5,
    organizer_id: 5,
    admin_id: 1,
  },
];

export const seats: Seat[] = [
  { seat_id: 1, seat_number: "A1", venue_id: 1, status: "available" },
  { seat_id: 2, seat_number: "A2", venue_id: 1, status: "available" },
  { seat_id: 3, seat_number: "B1", venue_id: 2, status: "available" },
  { seat_id: 4, seat_number: "B2", venue_id: 2, status: "available" },
  { seat_id: 5, seat_number: "C1", venue_id: 3, status: "available" },
  { seat_id: 6, seat_number: "C2", venue_id: 3, status: "available" },
  { seat_id: 7, seat_number: "D1", venue_id: 4, status: "available" },
  { seat_id: 8, seat_number: "D2", venue_id: 4, status: "available" },
  { seat_id: 9, seat_number: "E1", venue_id: 5, status: "available" },
  { seat_id: 10, seat_number: "E2", venue_id: 5, status: "available" },
];

export const discounts: Discount[] = [
  { discount_id: 1, code: "NEWUSER", percentage: 10, expiry_date: "2026-12-31" },
  { discount_id: 2, code: "FESTIVE", percentage: 20, expiry_date: "2026-12-31" },
  { discount_id: 3, code: "SUMMER", percentage: 15, expiry_date: "2026-12-31" },
  { discount_id: 4, code: "SPECIAL", percentage: 25, expiry_date: "2026-12-31" },
  { discount_id: 5, code: "VIP", percentage: 30, expiry_date: "2026-12-31" },
];

export const artists: Artist[] = [
  { artist_id: 1, artist_name: "AR Rahman", genre: "Music" },
  { artist_id: 2, artist_name: "Kapil Sharma", genre: "Comedy" },
  { artist_id: 3, artist_name: "Drama Group", genre: "Theatre" },
  { artist_id: 4, artist_name: "DJ Snake", genre: "Music" },
  { artist_id: 5, artist_name: "Festival Band", genre: "Music" },
];

export const reviews: Review[] = [
  { review_id: 1, user_id: 1, event_id: 1, rating: 5, comment: "Absolutely spectacular! The atmosphere was electric and every moment was unforgettable.", user: users[0] },
  { review_id: 2, user_id: 2, event_id: 1, rating: 4, comment: "Great experience overall. The venue was well-organised and the show started on time.", user: users[1] },
  { review_id: 3, user_id: 3, event_id: 1, rating: 4, comment: "Really enjoyed it. Would definitely attend again next year.", user: users[2] },
  { review_id: 4, user_id: 1, event_id: 2, rating: 5, comment: "AR Rahman live is a completely different experience. Goosebumps throughout!", user: users[0] },
  { review_id: 5, user_id: 4, event_id: 2, rating: 5, comment: "One of the best concerts I have ever attended. Flawless sound and lighting.", user: users[3] },
  { review_id: 6, user_id: 2, event_id: 3, rating: 3, comment: "Good performance but the seating could have been better arranged.", user: users[1] },
  { review_id: 7, user_id: 5, event_id: 4, rating: 5, comment: "Kapil Sharma had the entire crowd in splits. Non-stop laughter for two hours!", user: users[4] },
  { review_id: 8, user_id: 3, event_id: 5, rating: 4, comment: "Vibrant festival with great food stalls and live performances. Loved it.", user: users[2] },
];
