
import os
import re
import sqlite3
import uuid
from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Optional, Dict, Tuple

class AuthenticationDB:
    """SQLite database for user authentication"""
    
    def __init__(self):
        """Initialize the authentication database"""
        self.db_path = "backend/data/auth.db"
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.create_tables()
        self._init_default_user()
        
    def create_tables(self):
        """Create the necessary tables if they don't exist"""
        cursor = self.conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            is_email_user INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            last_login TEXT
        )
        ''')
        
        # Create sessions table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        ''')
        
        self.conn.commit()
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using SHA-256 with a random salt"""
        salt = secrets.token_hex(16)
        pwdhash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}${pwdhash}"
    
    def _verify_password(self, stored_password: str, provided_password: str) -> bool:
        """Verify a password against its hash"""
        salt, stored_hash = stored_password.split('$')
        pwdhash = hashlib.sha256((provided_password + salt).encode()).hexdigest()
        return pwdhash == stored_hash
    
    def _init_default_user(self):
        """Initialize the default user if it doesn't exist"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", ("tmxer",))
        if cursor.fetchone() is None:
            # Default user doesn't exist, create it
            self.create_user("tmxer", "abcd1234", None)
            print("Default user 'tmxer' created")
    
    def is_email(self, username: str) -> bool:
        """Check if a username is an email address"""
        email_pattern = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
        return bool(email_pattern.match(username))
    
    def create_user(self, username: str, password: str, email: Optional[str] = None) -> Dict:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        cursor = self.conn.cursor()
        
        # Determine if this is an email-based user
        is_email_user = 1 if self.is_email(username) else 0
        
        # If email is not provided but username is an email, use username as email
        if not email and is_email_user:
            email = username
        
        try:
            cursor.execute(
                "INSERT INTO users (id, username, password_hash, email, is_email_user, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, username, self._hash_password(password), email, is_email_user, datetime.utcnow().isoformat())
            )
            self.conn.commit()
            
            return {
                "id": user_id,
                "username": username,
                "email": email,
                "is_email_user": bool(is_email_user)
            }
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed: users.username" in str(e):
                raise ValueError(f"Username '{username}' already exists")
            elif "UNIQUE constraint failed: users.email" in str(e):
                raise ValueError(f"Email '{email}' already exists")
            else:
                raise e
    
    def authenticate_user(self, username: str, password: str) -> Tuple[Dict, str]:
        """Authenticate a user and return a session token"""
        cursor = self.conn.cursor()
        
        # Check if the username exists
        cursor.execute("SELECT id, password_hash, is_email_user FROM users WHERE username = ?", (username,))
        user_data = cursor.fetchone()
        
        if not user_data or not self._verify_password(user_data[1], password):
            raise ValueError("Invalid username or password")
        
        # Update last login time
        cursor.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), user_data[0])
        )
        
        # Generate session token
        token = secrets.token_hex(32)
        is_email_user = bool(user_data[2])
        
        # Set token expiration based on user type
        if is_email_user:
            # Email users: token expires after session (8 hours)
            expires_at = datetime.utcnow() + timedelta(hours=8)
        else:
            # Non-email users: token doesn't expire (set to 100 years)
            expires_at = datetime.utcnow() + timedelta(days=365*100)
        
        # Store the session token
        session_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
            (session_id, user_data[0], token, expires_at.isoformat())
        )
        
        self.conn.commit()
        
        # Fetch complete user info
        cursor.execute("SELECT id, username, email, is_email_user FROM users WHERE id = ?", (user_data[0],))
        user_row = cursor.fetchone()
        
        user = {
            "id": user_row[0],
            "username": user_row[1],
            "email": user_row[2],
            "is_email_user": bool(user_row[3])
        }
        
        return user, token
    
    def validate_token(self, token: str) -> Optional[Dict]:
        """Validate a session token and return user if valid"""
        cursor = self.conn.cursor()
        
        # Find the session
        cursor.execute("""
        SELECT s.user_id, s.expires_at, u.username, u.email, u.is_email_user
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
        """, (token,))
        
        session_data = cursor.fetchone()
        
        if not session_data:
            return None
        
        # Check if token has expired
        expires_at = datetime.fromisoformat(session_data[1])
        if expires_at < datetime.utcnow():
            # Delete expired session
            cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
            self.conn.commit()
            return None
        
        # Return user data
        return {
            "id": session_data[0],
            "username": session_data[2],
            "email": session_data[3],
            "is_email_user": bool(session_data[4])
        }
    
    def logout_user(self, token: str) -> bool:
        """Logout a user by deleting their session"""
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self.conn.commit()
        return cursor.rowcount > 0
    
    def close(self):
        """Close the database connection"""
        self.conn.close()

# Initialize the authentication database when the module is imported
auth_db = AuthenticationDB()

