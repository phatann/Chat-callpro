export interface User {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  avatar_url: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'call_start' | 'call_end';
  created_at: string;
  read_at?: string;
}

export interface Chat {
  id: string; // User ID of the other person
  username: string;
  avatar_url: string;
  last_message: string;
  last_message_time: string;
  last_message_sender: string;
  unread_count: number;
}
