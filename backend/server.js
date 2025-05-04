const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // XAMPP default is empty password
  database: 'gym_management',
  port: 3307
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Initialize database tables
function initDatabase() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      dob DATE,
      join_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS trainers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      specialty VARCHAR(100),
      experience INT,
      schedule TEXT,
      rating FLOAT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id BIGINT,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50),
      items TEXT,
      promo_used VARCHAR(100),
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trainer_name VARCHAR(100),
      member_id BIGINT,
      rating INT NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      subject VARCHAR(255),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id BIGINT,
      workout_name VARCHAR(100) NOT NULL,
      booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  queries.forEach((query, index) => {
    db.query(query, (err) => {
      if (err) {
        console.error(`Error creating table ${index + 1}:`, err);
      }
    });
  });

  // Insert sample trainers if table is empty
  db.query("SELECT COUNT(*) as count FROM trainers", (err, results) => {
    if (err) {
      console.error("Error checking trainers table:", err);
      return;
    }
    
    if (results[0].count === 0) {
      const sampleTrainers = [
        ["Bun Ratnatepy", "bunratnatepy@gmail.com", "Yoga", 2],
        ["Chhin Visal", "chhinvisal@gmail.com", "Cardio & Weight Loss", 8],
        ["HAYSAVIN RONGRAVIDWIN", "winwin@gmail.com", "Strength Training", 5],
        ["HOUN Sithai", "sithai@example.com", "Pilates", 1]
      ];
      
      sampleTrainers.forEach(trainer => {
        db.query(
          "INSERT INTO trainers (name, email, specialty, experience) VALUES (?, ?, ?, ?)",
          trainer,
          (err) => {
            if (err) console.error("Error inserting trainer:", err);
          }
        );
      });
    }
  });
}

// Initialize database on startup
initDatabase();

// API Routes

// Get all data from a table
app.get('/getData/:tableName', (req, res) => {
  const validTables = ['members', 'trainers', 'payments', 'feedback', 'contacts', 'bookings'];
  const tableName = req.params.tableName;
  
  if (!validTables.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  db.query(`SELECT * FROM ${tableName}`, (err, results) => {
    if (err) {
      console.error(`Error fetching data from ${tableName}:`, err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Get specific record by ID
app.get('/getData/:tableName/:id', (req, res) => {
  const validTables = ['members', 'trainers', 'payments', 'feedback', 'contacts', 'bookings'];
  const { tableName, id } = req.params;
  
  if (!validTables.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, results) => {
    if (err) {
      console.error(`Error fetching record ${id} from ${tableName}:`, err);
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(results[0]);
  });
});

// Member registration
app.post('/register', (req, res) => {
  const { name, email, password, phone, dob } = req.body;
  
  if (!name || !email || !password || !phone || !dob) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const joinDate = new Date().toISOString().split('T')[0];
  
  db.query(
    "INSERT INTO members (name, email, password, phone, dob, join_date) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email, password, phone, dob, joinDate],
    (err, results) => {
      if (err) {
        console.error("Error registering member:", err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Member registered successfully',
        id: results.insertId,
        name,
        email
      });
    }
  );
});

// Contact form submission
app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.query(
    "INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)",
    [name, email, subject, message],
    (err, results) => {
      if (err) {
        console.error("Error submitting contact form:", err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({ 
        message: 'Thank you for your message! We will get back to you soon.' 
      });
    }
  );
});

// Member login
// server.js - update the login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  db.query(
    "SELECT id, name, email FROM members WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
      if (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      res.json({
        message: 'Login successful',
        member: results[0]
      });
    }
  );
});

// Process payment
app.post('/payment', (req, res) => {
  const { member_id, items, total_amount, payment_method, promo_used } = req.body;
  
  if (!items || !total_amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const itemsJson = JSON.stringify(items);
  
  db.query(
    "INSERT INTO payments (member_id, amount, payment_method, items, promo_used) VALUES (?, ?, ?, ?, ?)",
    [member_id, total_amount, payment_method || 'cash', itemsJson, promo_used || 'None'],
    (err, results) => {
      if (err) {
        console.error("Payment error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Payment processed successfully',
        payment_id: results.insertId
      });
    }
  );
});

// Submit feedback
app.post('/feedback', (req, res) => {
  const { trainer_name, member_id, rating, comment } = req.body;
  
  if (!trainer_name || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.query(
    "INSERT INTO feedback (trainer_name, member_id, rating, comment) VALUES (?, ?, ?, ?)",
    [trainer_name, member_id, rating, comment || ''],
    (err, results) => {
      if (err) {
        console.error("Feedback error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Feedback submitted successfully',
        feedback_id: results.insertId
      });
    }
  );
});

// Create booking
app.post('/bookings', (req, res) => {
  const { member_id, workout_name } = req.body;
  
  if (!workout_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.query(
    "INSERT INTO bookings (member_id, workout_name) VALUES (?, ?)",
    [member_id, workout_name],
    (err, results) => {
      if (err) {
        console.error("Booking error:", err);
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Booking created successfully',
        booking_id: results.insertId
      });
    }
  );
});





// Additional API endpoints for admin panel

// Update member
app.put('/updateMember/:id', (req, res) => {
  const memberId = req.params.id;
  const memberData = req.body;
  
  db.query(
      "UPDATE members SET name = ?, email = ?, phone = ?, dob = ?, join_date = ?, status = ? WHERE id = ?",
      [
          memberData.name,
          memberData.email,
          memberData.phone,
          memberData.dob,
          memberData.join_date,
          memberData.status,
          memberId
      ],
      (err, results) => {
          if (err) {
              console.error("Error updating member:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Member updated successfully',
              id: memberId
          });
      }
  );
});

// Delete member
app.delete('/deleteMember/:id', (req, res) => {
  const memberId = req.params.id;
  
  db.query(
      "DELETE FROM members WHERE id = ?",
      [memberId],
      (err, results) => {
          if (err) {
              console.error("Error deleting member:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Member deleted successfully',
              id: memberId
          });
      }
  );
});

// Add trainer
app.post('/addTrainer', (req, res) => {
  const { name, email, specialty, experience, schedule, status, bio } = req.body;
  
  db.query(
      "INSERT INTO trainers (name, email, specialty, experience, schedule, status, bio) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, specialty, experience, schedule, status, bio],
      (err, results) => {
          if (err) {
              console.error("Error adding trainer:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
              message: 'Trainer added successfully',
              id: results.insertId
          });
      }
  );
});

// Update trainer
app.put('/updateTrainer/:id', (req, res) => {
  const trainerId = req.params.id;
  const trainerData = req.body;
  
  db.query(
      "UPDATE trainers SET name = ?, email = ?, specialty = ?, experience = ?, schedule = ?, status = ?, bio = ? WHERE id = ?",
      [
          trainerData.name,
          trainerData.email,
          trainerData.specialty,
          trainerData.experience,
          trainerData.schedule,
          trainerData.status,
          trainerData.bio,
          trainerId
      ],
      (err, results) => {
          if (err) {
              console.error("Error updating trainer:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Trainer updated successfully',
              id: trainerId
          });
      }
  );
});

// Delete trainer
app.delete('/deleteTrainer/:id', (req, res) => {
  const trainerId = req.params.id;
  
  db.query(
      "DELETE FROM trainers WHERE id = ?",
      [trainerId],
      (err, results) => {
          if (err) {
              console.error("Error deleting trainer:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Trainer deleted successfully',
              id: trainerId
          });
      }
  );
});

// Refund payment
app.post('/refundPayment/:id', (req, res) => {
  const paymentId = req.params.id;
  
  // In a real app, you would process the refund with the payment provider
  // For demo purposes, we'll just mark it as refunded in the database
  
  db.query(
      "UPDATE payments SET status = 'refunded' WHERE id = ?",
      [paymentId],
      (err, results) => {
          if (err) {
              console.error("Error refunding payment:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Payment refunded successfully',
              id: paymentId
          });
      }
  );
});

// Cancel booking
app.put('/cancelBooking/:id', (req, res) => {
  const bookingId = req.params.id;
  
  db.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [bookingId],
      (err, results) => {
          if (err) {
              console.error("Error cancelling booking:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Booking cancelled successfully',
              id: bookingId
          });
      }
  );
});

// Delete feedback
app.delete('/deleteFeedback/:id', (req, res) => {
  const feedbackId = req.params.id;
  
  db.query(
      "DELETE FROM feedback WHERE id = ?",
      [feedbackId],
      (err, results) => {
          if (err) {
              console.error("Error deleting feedback:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Feedback deleted successfully',
              id: feedbackId
          });
      }
  );
});

// Mark contact as read
app.put('/markContactRead/:id', (req, res) => {
  const contactId = req.params.id;
  
  db.query(
      "UPDATE contacts SET read = true WHERE id = ?",
      [contactId],
      (err, results) => {
          if (err) {
              console.error("Error marking contact as read:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Contact marked as read',
              id: contactId
          });
      }
  );
});

// Mark contact as replied
app.put('/markContactReplied/:id', (req, res) => {
  const contactId = req.params.id;
  
  db.query(
      "UPDATE contacts SET replied = true WHERE id = ?",
      [contactId],
      (err, results) => {
          if (err) {
              console.error("Error marking contact as replied:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Contact marked as replied',
              id: contactId
          });
      }
  );
});

// Delete contact
app.delete('/deleteContact/:id', (req, res) => {
  const contactId = req.params.id;
  
  db.query(
      "DELETE FROM contacts WHERE id = ?",
      [contactId],
      (err, results) => {
          if (err) {
              console.error("Error deleting contact:", err);
              return res.status(500).json({ error: err.message });
          }
          
          res.json({
              message: 'Contact deleted successfully',
              id: contactId
          });
      }
  );
});


// Start the server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});