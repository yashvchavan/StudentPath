// lib/db/chat.ts
import pool from '@/lib/db'; // Your existing MySQL pool connection
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export type UserType = 'student' | 'professional';

export interface Conversation {
  id: number;
  user_id: number;
  user_type: UserType;
  title: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
  tokens_used: number;
}

export interface ChatContext {
  id: number;
  user_id: number;
  user_type: UserType;
  context_data: any;
  updated_at: Date;
}

// ------------------- Conversations -------------------

// Create a new conversation
export async function createConversation(
  userId: number,
  userType: UserType,
  title?: string
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO chat_conversations (user_id, user_type, title) VALUES (?, ?, ?)',
    [userId, userType, title || 'New Conversation']
  );
  return result.insertId;
}

// Get all conversations for a user
export async function getUserConversations(
  userId: number,
  userType: UserType,
  includeArchived = false
): Promise<Conversation[]> {
  const query = includeArchived
    ? 'SELECT * FROM chat_conversations WHERE user_id = ? AND user_type = ? ORDER BY updated_at DESC'
    : 'SELECT * FROM chat_conversations WHERE user_id = ? AND user_type = ? AND is_archived = FALSE ORDER BY updated_at DESC';
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, [userId, userType]);
  return rows as Conversation[];
}

// Get a specific conversation
export async function getConversation(
  conversationId: number,
  userId: number,
  userType: UserType
): Promise<Conversation | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM chat_conversations WHERE id = ? AND user_id = ? AND user_type = ?',
    [conversationId, userId, userType]
  );
  return rows.length > 0 ? (rows[0] as Conversation) : null;
}

// Update conversation title
export async function updateConversationTitle(
  conversationId: number,
  title: string
): Promise<void> {
  await pool.execute(
    'UPDATE chat_conversations SET title = ? WHERE id = ?',
    [title, conversationId]
  );
}

// Archive/Unarchive conversation
export async function archiveConversation(
  conversationId: number,
  archive = true
): Promise<void> {
  await pool.execute(
    'UPDATE chat_conversations SET is_archived = ? WHERE id = ?',
    [archive, conversationId]
  );
}

// Delete conversation
export async function deleteConversation(
  conversationId: number,
  userId: number,
  userType: UserType
): Promise<void> {
  await pool.execute(
    'DELETE FROM chat_conversations WHERE id = ? AND user_id = ? AND user_type = ?',
    [conversationId, userId, userType]
  );
}

// ------------------- Messages -------------------

// Add a message to a conversation
export async function addMessage(
  conversationId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensUsed = 0
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO chat_messages (conversation_id, role, content, tokens_used) VALUES (?, ?, ?, ?)',
    [conversationId, role, content, tokensUsed]
  );
  
  // Update conversation's updated_at timestamp
  await pool.execute(
    'UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [conversationId]
  );
  
  return result.insertId;
}

// Get all messages in a conversation
export async function getConversationMessages(
  conversationId: number
): Promise<Message[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );
  return rows as Message[];
}

// Get recent messages for context (last N messages)
export async function getRecentMessages(
  conversationId: number,
  limit = 10
): Promise<Message[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?',
    [conversationId, limit]
  );
  return (rows as Message[]).reverse(); // Reverse to get chronological order
}

// ------------------- Context -------------------

// Save or update user context
export async function saveUserContext(
  userId: number,
  userType: UserType,
  contextData: any
): Promise<void> {
  await pool.execute(
    `INSERT INTO chat_context (user_id, user_type, context_data) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE context_data = ?, updated_at = CURRENT_TIMESTAMP`,
    [userId, userType, JSON.stringify(contextData), JSON.stringify(contextData)]
  );
}

// Get user context
export async function getUserContext(
  userId: number,
  userType: UserType
): Promise<any | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT context_data FROM chat_context WHERE user_id = ? AND user_type = ?',
    [userId, userType]
  );
  return rows.length > 0 ? rows[0].context_data : null;
}

// ------------------- Utility -------------------

// Generate conversation title from first message
export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  let title = firstMessage.trim();
  
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...';
  }
  
  return title || 'New Conversation';
}

// Get conversation statistics for a user
export async function getConversationStats(
  userId: number,
  userType: UserType
) {
  const [stats] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      COUNT(DISTINCT c.id) AS total_conversations,
      COUNT(m.id) AS total_messages,
      SUM(m.tokens_used) AS total_tokens
     FROM chat_conversations c
     LEFT JOIN chat_messages m ON c.id = m.conversation_id
     WHERE c.user_id = ? AND c.user_type = ?`,
    [userId, userType]
  );
  
  return stats[0] || { total_conversations: 0, total_messages: 0, total_tokens: 0 };
}
