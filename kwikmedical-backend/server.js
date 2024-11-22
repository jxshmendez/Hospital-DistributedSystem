const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Endpoint to retrieve patient information by NHS number
app.get('/api/patient/:nhsNumber', (req, res) => {
  const nhsNumber = req.params.nhsNumber;
  const query = `SELECT * FROM patients WHERE nhsNumber = ?`;
  db.get(query, [nhsNumber], (err, row) => {
    if (err) {
      console.error('Error fetching patient data:', err.message);
      return res.status(500).json({ message: 'Failed to retrieve patient data.' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Patient not found.' });
    }
    res.status(200).json(row);
  });
});

// Endpoint to retrieve all patients
app.get('/api/patients', (req, res) => {
  const query = `SELECT nhsNumber, name, address, medicalHistory FROM patients ORDER BY name ASC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching patients:', err.message);
      return res.status(500).json({ message: 'Failed to retrieve patients.' });
    }
    res.status(200).json(rows);
  });
});

// Endpoint to add a new patient
app.post('/api/patients', (req, res) => {
  const { nhsNumber, name, address, medicalHistory } = req.body;

  // Log the request for debugging
  console.log('Add patient request:', { nhsNumber, name, address, medicalHistory });

  const query = `INSERT INTO patients (nhsNumber, name, address, medicalHistory) VALUES (?, ?, ?, ?)`;

  db.run(query, [nhsNumber, name, address, medicalHistory || ''], function (err) {
    if (err) {
      if (err.message.includes('SQLITE_CONSTRAINT')) {
        console.error('Duplicate NHS Number error:', err.message);
        return res.status(400).json({ message: 'NHS Number must be unique.' });
      }
      console.error('Error inserting patient:', err.message);
      return res.status(500).json({ message: 'Failed to add patient.' });
    }

    console.log('Patient added successfully:', { nhsNumber, name, address, medicalHistory });
    res.status(200).json({ message: 'Patient added successfully.' });
  });
});


// Endpoint to update patient details
app.put('/api/patients/:nhsNumber', (req, res) => {
  const { nhsNumber } = req.params;
  const { name, address, medicalHistory } = req.body;

  console.log('Update request:', { nhsNumber, name, address, medicalHistory });

  const query = `
    UPDATE patients
    SET name = ?, address = ?, medicalHistory = ?
    WHERE nhsNumber = ?
  `;

  db.run(query, [name, address, medicalHistory, nhsNumber], function (err) {
    if (err) {
      console.error('Error updating patient details:', err.message);
      return res.status(500).json({ message: 'Failed to update patient details.' });
    }
    console.log('Changes:', this.changes);
    if (this.changes === 0) {
      console.warn(`No patient found with NHS Number: ${nhsNumber}`);
      return res.status(404).json({ message: 'Patient not found.' });
    }
    res.status(200).json({ message: 'Patient details updated successfully.' });
  });
});

// Endpoint to delete a patient by NHS number
app.delete('/api/patients/:nhsNumber', (req, res) => {
  const { nhsNumber } = req.params;

  console.log(`Delete request for NHS Number: ${nhsNumber}`);

  const query = `DELETE FROM patients WHERE nhsNumber = ?`;

  db.run(query, [nhsNumber], function (err) {
    if (err) {
      console.error('Error deleting patient:', err.message);
      return res.status(500).json({ message: 'Failed to delete patient.' });
    }
    if (this.changes === 0) {
      console.warn(`No patient found with NHS Number: ${nhsNumber}`);
      return res.status(404).json({ message: 'Patient not found.' });
    }
    res.status(200).json({ message: 'Patient deleted successfully.' });
  });
});

// Endpoint to handle dispatch request without GPS data
app.post('/api/dispatch', (req, res) => {
  const { nhsNumber, condition, patientName, patientAddress, medicalHistory } = req.body;
  const timestamp = new Date().toISOString();

  const query = `INSERT INTO dispatches (patientId, condition, timestamp, patientName, patientAddress, medicalHistory, completed)
                 VALUES (?, ?, ?, ?, ?, ?, 0)`;

  db.run(query, [nhsNumber, condition, timestamp, patientName, patientAddress, medicalHistory], function (err) {
    if (err) {
      console.error("Error inserting dispatch:", err.message);
      return res.status(500).json({ message: "Failed to process dispatch request." });
    }
    res.status(200).json({ message: "Dispatch request processed successfully" });
  });
});

// Endpoint to accept a dispatch
app.put('/api/dispatch/:id/accept', (req, res) => {
  const dispatchId = req.params.id;
  const { ambulanceId } = req.body;

  const query = `UPDATE dispatches SET ambulanceId = ? WHERE id = ? AND ambulanceId IS NULL`;
  db.run(query, [ambulanceId, dispatchId], function (err) {
    if (err) {
      console.error('Error accepting dispatch:', err.message);
      return res.status(500).json({ message: 'Failed to accept dispatch.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Dispatch not found or already accepted.' });
    }
    res.status(200).json({ message: 'Dispatch accepted successfully' });
  });
});

// Endpoint to mark a dispatch as completed
app.put('/api/dispatch/:id/complete', (req, res) => {
  const dispatchId = req.params.id;
  const completionTime = new Date().toISOString();

  const query = `UPDATE dispatches SET completed = 1, completionTime = ? WHERE id = ?`;
  db.run(query, [completionTime, dispatchId], function (err) {
    if (err) {
      console.error('Error completing dispatch:', err.message);
      return res.status(500).json({ message: 'Failed to complete dispatch.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Dispatch not found or already completed.' });
    }
    res.status(200).json({ message: 'Dispatch marked as completed successfully.' });
  });
});

// Endpoint to get all dispatch history
app.get('/api/dispatches', (req, res) => {
  const query = `
    SELECT id, patientId, patientName, condition, patientAddress, timestamp, medicalHistory, ambulanceId, completed, completionTime
    FROM dispatches
    ORDER BY timestamp DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching dispatch history:', err.message);
      return res.status(500).json({ message: 'Failed to retrieve dispatch history.' });
    }
    res.status(200).json(rows);
  });
});

// Endpoint to get active and completed dispatches for a specific hospital
app.get('/api/hospital/dispatches', (req, res) => {
  const activeQuery = `
    SELECT id, patientName, condition, timestamp, ambulanceId, completed
    FROM dispatches
    WHERE completed = 0
    ORDER BY timestamp DESC
  `;

  const completedQuery = `
    SELECT id, patientName, condition, timestamp, ambulanceId, completed, completionTime
    FROM dispatches
    WHERE completed = 1
    ORDER BY completionTime DESC
  `;

  db.all(activeQuery, [], (err, activeRows) => {
    if (err) {
      console.error('Error fetching active dispatches:', err.message);
      return res.status(500).json({ message: 'Failed to retrieve active dispatches.' });
    }

    db.all(completedQuery, [], (err, completedRows) => {
      if (err) {
        console.error('Error fetching completed dispatches:', err.message);
        return res.status(500).json({ message: 'Failed to retrieve completed dispatches.' });
      }

      res.status(200).json({
        activeDispatches: activeRows,
        completedDispatches: completedRows,
      });
    });
  });
});

// Endpoint to get details of a specific dispatch by ID
app.get('/api/dispatch/:id', (req, res) => {
  const dispatchId = req.params.id;
  const query = `SELECT * FROM dispatches WHERE id = ?`;
  db.get(query, [dispatchId], (err, row) => {
    if (err) {
      console.error('Error fetching dispatch details:', err.message);
      return res.status(500).json({ message: 'Failed to retrieve dispatch details.' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Dispatch not found.' });
    }
    res.status(200).json(row);
  });
});

// Start the server after all routes are defined
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
