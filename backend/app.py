from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Database configuration
db_config = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'e20211081',
    'database': 'gym_management',
    'port': 3306
}

def create_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        logger.error(f"Error connecting to MySQL: {e}")
        return None

# Initialize database tables
def init_db():
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            
            # Create members table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS members (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    phone VARCHAR(20),
                    dob DATE,
                    join_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create trainers table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trainers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    specialty VARCHAR(100),
                    experience INT,
                    schedule TEXT,
                    rating FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            
            # Create payments table (simplified)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    member_id BIGINT,
                    amount DECIMAL(10,2) NOT NULL,
                    payment_method VARCHAR(50),
                    items TEXT,
                    promo_used VARCHAR(100),
                    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create feedback table (simplified)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS feedback (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    trainer_name VARCHAR(100),
                    member_id BIGINT,
                    rating INT NOT NULL,
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create contacts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    subject VARCHAR(255),
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create bookings table (simplified)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    member_id BIGINT,
                    workout_name VARCHAR(100) NOT NULL,
                    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert sample trainers if table is empty
            cursor.execute("SELECT COUNT(*) FROM trainers")
            if cursor.fetchone()[0] == 0:
                sample_trainers = [
                    ("Bun Ratnatepy", "bunratnatepy@gmail.com", "Yoga", 2),
                    ("Chhin Visal", "chhinvisal@gmail.com", "Cardio & Weight Loss", 8),
                    ("HAYSAVIN RONGRAVIDWIN", "winwin@gmail.com", "Strength Training", 5),
                    ("HOUN Sithai", "sithai@example.com", "Pilates", 1)
                ]
                cursor.executemany(
                    "INSERT INTO trainers (name, email, specialty, experience) VALUES (%s, %s, %s, %s)",
                    sample_trainers
                )
            
            connection.commit()
            logger.info("Database tables initialized successfully")
            
    except Error as e:
        logger.error(f"Error initializing database: {e}")
    finally:
        if connection:
            connection.close()

# API Routes
@app.route('/getData/<table_name>', methods=['GET'])
def get_all_data(table_name):
    valid_tables = ['members', 'trainers', 'payments', 'feedback', 'contacts', 'bookings']
    if table_name not in valid_tables:
        return jsonify({'error': 'Invalid table name'}), 400
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(f"SELECT * FROM {table_name}")
            results = cursor.fetchall()
            return jsonify(results)
    except Error as e:
        logger.error(f"Error fetching data from {table_name}: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/getData/<table_name>/<int:id>', methods=['GET'])
def get_specific_data(table_name, id):
    valid_tables = ['members', 'trainers', 'workouts', 'shop_items', 'payments', 'feedback', 'contacts', 'bookings']
    if table_name not in valid_tables:
        return jsonify({'error': 'Invalid table name'}), 400
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(f"SELECT * FROM {table_name} WHERE id = %s", (id,))
            result = cursor.fetchone()
            if result:
                return jsonify(result)
            else:
                return jsonify({'error': 'Record not found'}), 404
    except Error as e:
        logger.error(f"Error fetching record {id} from {table_name}: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Member registration endpoint
@app.route('/register', methods=['POST'])
def register_member():
    data = request.json
    required_fields = ['name', 'email', 'password', 'phone', 'dob']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            query = """
                INSERT INTO members (name, email, password, phone, dob, join_date)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (
                data['name'],
                data['email'],
                data['password'],
                data['phone'],
                data['dob'],
                datetime.now().date()
            )
            cursor.execute(query, values)
            connection.commit()
            return jsonify({
                'message': 'Member registered successfully',
                'id': cursor.lastrowid,
                'name': data['name'],
                'email': data['email']
            }), 201
    except Error as e:
        logger.error(f"Error registering member: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Contact form endpoint
@app.route('/contact', methods=['POST'])
def submit_contact():
    data = request.json
    required_fields = ['name', 'email', 'subject', 'message']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            query = """
                INSERT INTO contacts (name, email, subject, message)
                VALUES (%s, %s, %s, %s)
            """
            values = (
                data['name'],
                data['email'],
                data['subject'],
                data['message']
            )
            cursor.execute(query, values)
            connection.commit()
            return jsonify({'message': 'Thank you for your message! We will get back to you soon.'}), 201
    except Error as e:
        logger.error(f"Error submitting contact form: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, name, email 
                FROM members 
                WHERE email = %s AND password = %s
            """, (data['email'], data['password']))
            member = cursor.fetchone()
            if member:
                return jsonify({
                    'message': 'Login successful',
                    'member': member
                })
            else:
                return jsonify({'error': 'Invalid email or password'}), 401
    except Error as e:
        logger.error(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Payment endpoint (simplified)
@app.route('/payment', methods=['POST'])
def process_payment():
    data = request.json
    logger.debug(f"Payment data: {data}")
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            
            # Process payment without member validation
            items_json = json.dumps(data.get('items', []))
            query = """
                INSERT INTO payments (
                    member_id, amount, payment_method, items, promo_used
                ) VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                data.get('member_id'),
                float(data.get('total_amount', 0)),
                data.get('payment_method', 'cash'),
                items_json,
                data.get('promo_used', 'None')
            ))
            connection.commit()
            
            return jsonify({
                'message': 'Payment processed successfully',
                'payment_id': cursor.lastrowid
            }), 201
            
    except Exception as e:
        logger.error(f"Payment error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Feedback endpoint (simplified)
@app.route('/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    logger.debug(f"Feedback data: {data}")
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            
            # Submit feedback without member/trainer validation
            cursor.execute("""
                INSERT INTO feedback (trainer_name, member_id, rating, comment)
                VALUES (%s, %s, %s, %s)
            """, (
                data.get('trainer_name'),
                data.get('member_id'),
                int(data.get('rating', 0)),
                data.get('comment', '')
            ))
            connection.commit()
            
            return jsonify({
                'message': 'Feedback submitted successfully',
                'feedback_id': cursor.lastrowid
            }), 201
                
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Booking endpoint (simplified)
@app.route('/bookings', methods=['POST'])
def create_booking():
    data = request.json
    logger.debug(f"Booking data: {data}")
    
    try:
        connection = create_connection()
        if connection:
            cursor = connection.cursor()
            
            # Create booking without member validation
            cursor.execute("""
                INSERT INTO bookings (member_id, workout_name)
                VALUES (%s, %s)
            """, (data.get('member_id'), data.get('workout_name')))
            connection.commit()
            
            return jsonify({
                'message': 'Booking created successfully',
                'booking_id': cursor.lastrowid
            }), 201
            
    except Exception as e:
        logger.error(f"Booking error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

# Logout endpoint
@app.route('/logout', methods=['POST'])
def logout():
    # This is just for tracking if you want to log logouts
    return jsonify({'message': 'Logged out successfully'}), 200

if __name__ == '__main__':
    init_db()  # Initialize database tables
    app.run(port=5002, debug=True)