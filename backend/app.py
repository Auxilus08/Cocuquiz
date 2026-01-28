"""
DBMS Quiz Flashcards - Flask Backend Application
"""

import os
import json
import logging
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

from srs import SM2Algorithm
from question_bank import get_all_questions, get_categories as get_question_categories

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'])

DATABASE = 'quiz.db'


def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            streak INTEGER DEFAULT 0,
            last_review_date DATE
        )
    ''')
    
    # Questions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            answer TEXT NOT NULL,
            explanation TEXT,
            category TEXT DEFAULT 'General',
            subject TEXT DEFAULT 'DBMS',
            difficulty TEXT DEFAULT 'medium'
        )
    ''')
    
    # User progress table for SRS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            ease_factor REAL DEFAULT 2.5,
            interval INTEGER DEFAULT 1,
            repetitions INTEGER DEFAULT 0,
            next_review_date TIMESTAMP,
            last_review_date TIMESTAMP,
            review_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (question_id) REFERENCES questions(id),
            UNIQUE(user_id, question_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")


def login_required(f):
    """Decorator for routes that require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


# ============== Auth Routes ==============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if username exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create user
        password_hash = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        # Auto login
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({
            'message': 'Registration successful',
            'user': {'id': user_id, 'username': username}
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login."""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, password_hash FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        session['user_id'] = user['id']
        session['username'] = user['username']
        
        return jsonify({
            'message': 'Login successful',
            'user': {'id': user['id'], 'username': user['username']}
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """User logout."""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current user info."""
    if 'user_id' not in session:
        return jsonify({'user': None})
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, username, streak, last_review_date FROM users WHERE id = ?',
            (session['user_id'],)
        )
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'streak': user['streak'] or 0
                }
            })
        return jsonify({'user': None})
        
    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({'user': None})


# ============== Questions Routes ==============

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get all questions."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM questions')
        questions = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'questions': [dict(q) for q in questions],
            'count': len(questions)
        })
        
    except Exception as e:
        logger.error(f"Get questions error: {e}")
        return jsonify({'error': 'Failed to fetch questions'}), 500


@app.route('/api/questions/categories', methods=['GET'])
def get_categories():
    """Get all categories with question counts, optionally filtered by subject."""
    try:
        subject = request.args.get('subject', None)
        conn = get_db()
        cursor = conn.cursor()
        
        if subject:
            cursor.execute('''
                SELECT category, COUNT(*) as count 
                FROM questions 
                WHERE subject = ?
                GROUP BY category 
                ORDER BY category
            ''', (subject,))
        else:
            cursor.execute('''
                SELECT category, COUNT(*) as count 
                FROM questions 
                GROUP BY category 
                ORDER BY category
            ''')
        categories = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'categories': [{'name': c['category'], 'count': c['count']} for c in categories]
        })
        
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """Get all subjects with question counts and difficulty breakdown."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get subjects with counts
        cursor.execute('''
            SELECT subject, COUNT(*) as count 
            FROM questions 
            GROUP BY subject 
            ORDER BY subject
        ''')
        subjects = cursor.fetchall()
        
        # Get difficulty breakdown per subject
        cursor.execute('''
            SELECT subject, difficulty, COUNT(*) as count 
            FROM questions 
            GROUP BY subject, difficulty
        ''')
        difficulty_breakdown = cursor.fetchall()
        conn.close()
        
        # Build response
        subject_data = {}
        for s in subjects:
            subject_data[s['subject']] = {
                'name': s['subject'],
                'total': s['count'],
                'easy': 0,
                'medium': 0,
                'hard': 0
            }
        
        for d in difficulty_breakdown:
            if d['subject'] in subject_data:
                subject_data[d['subject']][d['difficulty']] = d['count']
        
        return jsonify({
            'subjects': list(subject_data.values())
        })
        
    except Exception as e:
        logger.error(f"Get subjects error: {e}")
        return jsonify({'error': 'Failed to fetch subjects'}), 500


@app.route('/api/questions/difficulty', methods=['GET'])
def get_difficulty_stats():
    """Get question counts by difficulty."""
    try:
        subject = request.args.get('subject', None)
        conn = get_db()
        cursor = conn.cursor()
        
        if subject:
            cursor.execute('''
                SELECT difficulty, COUNT(*) as count 
                FROM questions 
                WHERE subject = ?
                GROUP BY difficulty
            ''', (subject,))
        else:
            cursor.execute('''
                SELECT difficulty, COUNT(*) as count 
                FROM questions 
                GROUP BY difficulty
            ''')
        stats = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'difficulty': {s['difficulty']: s['count'] for s in stats}
        })
        
    except Exception as e:
        logger.error(f"Get difficulty stats error: {e}")
        return jsonify({'error': 'Failed to fetch difficulty stats'}), 500


# ============== SRS/Review Routes ==============

@app.route('/api/due-cards/<int:user_id>', methods=['GET'])
@login_required
def get_due_cards(user_id):
    """Get cards due for review with optional filtering."""
    if session['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    limit = request.args.get('limit', 20, type=int)
    category = request.args.get('category', None)
    subject = request.args.get('subject', None)
    difficulty = request.args.get('difficulty', None)
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        # Build dynamic query based on filters
        base_query = '''
            SELECT q.*, up.ease_factor, up.interval, up.repetitions, up.next_review_date
            FROM questions q
            LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
            WHERE (up.next_review_date IS NULL OR up.next_review_date <= ?)
        '''
        params = [user_id, now]
        
        if subject:
            base_query += ' AND q.subject = ?'
            params.append(subject)
        if category:
            base_query += ' AND q.category = ?'
            params.append(category)
        if difficulty:
            base_query += ' AND q.difficulty = ?'
            params.append(difficulty)
        
        base_query += ' ORDER BY up.next_review_date ASC NULLS FIRST LIMIT ?'
        params.append(limit)
        
        cursor.execute(base_query, params)
        cards = cursor.fetchall()
        
        # Get total due count with same filters
        count_query = '''
            SELECT COUNT(*) as count FROM questions q
            LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
            WHERE (up.next_review_date IS NULL OR up.next_review_date <= ?)
        '''
        count_params = [user_id, now]
        
        if subject:
            count_query += ' AND q.subject = ?'
            count_params.append(subject)
        if category:
            count_query += ' AND q.category = ?'
            count_params.append(category)
        if difficulty:
            count_query += ' AND q.difficulty = ?'
            count_params.append(difficulty)
        
        cursor.execute(count_query, count_params)
        total_due = cursor.fetchone()['count']
        
        conn.close()
        
        result = []
        for card in cards:
            card_dict = dict(card)
            card_dict['options'] = json.loads(card_dict['options']) if isinstance(card_dict['options'], str) else card_dict['options']
            
            # Add button intervals preview
            ease = card_dict.get('ease_factor') or SM2Algorithm.DEFAULT_EASE_FACTOR
            interval = card_dict.get('interval') or SM2Algorithm.DEFAULT_INTERVAL
            reps = card_dict.get('repetitions') or 0
            
            intervals = SM2Algorithm.get_button_intervals(interval, ease, reps)
            card_dict['button_intervals'] = {
                k: SM2Algorithm.format_interval(v) for k, v in intervals.items()
            }
            result.append(card_dict)
        
        return jsonify({
            'cards': result,
            'total_due': total_due
        })
        
    except Exception as e:
        logger.error(f"Get due cards error: {e}")
        return jsonify({'error': 'Failed to fetch due cards'}), 500


@app.route('/api/submit-review', methods=['POST'])
@login_required
def submit_review():
    """Submit a card review and update SRS stats."""
    data = request.json
    user_id = session['user_id']
    question_id = data.get('question_id')
    rating = data.get('rating', 'good')  # again, hard, good, easy
    
    if not question_id:
        return jsonify({'error': 'Question ID required'}), 400
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current progress
        cursor.execute('''
            SELECT ease_factor, interval, repetitions 
            FROM user_progress 
            WHERE user_id = ? AND question_id = ?
        ''', (user_id, question_id))
        progress = cursor.fetchone()
        
        if progress:
            ease = progress['ease_factor']
            interval = progress['interval']
            repetitions = progress['repetitions']
        else:
            ease = SM2Algorithm.DEFAULT_EASE_FACTOR
            interval = SM2Algorithm.DEFAULT_INTERVAL
            repetitions = 0
        
        # Calculate new values
        quality = SM2Algorithm.map_button_to_quality(rating)
        new_ease, new_interval, next_review, new_reps = SM2Algorithm.process_review(
            ease, interval, quality, repetitions
        )
        
        # Update or insert progress
        cursor.execute('''
            INSERT INTO user_progress (user_id, question_id, ease_factor, interval, 
                                        repetitions, next_review_date, last_review_date, review_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(user_id, question_id) DO UPDATE SET
                ease_factor = ?,
                interval = ?,
                repetitions = ?,
                next_review_date = ?,
                last_review_date = ?,
                review_count = review_count + 1
        ''', (user_id, question_id, new_ease, new_interval, new_reps, 
              next_review.isoformat(), datetime.now().isoformat(),
              new_ease, new_interval, new_reps, next_review.isoformat(), datetime.now().isoformat()))
        
        # Update user streak
        today = datetime.now().date()
        cursor.execute('SELECT last_review_date, streak FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if user:
            last_review = user['last_review_date']
            streak = user['streak'] or 0
            
            if last_review:
                last_date = datetime.fromisoformat(last_review).date() if isinstance(last_review, str) else last_review
                if (today - last_date).days == 1:
                    streak += 1
                elif (today - last_date).days > 1:
                    streak = 1
            else:
                streak = 1
            
            cursor.execute(
                'UPDATE users SET streak = ?, last_review_date = ? WHERE id = ?',
                (streak, today.isoformat(), user_id)
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Review submitted',
            'new_ease': new_ease,
            'new_interval': new_interval,
            'next_review': next_review.isoformat(),
            'formatted_interval': SM2Algorithm.format_interval(new_interval)
        })
        
    except Exception as e:
        logger.error(f"Submit review error: {e}")
        return jsonify({'error': 'Failed to submit review'}), 500


@app.route('/api/stats/<int:user_id>', methods=['GET'])
@login_required
def get_stats(user_id):
    """Get user statistics."""
    if session['user_id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        # Total questions
        cursor.execute('SELECT COUNT(*) as count FROM questions')
        total_questions = cursor.fetchone()['count']
        
        # Questions reviewed
        cursor.execute(
            'SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?',
            (user_id,)
        )
        reviewed = cursor.fetchone()['count']
        
        # Cards due today
        cursor.execute('''
            SELECT COUNT(*) as count FROM questions q
            LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
            WHERE up.next_review_date IS NULL OR up.next_review_date <= ?
        ''', (user_id, now))
        due_today = cursor.fetchone()['count']
        
        # Total reviews
        cursor.execute(
            'SELECT COALESCE(SUM(review_count), 0) as total FROM user_progress WHERE user_id = ?',
            (user_id,)
        )
        total_reviews = cursor.fetchone()['total']
        
        # User streak
        cursor.execute('SELECT streak FROM users WHERE id = ?', (user_id,))
        streak = cursor.fetchone()['streak'] or 0
        
        # Category progress
        cursor.execute('''
            SELECT q.category, 
                   COUNT(DISTINCT q.id) as total,
                   COUNT(DISTINCT up.question_id) as reviewed
            FROM questions q
            LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
            GROUP BY q.category
        ''', (user_id,))
        categories = cursor.fetchall()
        
        # Subject progress with score
        cursor.execute('''
            SELECT q.subject, 
                   COUNT(DISTINCT q.id) as total,
                   COUNT(DISTINCT up.question_id) as reviewed,
                   COALESCE(SUM(CASE WHEN up.ease_factor >= 2.5 THEN 1 ELSE 0 END), 0) as correct
            FROM questions q
            LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
            GROUP BY q.subject
        ''', (user_id,))
        subjects = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'total_questions': total_questions,
            'reviewed': reviewed,
            'due_today': due_today,
            'total_reviews': total_reviews,
            'streak': streak,
            'categories': [
                {
                    'name': c['category'],
                    'total': c['total'],
                    'reviewed': c['reviewed'],
                    'progress': round((c['reviewed'] / c['total']) * 100) if c['total'] > 0 else 0
                }
                for c in categories
            ],
            'subjects': [
                {
                    'name': s['subject'],
                    'total': s['total'],
                    'reviewed': s['reviewed'],
                    'correct': s['correct'],
                    'progress': round((s['reviewed'] / s['total']) * 100) if s['total'] > 0 else 0,
                    'score': round((s['correct'] / s['reviewed']) * 100) if s['reviewed'] > 0 else 0
                }
                for s in subjects
            ]
        })
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': 'Failed to fetch stats'}), 500


# ============== Admin Routes ==============

@app.route('/api/scrape', methods=['POST'])
def scrape_questions():
    """Run the scraper to update questions."""
    try:
        # Run scraper
        questions = run_scraper(use_sample_fallback=True)
        
        if not questions:
            return jsonify({'error': 'No questions scraped'}), 500
        
        # Insert into database
        conn = get_db()
        cursor = conn.cursor()
        
        inserted = 0
        for q in questions:
            try:
                options_json = json.dumps(q['options']) if isinstance(q['options'], dict) else q['options']
                cursor.execute('''
                    INSERT OR IGNORE INTO questions (question, options, answer, explanation, category)
                    VALUES (?, ?, ?, ?, ?)
                ''', (q['question'], options_json, q['answer'], q.get('explanation', ''), q.get('category', 'General')))
                if cursor.rowcount > 0:
                    inserted += 1
            except Exception as e:
                logger.error(f"Error inserting question: {e}")
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Scraping complete',
            'total_scraped': len(questions),
            'inserted': inserted
        })
        
    except Exception as e:
        logger.error(f"Scrape error: {e}")
        return jsonify({'error': f'Scraping failed: {str(e)}'}), 500


@app.route('/api/init-sample', methods=['POST'])
def init_sample_questions():
    """Initialize database with comprehensive question bank (200+ questions)."""
    try:
        questions = get_all_questions()
        
        conn = get_db()
        cursor = conn.cursor()
        
        inserted = 0
        for q in questions:
            try:
                options_json = json.dumps(q['options'])
                cursor.execute('''
                    INSERT OR IGNORE INTO questions (question, options, answer, explanation, category, subject, difficulty)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (q['question'], options_json, q['answer'], q.get('explanation', ''), 
                      q.get('category', 'General'), q.get('subject', 'DBMS'), q.get('difficulty', 'medium')))
                if cursor.rowcount > 0:
                    inserted += 1
            except Exception as e:
                logger.error(f"Error inserting question: {e}")
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Comprehensive question bank loaded',
            'total_available': len(questions),
            'inserted': inserted
        })
        
    except Exception as e:
        logger.error(f"Init questions error: {e}")
        return jsonify({'error': 'Failed to initialize questions'}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM questions')
        count = cursor.fetchone()['count']
        conn.close()
        return jsonify({'status': 'healthy', 'questions_count': count})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


def startup_init():
    """Initialize on startup."""
    init_db()
    
    # Check if we have questions
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM questions')
    count = cursor.fetchone()['count']
    conn.close()
    
    if count == 0:
        logger.info("No questions found, initializing with comprehensive question bank...")
        questions = get_all_questions()
        
        conn = get_db()
        cursor = conn.cursor()
        for q in questions:
            options_json = json.dumps(q['options'])
            cursor.execute('''
                INSERT OR IGNORE INTO questions (question, options, answer, explanation, category, subject, difficulty)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (q['question'], options_json, q['answer'], q.get('explanation', ''), 
                  q.get('category', 'General'), q.get('subject', 'DBMS'), q.get('difficulty', 'medium')))
        conn.commit()
        conn.close()
        logger.info(f"Initialized {len(questions)} questions from comprehensive question bank")


if __name__ == '__main__':
    startup_init()
    app.run(debug=True, port=5000)
