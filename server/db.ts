import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const db = new Database('chat.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'call_start', 'call_end'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
`);

export const createUser = (username: string, email: string | null, phone: string | null, password?: string) => {
  const id = uuidv4();
  const password_hash = password ? bcrypt.hashSync(password, 10) : null;
  const stmt = db.prepare('INSERT INTO users (id, username, email, phone, password_hash, avatar_url) VALUES (?, ?, ?, ?, ?, ?)');
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
  stmt.run(id, username, email, phone, password_hash, avatar);
  return getUserById(id);
};

export const getUserByEmail = (email: string) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
};

export const getUserByPhone = (phone: string) => {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
};

export const getUserById = (id: string) => {
  return db.prepare('SELECT id, username, email, phone, avatar_url FROM users WHERE id = ?').get(id) as any;
};

export const updateUser = (id: string, updates: { username?: string, email?: string, phone?: string, avatar_url?: string }) => {
  const fields = [];
  const values = [];
  if (updates.username) { fields.push('username = ?'); values.push(updates.username); }
  if (updates.email) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.phone) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.avatar_url) { fields.push('avatar_url = ?'); values.push(updates.avatar_url); }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
};

export const createSession = (userId: string) => {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
  return id;
};

export const getSession = (sessionId: string) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")').get(sessionId) as any;
  if (!session) return null;
  return getUserById(session.user_id);
};

export const deleteSession = (sessionId: string) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
};

export const getMessages = (userId1: string, userId2: string) => {
  return db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(userId1, userId2, userId2, userId1) as any[];
};

export const createMessage = (senderId: string, receiverId: string, content: string, type = 'text') => {
  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?, ?)').run(id, senderId, receiverId, content, type);
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
};

export const searchUsers = (query: string, currentUserId: string) => {
  return db.prepare(`
    SELECT id, username, email, phone, avatar_url 
    FROM users 
    WHERE (username LIKE ? OR email LIKE ? OR phone LIKE ?) 
      AND id != ?
    LIMIT 20
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, currentUserId) as any[];
};

export const getRecentChats = (userId: string) => {
  // Complex query to get latest message for each conversation
  const stmt = db.prepare(`
    SELECT 
      u.id, u.username, u.avatar_url,
      m.content as last_message,
      m.created_at as last_message_time,
      m.sender_id as last_message_sender,
      (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND read_at IS NULL) as unread_count
    FROM users u
    JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.receiver_id = u.id AND m.sender_id = ?)
    WHERE m.created_at = (
      SELECT MAX(created_at) 
      FROM messages m2 
      WHERE (m2.sender_id = u.id AND m2.receiver_id = ?) 
         OR (m2.receiver_id = u.id AND m2.sender_id = ?)
    )
    ORDER BY m.created_at DESC
  `);
  return stmt.all(userId, userId, userId, userId, userId) as any[];
};

export const markMessagesAsRead = (senderId: string, receiverId: string) => {
  db.prepare(`
    UPDATE messages 
    SET read_at = CURRENT_TIMESTAMP 
    WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL
  `).run(senderId, receiverId);
};
