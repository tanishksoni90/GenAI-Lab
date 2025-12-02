import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  score?: number;
  scoreBreakdown?: {
    clarity: number;
    specificity: number;
    context: number;
    relevance: number;
  };
  tokensUsed?: number;
  blocked?: boolean;
  blockReason?: string;
  feedback?: {
    strengths: string[];
    biggestGap: string;
    weakExample: { prompt: string; issue: string };
    strongExample: { prompt: string; why: string };
    guidingQuestions: string[];
    whatToTryNext: string[];
  };
}

export interface Session {
  id: string;
  modelId: string;
  modelName: string;
  modelCategory: 'text' | 'image' | 'audio';
  title: string;
  messageCount: number;
  tokensUsed: number;
  totalScore: number;
  scoredPrompts: number;
  avgScore: number;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  // Agent-specific fields
  isAgentSession?: boolean;
  agentId?: string;
  agentName?: string;
}

export interface Artifact {
  id: string;
  sessionId: string;
  type: 'text' | 'code' | 'image' | 'audio';
  title: string;
  content: string;
  modelName: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'streak';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface AgentGuardrail {
  id: string;
  type: 'educational-integrity' | 'content-safety' | 'behavioral' | 'custom';
  title: string;
  appliesTo: 'prompt' | 'response' | 'both';
  instruction: string;
  priority: number;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  modelId: string;
  modelName: string;
  guardrails: AgentGuardrail[];
  behaviorPrompt: string;
  strictMode: boolean;
  knowledgeBaseFiles: string[];
  knowledgeBaseSize: number;
  status: 'draft' | 'active';
  sessionsCount: number;
  messagesCount: number;
  artifactsCount: number;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avgScore: number;
  totalSessions: number;
  tokensUsed: number;
  totalPrompts: number;
  isCurrentUser: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  registrationId: string;
  password: string; // Hashed password for local auth
  createdAt: Date;
}

export interface UserStats {
  tokenBalance: number;
  tokenQuota: number;
  totalTokensUsed: number;
  totalSessions: number;
  todayModelSessions: number; // Only model sessions today
  totalAgentsCreated: number; // Total AI agents created
  weeklyPrompts: number;
  totalPrompts: number;
  totalScore: number;
  scoredPrompts: number;
  avgPromptScore: number;
  currentStreak: number;
  activeDays: string[];
  courseRank: number;
  institutionalRank: number;
  totalInCourse: number;
  totalInInstitution: number;
}

interface UserState {
  userId: string;
  userName: string;
  userEmail: string;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  stats: UserStats;
  sessions: Session[];
  artifacts: Artifact[];
  notifications: Notification[];
  agents: AIAgent[];
  
  // Auth actions
  registerUser: (profile: Omit<UserProfile, 'createdAt'>) => { success: boolean; error?: string };
  loginUser: (email: string, password: string) => { success: boolean; error?: string };
  setCurrentUser: (profile: UserProfile) => void;
  clearUserData: () => void;
  
  // Session actions
  createSession: (modelId: string, modelName: string, modelCategory: 'text' | 'image' | 'audio') => Session;
  createAgentSession: (agentId: string) => Session | null;
  getSession: (sessionId: string) => Session | undefined;
  updateSessionTitle: (sessionId: string, title: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage, tokens: number, score?: number) => void;
  getSessionMessages: (sessionId: string) => ChatMessage[];
  getModelSessions: () => Session[]; // Only model sessions for overview
  getAgentSessions: (agentId: string) => Session[]; // Sessions for specific agent
  
  // Agent actions
  createAgent: (agent: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt' | 'sessionsCount' | 'messagesCount' | 'artifactsCount' | 'tokensUsed'>) => AIAgent;
  updateAgent: (agentId: string, updates: Partial<AIAgent>) => void;
  deleteAgent: (agentId: string) => void;
  getAgent: (agentId: string) => AIAgent | undefined;
  incrementAgentUsage: (agentId: string, tokens: number, messages?: number, artifacts?: number) => void;
  
  // Artifact actions
  createArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => Artifact;
  deleteArtifact: (artifactId: string) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  
  // Stats actions
  deductTokens: (amount: number) => boolean;
  recordActivity: () => void;
  refreshStats: () => void;
  
  // Leaderboard
  getCourseLeaderboard: () => LeaderboardEntry[];
  getInstitutionalLeaderboard: () => LeaderboardEntry[];
}

const defaultStats: UserStats = {
  tokenBalance: 50000,
  tokenQuota: 50000,
  totalTokensUsed: 0,
  totalSessions: 0,
  todayModelSessions: 0,
  totalAgentsCreated: 0,
  weeklyPrompts: 0,
  totalPrompts: 0,
  totalScore: 0,
  scoredPrompts: 0,
  avgPromptScore: 0,
  currentStreak: 0,
  activeDays: [],
  courseRank: 1,
  institutionalRank: 1,
  totalInCourse: 45,
  totalInInstitution: 250,
};

const UserContext = createContext<UserState | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Storage keys
const getStorageKeys = (userId: string) => ({
  profile: `genai_${userId}_profile`,
  stats: `genai_${userId}_stats`,
  sessions: `genai_${userId}_sessions`,
  artifacts: `genai_${userId}_artifacts`,
  notifications: `genai_${userId}_notifications`,
  agents: `genai_${userId}_agents`,
});

const CURRENT_USER_KEY = 'genai_current_user';
const REGISTERED_USERS_KEY = 'genai_registered_users'; // Store all registered emails

// Simple hash function for passwords (in production, use bcrypt on backend)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(36) + '_' + password.length;
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// Helpers
const getTodayString = () => new Date().toISOString().split('T')[0];

const isToday = (date: Date) => {
  const today = new Date();
  return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
};

const isThisWeek = (date: Date) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return date >= weekStart;
};

const calculateStreak = (activeDays: string[]): number => {
  if (activeDays.length === 0) return 0;
  
  const sortedDays = [...activeDays].sort().reverse();
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (sortedDays[0] !== today && sortedDays[0] !== yesterdayStr) {
    return 0;
  }
  
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);
    const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// Mock other students for leaderboard
const mockOtherStudents = [
  { name: 'Bob Wilson', avgScore: 82, sessions: 34, tokens: 15200, prompts: 156 },
  { name: 'Carol Davis', avgScore: 78, sessions: 28, tokens: 12800, prompts: 134 },
  { name: 'David Lee', avgScore: 75, sessions: 22, tokens: 9800, prompts: 98 },
  { name: 'Eva Martinez', avgScore: 71, sessions: 18, tokens: 8200, prompts: 82 },
  { name: 'Frank Chen', avgScore: 68, sessions: 15, tokens: 6800, prompts: 68 },
  { name: 'Grace Kim', avgScore: 65, sessions: 12, tokens: 5400, prompts: 54 },
  { name: 'Henry Brown', avgScore: 62, sessions: 10, tokens: 4200, prompts: 42 },
  { name: 'Ivy Johnson', avgScore: 58, sessions: 8, tokens: 3600, prompts: 36 },
  { name: 'Jack Smith', avgScore: 55, sessions: 6, tokens: 2800, prompts: 28 },
  { name: 'Kate Adams', avgScore: 52, sessions: 4, tokens: 1800, prompts: 18 },
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_USER_KEY) || '';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return false;
    const keys = getStorageKeys(userId);
    return !!localStorage.getItem(keys.profile);
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    const keys = getStorageKeys(userId);
    const stored = localStorage.getItem(keys.profile);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, createdAt: new Date(parsed.createdAt) };
    }
    return null;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    if (!currentUserId) return defaultStats;
    const keys = getStorageKeys(currentUserId);
    const stored = localStorage.getItem(keys.stats);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultStats, ...parsed };
    }
    return defaultStats;
  });
  
  const [sessions, setSessions] = useState<Session[]>(() => {
    if (!currentUserId) return [];
    const keys = getStorageKeys(currentUserId);
    const stored = localStorage.getItem(keys.sessions);
    if (stored) {
      return JSON.parse(stored).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages || [],
        messageCount: s.messageCount || s.messages?.length || 0,
        totalScore: s.totalScore || 0,
        scoredPrompts: s.scoredPrompts || 0,
      }));
    }
    return [];
  });
  
  const [artifacts, setArtifacts] = useState<Artifact[]>(() => {
    if (!currentUserId) return [];
    const keys = getStorageKeys(currentUserId);
    const stored = localStorage.getItem(keys.artifacts);
    if (stored) {
      return JSON.parse(stored).map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
      }));
    }
    return [];
  });
  
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (!currentUserId) return [];
    const keys = getStorageKeys(currentUserId);
    const stored = localStorage.getItem(keys.notifications);
    if (stored) {
      return JSON.parse(stored).map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    }
    return [];
  });

  const [agents, setAgents] = useState<AIAgent[]>(() => {
    if (!currentUserId) return [];
    const keys = getStorageKeys(currentUserId);
    const stored = localStorage.getItem(keys.agents);
    if (stored) {
      return JSON.parse(stored).map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
    }
    return [];
  });

  // Register a new user
  const registerUser = useCallback((profile: Omit<UserProfile, 'createdAt'>): { success: boolean; error?: string } => {
    // Get list of registered users
    const registeredUsersStr = localStorage.getItem(REGISTERED_USERS_KEY);
    const registeredUsers: string[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
    
    // Check if email already exists
    const userId = `user-${profile.email.toLowerCase().replace(/[@.]/g, '-')}`;
    if (registeredUsers.includes(userId)) {
      return { success: false, error: 'Email already registered. Please sign in.' };
    }
    
    // Create new user
    const newProfile: UserProfile = {
      ...profile,
      password: hashPassword(profile.password),
      createdAt: new Date(),
    };
    
    // Save to registered users list
    registeredUsers.push(userId);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
    
    // Save user profile
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.profile, JSON.stringify(newProfile));
    localStorage.setItem(keys.stats, JSON.stringify(defaultStats));
    localStorage.setItem(keys.sessions, JSON.stringify([]));
    localStorage.setItem(keys.artifacts, JSON.stringify([]));
    localStorage.setItem(keys.notifications, JSON.stringify([]));
    localStorage.setItem(keys.agents, JSON.stringify([]));
    
    // Set as current user
    localStorage.setItem(CURRENT_USER_KEY, userId);
    setCurrentUserId(userId);
    setUserProfile(newProfile);
    setStats(defaultStats);
    setSessions([]);
    setArtifacts([]);
    setNotifications([]);
    setAgents([]);
    setIsAuthenticated(true);
    
    return { success: true };
  }, []);

  // Login user
  const loginUser = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const userId = `user-${email.toLowerCase().replace(/[@.]/g, '-')}`;
    const keys = getStorageKeys(userId);
    
    // Check if user exists
    const storedProfile = localStorage.getItem(keys.profile);
    if (!storedProfile) {
      return { success: false, error: 'Account not found. Please sign up first.' };
    }
    
    const profile = JSON.parse(storedProfile);
    
    // Verify password
    if (!verifyPassword(password, profile.password)) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }
    
    // Load user data
    localStorage.setItem(CURRENT_USER_KEY, userId);
    setCurrentUserId(userId);
    setUserProfile({ ...profile, createdAt: new Date(profile.createdAt) });
    
    const storedStats = localStorage.getItem(keys.stats);
    setStats(storedStats ? { ...defaultStats, ...JSON.parse(storedStats) } : defaultStats);
    
    const storedSessions = localStorage.getItem(keys.sessions);
    setSessions(storedSessions ? JSON.parse(storedSessions).map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: s.messages || [],
    })) : []);
    
    const storedArtifacts = localStorage.getItem(keys.artifacts);
    setArtifacts(storedArtifacts ? JSON.parse(storedArtifacts).map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    })) : []);
    
    const storedNotifications = localStorage.getItem(keys.notifications);
    setNotifications(storedNotifications ? JSON.parse(storedNotifications).map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    })) : []);
    
    const storedAgents = localStorage.getItem(keys.agents);
    setAgents(storedAgents ? JSON.parse(storedAgents).map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
    })) : []);
    
    setIsAuthenticated(true);
    
    return { success: true };
  }, []);

  // Set current user (for backward compatibility)
  const setCurrentUser = useCallback((profile: UserProfile) => {
    const userId = profile.id;
    localStorage.setItem(CURRENT_USER_KEY, userId);
    setCurrentUserId(userId);
    
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.profile, JSON.stringify(profile));
    setUserProfile(profile);
    setIsAuthenticated(true);
    
    const storedStats = localStorage.getItem(keys.stats);
    if (storedStats) {
      setStats({ ...defaultStats, ...JSON.parse(storedStats) });
    } else {
      localStorage.setItem(keys.stats, JSON.stringify(defaultStats));
      setStats(defaultStats);
    }
    
    // Load other data...
    const storedSessions = localStorage.getItem(keys.sessions);
    setSessions(storedSessions ? JSON.parse(storedSessions).map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: s.messages || [],
    })) : []);
    
    const storedArtifacts = localStorage.getItem(keys.artifacts);
    setArtifacts(storedArtifacts ? JSON.parse(storedArtifacts).map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    })) : []);
    
    const storedNotifications = localStorage.getItem(keys.notifications);
    setNotifications(storedNotifications ? JSON.parse(storedNotifications).map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    })) : []);
    
    const storedAgents = localStorage.getItem(keys.agents);
    setAgents(storedAgents ? JSON.parse(storedAgents).map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
    })) : []);
  }, []);

  // Clear user data (logout)
  const clearUserData = useCallback(() => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUserId('');
    setUserProfile(null);
    setStats(defaultStats);
    setSessions([]);
    setArtifacts([]);
    setNotifications([]);
    setAgents([]);
    setIsAuthenticated(false);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!currentUserId) return;
    const keys = getStorageKeys(currentUserId);
    localStorage.setItem(keys.stats, JSON.stringify(stats));
  }, [stats, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const keys = getStorageKeys(currentUserId);
    localStorage.setItem(keys.sessions, JSON.stringify(sessions));
  }, [sessions, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const keys = getStorageKeys(currentUserId);
    localStorage.setItem(keys.artifacts, JSON.stringify(artifacts));
  }, [artifacts, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const keys = getStorageKeys(currentUserId);
    localStorage.setItem(keys.notifications, JSON.stringify(notifications));
  }, [notifications, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const keys = getStorageKeys(currentUserId);
    localStorage.setItem(keys.agents, JSON.stringify(agents));
  }, [agents, currentUserId]);

  // Refresh stats calculations - FIXED avg score calculation
  const refreshStats = useCallback(() => {
    setSessions(currentSessions => {
      // Only count model sessions (not agent sessions) for today
      const todayModelSessions = currentSessions.filter(s => isToday(s.createdAt) && !s.isAgentSession).length;
      
      // Count ALL prompts this week (model + agent)
      const weeklyPrompts = currentSessions
        .filter(s => isThisWeek(s.createdAt))
        .reduce((acc, s) => {
          const userMessages = s.messages.filter(m => m.role === 'user').length;
          return acc + userMessages;
        }, 0);
      
      // Calculate total prompts and scores across ALL sessions (model + agent)
      let totalPrompts = 0;
      let totalScore = 0;
      let scoredPrompts = 0;
      
      currentSessions.forEach(session => {
        session.messages.forEach(msg => {
          if (msg.role === 'user') {
            totalPrompts++;
            if (msg.score !== undefined && msg.score > 0) {
              totalScore += msg.score;
              scoredPrompts++;
            }
          }
        });
      });
      
      // FIXED: Use floor for proper average calculation
      const avgPromptScore = scoredPrompts > 0 ? Math.floor(totalScore / scoredPrompts) : 0;
      const totalTokensFromSessions = currentSessions.reduce((acc, s) => acc + s.tokensUsed, 0);
      
      setStats(prev => {
        const currentStreak = calculateStreak(prev.activeDays);
        
        return {
          ...prev,
          totalSessions: currentSessions.length,
          todayModelSessions,
          totalAgentsCreated: agents.length,
          weeklyPrompts,
          totalPrompts,
          totalScore,
          scoredPrompts,
          avgPromptScore,
          totalTokensUsed: totalTokensFromSessions,
          tokenBalance: prev.tokenQuota - totalTokensFromSessions,
          currentStreak,
        };
      });
      
      return currentSessions;
    });
  }, [agents.length]);

  useEffect(() => {
    refreshStats();
  }, [sessions.length, agents.length]);

  // Create a new MODEL session (not agent)
  const createSession = useCallback((modelId: string, modelName: string, modelCategory: 'text' | 'image' | 'audio'): Session => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      modelId,
      modelName,
      modelCategory,
      title: `New ${modelName} Chat`,
      messageCount: 0,
      tokensUsed: 0,
      totalScore: 0,
      scoredPrompts: 0,
      avgScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      isAgentSession: false,
    };
    
    setSessions(prev => [newSession, ...prev]);
    recordActivity();
    
    const todaySessionCount = sessions.filter(s => isToday(s.createdAt) && !s.isAgentSession).length;
    if (todaySessionCount === 0) {
      const streak = calculateStreak([...stats.activeDays, getTodayString()]);
      if (streak > 0) {
        addNotification({
          type: 'streak',
          title: `🔥 ${streak} Day Streak!`,
          message: `You're on fire! Keep learning every day.`,
        });
      }
    }
    
    return newSession;
  }, [sessions, stats.activeDays]);

  // Create a new AGENT session
  const createAgentSession = useCallback((agentId: string): Session | null => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;
    
    const newSession: Session = {
      id: `agent-session-${Date.now()}`,
      modelId: agent.modelId,
      modelName: agent.modelName,
      modelCategory: 'text',
      title: `New ${agent.name} Chat`,
      messageCount: 0,
      tokensUsed: 0,
      totalScore: 0,
      scoredPrompts: 0,
      avgScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      isAgentSession: true,
      agentId: agent.id,
      agentName: agent.name,
    };
    
    setSessions(prev => [newSession, ...prev]);
    
    // Increment agent session count
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, sessionsCount: a.sessionsCount + 1, updatedAt: new Date() } : a
    ));
    
    recordActivity();
    
    return newSession;
  }, [agents]);

  // Get only MODEL sessions (for overview recent sessions)
  const getModelSessions = useCallback((): Session[] => {
    return sessions.filter(s => !s.isAgentSession);
  }, [sessions]);

  // Get sessions for specific agent
  const getAgentSessions = useCallback((agentId: string): Session[] => {
    return sessions.filter(s => s.isAgentSession && s.agentId === agentId);
  }, [sessions]);

  const getSession = useCallback((sessionId: string): Session | undefined => {
    return sessions.find(s => s.id === sessionId);
  }, [sessions]);

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title, updatedAt: new Date() } : s
    ));
  }, []);

  const addMessageToSession = useCallback((sessionId: string, message: ChatMessage, tokens: number, score?: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      
      const newMessages = [...s.messages, message];
      const newTokens = s.tokensUsed + tokens;
      
      let newTotalScore = s.totalScore;
      let newScoredPrompts = s.scoredPrompts;
      
      if (message.role === 'user' && score !== undefined && score > 0) {
        newTotalScore += score;
        newScoredPrompts += 1;
      }
      
      const newAvgScore = newScoredPrompts > 0 ? Math.floor(newTotalScore / newScoredPrompts) : 0;
      
      let newTitle = s.title;
      if (message.role === 'user' && s.messages.filter(m => m.role === 'user').length === 0) {
        newTitle = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
      }
      
      // If agent session, update agent stats
      if (s.isAgentSession && s.agentId) {
        setAgents(prevAgents => prevAgents.map(a => 
          a.id === s.agentId ? { 
            ...a, 
            messagesCount: a.messagesCount + 1,
            tokensUsed: a.tokensUsed + tokens,
            updatedAt: new Date() 
          } : a
        ));
      }
      
      return {
        ...s,
        messages: newMessages,
        messageCount: newMessages.filter(m => m.role === 'user').length,
        tokensUsed: newTokens,
        totalScore: newTotalScore,
        scoredPrompts: newScoredPrompts,
        avgScore: newAvgScore,
        title: newTitle,
        updatedAt: new Date(),
      };
    }));
  }, []);

  const getSessionMessages = useCallback((sessionId: string): ChatMessage[] => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.messages || [];
  }, [sessions]);

  // Agent actions
  const createAgent = useCallback((agentData: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt' | 'sessionsCount' | 'messagesCount' | 'artifactsCount' | 'tokensUsed'>): AIAgent => {
    const newAgent: AIAgent = {
      ...agentData,
      id: `agent-${Date.now()}`,
      sessionsCount: 0,
      messagesCount: 0,
      artifactsCount: 0,
      tokensUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setAgents(prev => [newAgent, ...prev]);
    
    addNotification({
      type: 'success',
      title: 'Agent Created',
      message: `"${agentData.name}" is ready to use.`,
    });
    
    return newAgent;
  }, []);

  const updateAgent = useCallback((agentId: string, updates: Partial<AIAgent>) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, ...updates, updatedAt: new Date() } : a
    ));
  }, []);

  const deleteAgent = useCallback((agentId: string) => {
    // Also delete agent sessions
    setSessions(prev => prev.filter(s => s.agentId !== agentId));
    setAgents(prev => prev.filter(a => a.id !== agentId));
    addNotification({
      type: 'info',
      title: 'Agent Deleted',
      message: 'The agent and its sessions have been permanently removed.',
    });
  }, []);

  const getAgent = useCallback((agentId: string): AIAgent | undefined => {
    return agents.find(a => a.id === agentId);
  }, [agents]);

  const incrementAgentUsage = useCallback((agentId: string, tokens: number, messages: number = 0, artifacts: number = 0) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      return {
        ...a,
        tokensUsed: a.tokensUsed + tokens,
        messagesCount: a.messagesCount + messages,
        artifactsCount: a.artifactsCount + artifacts,
        updatedAt: new Date(),
      };
    }));
  }, []);

  const deductTokens = useCallback((amount: number): boolean => {
    const totalUsed = sessions.reduce((acc, s) => acc + s.tokensUsed, 0);
    if (stats.tokenQuota - totalUsed < amount) return false;
    return true;
  }, [sessions, stats.tokenQuota]);

  const createArtifact = useCallback((artifact: Omit<Artifact, 'id' | 'createdAt'>): Artifact => {
    const newArtifact: Artifact = {
      ...artifact,
      id: `artifact-${Date.now()}`,
      createdAt: new Date(),
    };
    
    setArtifacts(prev => [newArtifact, ...prev]);
    
    addNotification({
      type: 'success',
      title: 'Artifact Created',
      message: `"${artifact.title}" has been saved to your artifacts.`,
    });
    
    return newArtifact;
  }, []);

  const deleteArtifact = useCallback((artifactId: string) => {
    setArtifacts(prev => prev.filter(a => a.id !== artifactId));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const recordActivity = useCallback(() => {
    const today = getTodayString();
    setStats(prev => {
      if (prev.activeDays.includes(today)) return prev;
      return {
        ...prev,
        activeDays: [...prev.activeDays, today],
        currentStreak: calculateStreak([...prev.activeDays, today]),
      };
    });
  }, []);

  const getCourseLeaderboard = useCallback((): LeaderboardEntry[] => {
    const userName = userProfile?.name || 'You';
    const userEntry: LeaderboardEntry = {
      rank: 0,
      name: `${userName} (You)`,
      avgScore: stats.avgPromptScore,
      totalSessions: stats.totalSessions,
      tokensUsed: stats.totalTokensUsed,
      totalPrompts: stats.totalPrompts,
      isCurrentUser: true,
    };
    
    const allEntries = [
      userEntry,
      ...mockOtherStudents.slice(0, 9).map(s => ({
        rank: 0,
        name: s.name,
        avgScore: s.avgScore,
        totalSessions: s.sessions,
        tokensUsed: s.tokens,
        totalPrompts: s.prompts,
        isCurrentUser: false,
      })),
    ];
    
    allEntries.sort((a, b) => b.avgScore - a.avgScore);
    allEntries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });
    
    const userRank = allEntries.find(e => e.isCurrentUser)?.rank || 1;
    if (userRank !== stats.courseRank) {
      setStats(prev => ({ ...prev, courseRank: userRank }));
    }
    
    return allEntries;
  }, [stats, userProfile]);

  const getInstitutionalLeaderboard = useCallback((): LeaderboardEntry[] => {
    const userName = userProfile?.name || 'You';
    const userEntry: LeaderboardEntry = {
      rank: 0,
      name: `${userName} (You)`,
      avgScore: stats.avgPromptScore,
      totalSessions: stats.totalSessions,
      tokensUsed: stats.totalTokensUsed,
      totalPrompts: stats.totalPrompts,
      isCurrentUser: true,
    };
    
    const institutionalStudents = [
      ...mockOtherStudents,
      { name: 'Liam Thompson', avgScore: 88, sessions: 42, tokens: 18500, prompts: 185 },
      { name: 'Mia Garcia', avgScore: 85, sessions: 38, tokens: 17200, prompts: 172 },
      { name: 'Noah Williams', avgScore: 84, sessions: 36, tokens: 16000, prompts: 160 },
    ];
    
    const allEntries = [
      userEntry,
      ...institutionalStudents.map(s => ({
        rank: 0,
        name: s.name,
        avgScore: s.avgScore,
        totalSessions: s.sessions,
        tokensUsed: s.tokens,
        totalPrompts: s.prompts,
        isCurrentUser: false,
      })),
    ];
    
    allEntries.sort((a, b) => b.avgScore - a.avgScore);
    allEntries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });
    
    const userRank = allEntries.find(e => e.isCurrentUser)?.rank || 1;
    if (userRank !== stats.institutionalRank) {
      setStats(prev => ({ ...prev, institutionalRank: userRank }));
    }
    
    return allEntries;
  }, [stats, userProfile]);

  const value: UserState = {
    userId: currentUserId,
    userName: userProfile?.name || 'Guest',
    userEmail: userProfile?.email || '',
    userProfile,
    isAuthenticated,
    stats,
    sessions,
    artifacts,
    notifications,
    agents,
    registerUser,
    loginUser,
    setCurrentUser,
    clearUserData,
    createSession,
    createAgentSession,
    getSession,
    updateSessionTitle,
    addMessageToSession,
    getSessionMessages,
    getModelSessions,
    getAgentSessions,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    incrementAgentUsage,
    createArtifact,
    deleteArtifact,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deductTokens,
    recordActivity,
    refreshStats,
    getCourseLeaderboard,
    getInstitutionalLeaderboard,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
