const db = require('../lib/db.ts').default;

// Configuration: target seats per venue (adjust to 30 or 40)
const TARGET_PER_VENUE = Number(process.env.TARGET_SEATS) || 40;

function generateSeatNumbers(startRow='A', rows=4, perRow=10) {
  const res = [];
  for (let r = 0; r < rows; r++) {
    const rowChar = String.fromCharCode(startRow.charCodeAt(0) + r);
    for (let n = 1; n <= perRow; n++) {
      res.push(`${rowChar}${n}`);
    }
  }
  return res;
}

(async function(){
  try{
    const [venues] = await db.query('SELECT venue_id, venue_name FROM Venue');
    console.log('Found venues:', venues.map(v=>v.venue_id));

    for (const venue of venues) {
      const venueId = venue.venue_id;
      const [existing] = await db.query('SELECT seat_id, seat_number FROM Seat WHERE venue_id = ?', [venueId]);
      const existingNumbers = new Set(existing.map(s=>s.seat_number));

      if (existing.length >= TARGET_PER_VENUE) {
        console.log(`Venue ${venueId} already has ${existing.length} seats — skipping.`);
        continue;
      }

      // Determine how many to add
      const toAdd = TARGET_PER_VENUE - existing.length;
      // Generate a bigger pool of candidate seat numbers (start at A, 10 per row)
      const rowsNeeded = Math.ceil(TARGET_PER_VENUE / 10);
      const candidate = generateSeatNumbers('A', rowsNeeded, 10);

      const insertValues = [];
      for (const seatNumber of candidate) {
        if (!existingNumbers.has(seatNumber)) {
          insertValues.push([seatNumber, venueId]);
          if (insertValues.length >= toAdd) break;
        }
      }

      if (insertValues.length === 0) {
        console.log(`No new seats to insert for venue ${venueId}`);
        continue;
      }

      // Bulk insert
      const placeholders = insertValues.map(()=> '(?, ?)').join(', ');
      const flat = insertValues.flat();
      const sql = `INSERT INTO Seat (seat_number, venue_id) VALUES ${placeholders}`;
      const [result] = await db.query(sql, flat);
      console.log(`Inserted ${insertValues.length} seats for venue ${venueId} (insertId ${result.insertId})`);
    }

    await db.end();
    console.log('Done');
  }catch(e){
    console.error('Error adding seats', e);
    process.exit(1);
  }
})();