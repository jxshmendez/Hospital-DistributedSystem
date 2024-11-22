const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the SQLite database file
const dbPath = path.resolve(__dirname, 'kwikmedical.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    // Create the dispatches table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS dispatches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId TEXT NOT NULL,
        condition TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        patientName TEXT NOT NULL,
        patientAddress TEXT NOT NULL,
        medicalHistory TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        ambulanceId TEXT,
        completionTime TEXT
      )`,
      (err) => {
        if (err) {
          console.error('Error creating dispatches table:', err.message);
        } else {
          console.log('Dispatches table created or already exists.');

          // Check and add the missing columns if they don't exist
          db.all(`PRAGMA table_info(dispatches);`, (err, info) => {
            if (err) {
              console.error('Error fetching table info:', err.message);
            } else {
              const existingColumns = info.map((column) => column.name);

              // Add "ambulanceId" column if it doesn't exist
              if (!existingColumns.includes('ambulanceId')) {
                db.run(
                  `ALTER TABLE dispatches ADD COLUMN ambulanceId TEXT`,
                  (alterErr) => {
                    if (alterErr) {
                      console.error('Error adding ambulanceId column:', alterErr.message);
                    } else {
                      console.log('ambulanceId column added to dispatches table.');
                    }
                  }
                );
              }

              // TODO - Add completionTime column if it doesn't exist
              if (!existingColumns.includes('completionTime')) {
                db.run(
                  `ALTER TABLE dispatches ADD COLUMN completionTime TEXT`,
                  (alterErr) => {
                    if (alterErr) {
                      console.error('Error adding completionTime column:', alterErr.message);
                    } else {
                      console.log('completionTime column added to dispatches table.');
                    }
                  }
                );
              }
            }
          });
        }
      }
    );

    // Create the patients table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS patients (
        nhsNumber TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        medicalHistory TEXT
      )`,
      (err) => {
        if (err) {
          console.error('Error creating patients table:', err.message);
        } else {
          console.log('Patients table created or already exists.');
        }
      }
    );
  }
});

module.exports = db;
