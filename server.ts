import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './server/db';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server }); // Attach WS to HTTP server

  app.use(express.json());
  app.use(cookieParser());

  // --- WebSocket Logic ---
  const clients = new Map<string, WebSocket>(); // userId -> ws

  wss.on('connection', (ws, req) => {
    // Parse cookie from req
    const cookieHeader = req.headers.cookie;
    let userId: string | null = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as any);
      
      if (cookies.session_id) {
        const user = db.getSession(cookies.session_id);
        if (user) {
          userId = user.id;
          clients.set(userId, ws);
          console.log(`User ${user.username} connected via WS`);
        }
      }
    }

    ws.on('message', (message) => {
      if (!userId) return;
      
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'chat') {
          const { receiverId, content } = data;
          
          // Check if sender is blocked by receiver
          const isBlocked = db.isUserBlocked(receiverId, userId);
          
          if (!isBlocked) {
            const msg = db.createMessage(userId, receiverId, content);
            
            // Send back to sender (confirmation)
            ws.send(JSON.stringify({ type: 'chat_ack', message: msg }));
            
            // Send to receiver if online
            const receiverWs = clients.get(receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({ type: 'chat_new', message: msg }));
            }
          } else {
             // Optionally notify sender they are blocked, or just silently fail (standard behavior)
             // For now, we'll just ack to sender so it looks sent, but receiver never gets it
             // Actually, standard behavior is usually single tick (sent) but not delivered.
             // We will create the message in DB but NOT send to receiver via WS.
             // Wait, if blocked, usually message is NOT delivered.
             // Let's create it in DB for now so sender sees it in their history, 
             // but receiver won't see it in theirs if we filter queries? 
             // Or better: don't create it? 
             // Telegram/WhatsApp: You can send, but they don't receive.
             // Let's create it, but NOT send WS event to receiver.
             const msg = db.createMessage(userId, receiverId, content);
             ws.send(JSON.stringify({ type: 'chat_ack', message: msg }));
          }
        } else if (data.type === 'call_signal') {
          const { receiverId, signalData } = data;
          const receiverWs = clients.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ 
              type: 'call_signal', 
              senderId: userId, 
              signalData 
            }));
          }
        } else if (data.type === 'call_end') {
          const { receiverId } = data;
          const receiverWs = clients.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ 
              type: 'call_end', 
              senderId: userId 
            }));
          }
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', (req, res) => {
    const { username, email, phone, password } = req.body;
    try {
      // Basic validation
      if (!username || (!email && !phone) || !password) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      
      const cleanEmail = email?.trim() || null;
      const cleanPhone = phone?.trim() || null;

      const user = db.createUser(username, cleanEmail, cleanPhone, password);
      const sessionId = db.createSession(user.id);
      
      res.cookie('session_id', sessionId, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      
      res.json({ user });
    } catch (e: any) {
      console.error(e);
      res.status(400).json({ error: 'User already exists or invalid data' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body; // identifier = email or phone
    try {
      let user = null;
      if (identifier.includes('@')) {
        user = db.getUserByEmail(identifier);
      } else {
        user = db.getUserByPhone(identifier);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = bcrypt.compareSync(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const sessionId = db.createSession(user.id);
      res.cookie('session_id', sessionId, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
      
      res.json({ user });
    } catch (e) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) db.deleteSession(sessionId);
    res.clearCookie('session_id');
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) return res.status(401).json({ error: 'Not logged in' });
    
    const user = db.getSession(sessionId);
    if (!user) return res.status(401).json({ error: 'Invalid session' });
    
    res.json({ user });
  });

  // Chats
  app.get('/api/chats', (req, res) => {
    const sessionId = req.cookies.session_id;
    const user = db.getSession(sessionId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const chats = db.getRecentChats(user.id);
    res.json({ chats });
  });

  app.get('/api/messages/:userId', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    const otherUserId = req.params.userId;
    const messages = db.getMessages(currentUser.id, otherUserId);
    res.json({ messages });
  });

  app.post('/api/users/:id/block', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    db.blockUser(currentUser.id, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/users/:id/unblock', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    db.unblockUser(currentUser.id, req.params.id);
    res.json({ success: true });
  });

  app.get('/api/users/me/blocked', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    const blocked = db.getBlockedUsers(currentUser.id);
    res.json({ blocked });
  });

  app.post('/api/messages/:userId/read', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    const otherUserId = req.params.userId;
    db.markMessagesAsRead(otherUserId, currentUser.id);
    res.json({ success: true });
  });

  app.get('/api/users/search', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    const query = req.query.q as string;
    if (!query) return res.json({ users: [] });
    
    const users = db.searchUsers(query, currentUser.id);
    res.json({ users });
  });

  app.get('/api/users/:id', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ user });
  });

  app.put('/api/users/me', (req, res) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthorized' });

    const { username, email, phone, avatar_url, status } = req.body;
    try {
      const cleanEmail = email?.trim() || null;
      const cleanPhone = phone?.trim() || null;
      const updatedUser = db.updateUser(currentUser.id, { username, email: cleanEmail, phone: cleanPhone, avatar_url, status });
      res.json({ user: updatedUser });
    } catch (e) {
      res.status(400).json({ error: 'Update failed. Username or email might be taken.' });
    }
  });

  // --- Admin Routes ---
  const requireAdmin = (req: any, res: any, next: any) => {
    const sessionId = req.cookies.session_id;
    const currentUser = db.getSession(sessionId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = currentUser;
    next();
  };

  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const users = db.getAllUsers();
    res.json({ users });
  });

  app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
    const { username, email, phone, role } = req.body;
    try {
      const cleanEmail = email?.trim() || null;
      const cleanPhone = phone?.trim() || null;
      const updatedUser = db.updateUser(req.params.id, { username, email: cleanEmail, phone: cleanPhone, role });
      res.json({ user: updatedUser });
    } catch (e) {
      res.status(400).json({ error: 'Update failed' });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    try {
      db.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if built)
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
