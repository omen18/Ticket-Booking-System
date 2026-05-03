export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role?: "user" | "admin";
  admin_id?: number;
  password?: string;
}

export interface Venue {
  venue_id: number;
  venue_name: string;
  location: string;
  capacity: number;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Organizer {
  organizer_id: number;
  name: string;
  contact: string;
}

export interface Event {
  event_id: number;
  event_name: string;
  event_date: string;
  venue_id: number;
  category_id: number;
  organizer_id: number;
  admin_id: number;
  venue?: Venue;
  category?: Category;
  organizer?: Organizer;
  artists?: Artist[];
  reviews?: Review[];
}

export interface Seat {
  seat_id: number;
  seat_number: string;
  venue_id: number;
  status?: "available" | "booked" | "locked" | "selected";
}

export interface Booking {
  booking_id: number;
  user_id: number;
  event_id: number;
  booking_date: string;
  event?: Event;
  payment?: Payment;
  tickets?: Ticket[];
}

export interface Payment {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  status: "Completed" | "Pending" | "Failed" | "Refunded";
}

export interface Ticket {
  ticket_id: number;
  booking_id: number;
  seat_id: number;
  event_id: number;
  qr_code: string;
  seat?: Seat;
}

export interface Review {
  review_id: number;
  user_id: number;
  event_id: number;
  rating: number;
  comment: string;
  user?: User;
}

export interface Discount {
  discount_id: number;
  code: string;
  percentage: number;
  expiry_date: string;
}

export interface Artist {
  artist_id: number;
  artist_name: string;
  genre: string;
}
