const mysql = require('mysql2/promise');

(async function(){
  try{
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || process.env.USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ticket_booking_system',
      waitForConnections: true,
      connectionLimit: 5,
    });

    const [bookings] = await pool.query('SELECT booking_id, user_id, event_id, booking_date FROM Booking ORDER BY booking_id DESC LIMIT 10');
    console.log('Recent bookings:', bookings);

    const [tickets] = await pool.query('SELECT ticket_id, booking_id, seat_id, event_id FROM Ticket ORDER BY ticket_id DESC LIMIT 20');
    console.log('Recent tickets:', tickets);

    const [seats] = await pool.query('SELECT seat_id, seat_number, venue_id FROM Seat ORDER BY seat_id LIMIT 50');
    console.log('Some seats:', seats.slice(0,50));

    // find first seat for event 1 that's not in Ticket for event 1
    const seatIds = seats.map(s=>s.seat_id);
    const [booked] = await pool.query('SELECT DISTINCT seat_id FROM Ticket WHERE event_id = ?', [1]);
    const bookedSet = new Set(booked.map(b=>b.seat_id));
    const freeSeat = seatIds.find(id => !bookedSet.has(id));
    console.log('First free seat_id for event 1:', freeSeat);

    await pool.end();
  }catch(e){
    console.error('DB inspect error', e);
    process.exit(1);
  }
})();