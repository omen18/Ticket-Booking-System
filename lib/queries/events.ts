import { RowDataPacket } from "mysql2/promise";
import db from "@/lib/db";
import {
  artists as mockArtists,
  categories as mockCategories,
  events as mockEvents,
  organizers as mockOrganizers,
  reviews as mockReviews,
  seats as mockSeats,
  venues as mockVenues,
} from "@/lib/mock";

interface EventRow extends RowDataPacket {
  event_id: number;
  event_name: string;
  event_date: string;
  venue_id: number;
  category_id: number;
  organizer_id: number;
  admin_id: number;
  venue_name: string;
  location: string;
  capacity: number;
  category_name: string;
  organizer_name: string;
  contact: string;
}

interface ArtistJoinRow extends RowDataPacket {
  event_id: number;
  artist_id: number;
  artist_name: string;
  genre: string;
}

interface ReviewRow extends RowDataPacket {
  review_id: number;
  user_id: number;
  event_id: number;
  rating: number;
  comment: string;
  user_name: string;
}

interface SeatCountRow extends RowDataPacket {
  total: number;
  booked: number;
}

export interface EventFilters {
  search?: string;
  category_id?: number;
  city?: string;
  date_from?: string;
  date_to?: string;
  upcoming_only?: boolean;
}

function canUseDatabase() {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

function buildMockEvents() {
  const eventArtists: Record<number, typeof mockArtists> = {
    1: [],
    2: [mockArtists[0], mockArtists[3]],
    3: [mockArtists[2]],
    4: [mockArtists[1]],
    5: [mockArtists[4]],
  };

  return mockEvents.map((event) => ({
    ...event,
    venue: mockVenues.find((venue) => venue.venue_id === event.venue_id),
    category: mockCategories.find((category) => category.category_id === event.category_id),
    organizer: mockOrganizers.find((organizer) => organizer.organizer_id === event.organizer_id),
    artists: eventArtists[event.event_id] ?? [],
  }));
}

function filterMockEvents(filters: EventFilters = {}) {
  const today = new Date().toISOString().slice(0, 10);

  return buildMockEvents().filter((event) => {
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const haystack = [
        event.event_name,
        event.venue?.venue_name,
        event.venue?.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (filters.category_id && event.category_id !== filters.category_id) return false;
    if (filters.city && event.venue?.location !== filters.city) return false;
    if (filters.date_from && event.event_date < filters.date_from) return false;
    if (filters.date_to && event.event_date > filters.date_to) return false;
    if (filters.upcoming_only && event.event_date < today) return false;

    return true;
  });
}

function getMockEventDetails(eventId: number) {
  const event = buildMockEvents().find((candidate) => candidate.event_id === eventId);
  if (!event) return null;

  const venueSeats = mockSeats.filter((seat) => seat.venue_id === event.venue_id);
  const reviews = mockReviews.filter((review) => review.event_id === eventId);
  const bookedSeats = venueSeats.filter((seat) => seat.status === "booked").length;
  const totalSeats = venueSeats.length;

  return {
    ...event,
    reviews,
    totalSeats,
    bookedSeats,
    availableSeats: totalSeats - bookedSeats,
  };
}

/**
 * Fetch events with optional filtering. SQL builds a parameterised WHERE
 * clause based on which filters are present — this avoids the trap of building
 * filters in JS after a full table scan.
 */
export async function getEvents(filters: EventFilters = {}) {
  if (!canUseDatabase()) {
    return filterMockEvents(filters);
  }

  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    where.push("(e.event_name LIKE ? OR v.venue_name LIKE ? OR v.location LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }
  if (filters.category_id) {
    where.push("e.category_id = ?");
    params.push(filters.category_id);
  }
  if (filters.city) {
    where.push("v.location = ?");
    params.push(filters.city);
  }
  if (filters.date_from) {
    where.push("e.event_date >= ?");
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    where.push("e.event_date <= ?");
    params.push(filters.date_to);
  }
  if (filters.upcoming_only) {
    where.push("e.event_date >= CURDATE()");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows] = await db.query<EventRow[]>(
      `SELECT
         e.event_id, e.event_name, e.event_date, e.venue_id, e.category_id,
         e.organizer_id, e.admin_id,
         v.venue_name, v.location, v.capacity,
         c.category_name,
         o.name AS organizer_name, o.contact
       FROM Event e
       JOIN Venue v ON v.venue_id = e.venue_id
       JOIN Category c ON c.category_id = e.category_id
       JOIN Organizer o ON o.organizer_id = e.organizer_id
       ${whereSql}
       ORDER BY e.event_date ASC`,
      params,
    );

    if (rows.length === 0) return [];

    const eventIds = rows.map((r) => r.event_id);
    const placeholders = eventIds.map(() => "?").join(",");
    const [artists] = await db.query<ArtistJoinRow[]>(
      `SELECT ea.event_id, a.artist_id, a.artist_name, a.genre
       FROM Event_Artist ea
       JOIN Artist a ON a.artist_id = ea.artist_id
       WHERE ea.event_id IN (${placeholders})`,
      eventIds,
    );

    const artistMap: Record<number, ArtistJoinRow[]> = {};
    for (const a of artists) {
      (artistMap[a.event_id] ??= []).push(a);
    }

    return rows.map((r) => ({
      event_id: r.event_id,
      event_name: r.event_name,
      event_date: r.event_date,
      venue_id: r.venue_id,
      category_id: r.category_id,
      organizer_id: r.organizer_id,
      admin_id: r.admin_id,
      venue: {
        venue_id: r.venue_id,
        venue_name: r.venue_name,
        location: r.location,
        capacity: r.capacity,
      },
      category: { category_id: r.category_id, category_name: r.category_name },
      organizer: {
        organizer_id: r.organizer_id,
        name: r.organizer_name,
        contact: r.contact,
      },
      artists: (artistMap[r.event_id] ?? []).map((a) => ({
        artist_id: a.artist_id,
        artist_name: a.artist_name,
        genre: a.genre,
      })),
    }));
  } catch {
    return filterMockEvents(filters);
  }
}

export async function getEventById(eventId: number) {
  const all = await getEvents();
  return all.find((e) => e.event_id === eventId) ?? null;
}

export async function getEventDetails(eventId: number) {
  if (!canUseDatabase()) {
    return getMockEventDetails(eventId);
  }

  try {
    const event = await getEventById(eventId);
    if (!event) return null;

    const [reviewRows] = await db.query<ReviewRow[]>(
      `SELECT r.review_id, r.user_id, r.event_id, r.rating, r.comment, u.name AS user_name
       FROM Review r
       JOIN Users u ON u.user_id = r.user_id
       WHERE r.event_id = ?`,
      [eventId],
    );

    const reviews = reviewRows.map((r) => ({
      review_id: r.review_id,
      user_id: r.user_id,
      event_id: r.event_id,
      rating: r.rating,
      comment: r.comment,
      user: { name: r.user_name },
    }));

    const [[counts]] = await db.query<SeatCountRow[]>(
      `SELECT
         COUNT(s.seat_id) AS total,
         COUNT(t.ticket_id) AS booked
       FROM Seat s
       LEFT JOIN Ticket t ON t.seat_id = s.seat_id AND t.event_id = ?
       WHERE s.venue_id = ?`,
      [eventId, event.venue_id],
    );

    const totalSeats = Number(counts?.total ?? 0);
    const bookedSeats = Number(counts?.booked ?? 0);

    return {
      ...event,
      reviews,
      totalSeats,
      bookedSeats,
      availableSeats: totalSeats - bookedSeats,
    };
  } catch {
    return getMockEventDetails(eventId);
  }
}

/**
 * For filter UI: return all distinct cities and categories with counts.
 */
export async function getEventFacets() {
  interface CityRow extends RowDataPacket { location: string; count: number; }
  interface CatRow extends RowDataPacket { category_id: number; category_name: string; count: number; }

  if (!canUseDatabase()) {
    const events = filterMockEvents({ upcoming_only: true });
    const cityCounts = new Map<string, number>();
    const categoryCounts = new Map<number, { category_name: string; count: number }>();

    for (const event of events) {
      const city = event.venue?.location;
      if (city) {
        cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
      }

      if (event.category) {
        const current = categoryCounts.get(event.category.category_id);
        categoryCounts.set(event.category.category_id, {
          category_name: event.category.category_name,
          count: (current?.count ?? 0) + 1,
        });
      }
    }

    return {
      cities: [...cityCounts.entries()].map(([location, count]) => ({ location, count })),
      categories: [...categoryCounts.entries()].map(([category_id, value]) => ({
        category_id,
        category_name: value.category_name,
        count: value.count,
      })),
    };
  }

  try {
    const [cities] = await db.query<CityRow[]>(`
      SELECT v.location, COUNT(DISTINCT e.event_id) AS count
      FROM Venue v
      JOIN Event e ON e.venue_id = v.venue_id
      WHERE e.event_date >= CURDATE()
      GROUP BY v.location
      ORDER BY count DESC
    `);

    const [categories] = await db.query<CatRow[]>(`
      SELECT c.category_id, c.category_name, COUNT(DISTINCT e.event_id) AS count
      FROM Category c
      LEFT JOIN Event e ON e.category_id = c.category_id AND e.event_date >= CURDATE()
      GROUP BY c.category_id, c.category_name
      ORDER BY count DESC
    `);

    return {
      cities: cities.map((c) => ({ location: c.location, count: Number(c.count) })),
      categories: categories.map((c) => ({
        category_id: c.category_id,
        category_name: c.category_name,
        count: Number(c.count),
      })),
    };
  } catch {
    return getEventFacetsFromMock();
  }
}

async function getEventFacetsFromMock() {
  const events = filterMockEvents({ upcoming_only: true });
  const cityCounts = new Map<string, number>();
  const categoryCounts = new Map<number, { category_name: string; count: number }>();

  for (const event of events) {
    const city = event.venue?.location;
    if (city) {
      cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    }

    if (event.category) {
      const current = categoryCounts.get(event.category.category_id);
      categoryCounts.set(event.category.category_id, {
        category_name: event.category.category_name,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return {
    cities: [...cityCounts.entries()].map(([location, count]) => ({ location, count })),
    categories: [...categoryCounts.entries()].map(([category_id, value]) => ({
      category_id,
      category_name: value.category_name,
      count: value.count,
    })),
  };
}
