export interface AIBot {
  id: string;
  username: string;
  avatar_url: string;
  status: string;
  description: string;
  model: string;
}

export const AI_BOTS: AIBot[] = [
  {
    id: 'ai-flash',
    username: 'Flash Bot',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=flash',
    status: 'Fast AI responses',
    description: 'I respond instantly using Gemini Flash Lite.',
    model: 'gemini-3.1-flash-lite-preview'
  },
  {
    id: 'ai-pro',
    username: 'Pro Bot',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=pro',
    status: 'Complex reasoning',
    description: 'I can handle complex tasks using Gemini Pro.',
    model: 'gemini-3.1-pro-preview'
  },
  {
    id: 'ai-search',
    username: 'Search Bot',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=search',
    status: 'Google Search enabled',
    description: 'I have access to Google Search data.',
    model: 'gemini-3-flash-preview'
  },
  {
    id: 'ai-assistant',
    username: 'Gemini Assistant',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=general',
    status: 'General Intelligence',
    description: 'I am your general AI assistant.',
    model: 'gemini-3-flash-preview'
  }
];
