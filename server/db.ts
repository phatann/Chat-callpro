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
    type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'call_start', 'call_end'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_users (
    user_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, blocked_user_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(blocked_user_id) REFERENCES users(id)
  );
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Hey there! I am using WhatsApp'");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN otp_code TEXT");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE users ADD COLUMN otp_expires_at DATETIME");
} catch (e) {
  // Column already exists
}

export const createUser = (username: string, email: string | null, phone: string | null, password?: string) => {
  const id = uuidv4();
  const password_hash = password ? bcrypt.hashSync(password, 10) : null;
  const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';
  const stmt = db.prepare('INSERT INTO users (id, username, email, phone, password_hash, avatar_url, role, status, banned, verified, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)');
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
  const status = 'Hey there! I am using WhatsApp';
  stmt.run(id, username, email, phone, password_hash, avatar, role, status);
  return getUserById(id);
};

export const getUserByEmail = (email: string) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
};

export const getUserByPhone = (phone: string) => {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
};

export const getUserById = (id: string) => {
  return db.prepare('SELECT id, username, email, phone, avatar_url, role, status, banned, verified, email_verified FROM users WHERE id = ?').get(id) as any;
};

export const updateUser = (id: string, updates: { username?: string, email?: string | null, phone?: string | null, avatar_url?: string, role?: string, status?: string, password_hash?: string, banned?: number, verified?: number, email_verified?: number, otp_code?: string | null, otp_expires_at?: string | null }) => {
  const fields = [];
  const values = [];
  if (updates.username !== undefined) { fields.push('username = ?'); values.push(updates.username); }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(updates.avatar_url); }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(updates.password_hash); }
  if (updates.banned !== undefined) { fields.push('banned = ?'); values.push(updates.banned); }
  if (updates.verified !== undefined) { fields.push('verified = ?'); values.push(updates.verified); }
  if (updates.email_verified !== undefined) { fields.push('email_verified = ?'); values.push(updates.email_verified); }
  if (updates.otp_code !== undefined) { fields.push('otp_code = ?'); values.push(updates.otp_code); }
  if (updates.otp_expires_at !== undefined) { fields.push('otp_expires_at = ?'); values.push(updates.otp_expires_at); }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
};

export const getContacts = (currentUserId: string) => {
  return db.prepare('SELECT id, username, email, phone, avatar_url, status, verified FROM users WHERE id != ? AND banned = 0 ORDER BY username ASC').all(currentUserId) as any[];
};

export const getAllUsers = () => {
  return db.prepare(`
    SELECT 
      u.id, u.username, u.email, u.phone, u.avatar_url, u.role, u.status, u.created_at, u.banned, u.verified,
      (SELECT COUNT(*) FROM messages WHERE sender_id = u.id) as message_count,
      (SELECT MAX(created_at) FROM messages WHERE sender_id = u.id) as last_active
    FROM users u 
    ORDER BY u.created_at DESC
  `).all() as any[];
};

export const deleteUser = (id: string) => {
  db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(id, id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
};

export const createSession = (userId: string) => {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
  return id;
};

export const getSession = (sessionId: string) => {
  const session = db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')").get(sessionId) as any;
  if (!session) return null;
  return getUserById(session.user_id);
};

export const deleteSession = (sessionId: string) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
};

export const deleteUserSessions = (userId: string) => {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
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
    SELECT id, username, email, phone, avatar_url, verified 
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
      u.id, u.username, u.avatar_url, u.verified,
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

export const blockUser = (userId: string, blockedUserId: string) => {
  try {
    db.prepare('INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)').run(userId, blockedUserId);
    return true;
  } catch (e) {
    return false; // Already blocked
  }
};

export const unblockUser = (userId: string, blockedUserId: string) => {
  db.prepare('DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?').run(userId, blockedUserId);
};

export const getBlockedUsers = (userId: string) => {
  return db.prepare('SELECT blocked_user_id FROM blocked_users WHERE user_id = ?').all(userId) as { blocked_user_id: string }[];
};

export const ensureAIUser = () => {
  const aiUser = db.prepare('SELECT * FROM users WHERE username = ?').get('Alpha 3.1') as any;
  if (!aiUser) {
    const id = 'ai-assistant';
    const username = 'Alpha 3.1';
    const role = 'admin'; 
    const status = 'I am Alpha 3.1, your AI Assistant.';
    const avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=Alpha3.1'; 
    
    try {
      db.prepare('INSERT INTO users (id, username, role, status, avatar_url, verified, banned) VALUES (?, ?, ?, ?, ?, 1, 0)').run(id, username, role, status, avatar);
      console.log('AI User "Alpha 3.1" created.');
    } catch (e) {
      console.error('Error creating AI user:', e);
    }
    return id;
  }
  return aiUser.id;
};

export const isUserBlocked = (userId: string, otherUserId: string) => {
  const result = db.prepare('SELECT 1 FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?').get(userId, otherUserId);
  return !!result;
};
