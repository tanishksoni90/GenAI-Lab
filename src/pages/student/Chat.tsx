import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SkyToggle from "@/components/ui/sky-toggle";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser, ChatMessage } from "@/contexts/UserContext";
import { 
  ArrowLeft, Send, Plus, MessageSquare, EyeOff, Bot, 
  Sparkles, Zap, Code, Target, TrendingUp, AlertTriangle,
  Copy, ThumbsUp, ThumbsDown, RefreshCw, PanelRightClose,
  PanelRight, Paperclip, Loader2, CheckCircle, Info,
  Image as ImageIcon, Volume2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { mockAIModels } from "@/lib/mockData";
import { calculateRequestCost } from "@/lib/modelPricing";

const StudentChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { modelId } = useParams();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { 
    stats, 
    sessions,
    createSession, 
    getSession, 
    addMessageToSession, 
    getSessionMessages,
    artifacts,
    refreshStats
  } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if we're opening an existing session or a new one
  const sessionIdFromUrl = searchParams.get('session');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdFromUrl);
  
  // Track where user came from for back button
  const cameFromSession = sessionIdFromUrl !== null;
  
  // Determine the current model based on modelId or session
  const getModelFromId = (id?: string) => {
    const targetId = id || modelId;
    if (targetId === "dalle-3") {
      return { 
        id: "dalle-3", 
        name: "DALL-E 3", 
        provider: "OpenAI", 
        category: "image",
        description: "Generate stunning images from text descriptions",
        enabled: true,
        tokensPerRequest: 500,
        features: ["Image Generation", "High Quality", "Creative Art"]
      };
    }
    if (targetId === "elevenlabs") {
      return { 
        id: "elevenlabs", 
        name: "Eleven Multilingual v2", 
        provider: "ElevenLabs", 
        category: "audio",
        description: "Convert text to natural-sounding speech",
        enabled: true,
        tokensPerRequest: 200,
        features: ["Text-to-Speech", "Multilingual", "Natural Voice"]
      };
    }
    return mockAIModels.find(m => m.id === targetId) || mockAIModels[0];
  };
  
  // If opening from a session, get model from session
  const existingSession = sessionIdFromUrl ? getSession(sessionIdFromUrl) : null;
  const currentModel = existingSession ? getModelFromId(existingSession.modelId) : getModelFromId();
  const isImageModel = currentModel.category === "image";
  const isAudioModel = currentModel.category === "audio";
  
  // Get appropriate welcome message based on model type
  const getWelcomeMessage = (): ChatMessage => ({
    id: "welcome-1",
    role: "assistant",
    content: isImageModel 
      ? "Hello! I'm **DALL-E 3**, your image generation assistant. I can create stunning images from your text descriptions.\n\n✨ **Tips for great prompts:**\n• Be specific about style (photorealistic, cartoon, oil painting, etc.)\n• Describe colors, lighting, and mood\n• Include details about composition and perspective\n\n**Example:** \"A cozy coffee shop on a rainy evening, warm lighting through foggy windows, watercolor style\"\n\nWhat would you like me to create today?"
      : isAudioModel
      ? "Hello! I'm **Eleven Multilingual v2**, your text-to-speech assistant. I can convert your text into natural-sounding speech.\n\n🎙️ **How to use:**\n• Type or paste the text you want me to read\n• I'll generate high-quality audio\n• Supports multiple languages\n\n**Example:** \"Welcome to our product demo. Today we'll be exploring the latest features...\"\n\nWhat text would you like me to convert to speech?"
      : "Hello! I'm your AI learning assistant. How can I help you today? I can assist with:\n\n• **Coding questions** - Explain concepts, debug code, or help you learn new languages\n• **Research** - Help you find information and understand complex topics\n• **Writing** - Assist with essays, documentation, or creative writing\n• **Problem solving** - Work through logical problems step by step\n\nWhat would you like to explore?",
    timestamp: new Date().toLocaleTimeString(),
  });
  
  // Initialize messages from existing session or empty
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (existingSession && existingSession.messages.length > 0) {
      return existingSession.messages;
    }
    return [getWelcomeMessage()];
  });
  
  const [inputMessage, setInputMessage] = useState("");
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // Calculate session tokens used from messages
  const sessionTokensUsed = messages.reduce((acc, m) => acc + (m.tokensUsed || 0), 0);
  
  // Load session messages when sessionId changes
  useEffect(() => {
    if (sessionIdFromUrl) {
      const session = getSession(sessionIdFromUrl);
      if (session && session.messages.length > 0) {
        setMessages(session.messages);
        setCurrentSessionId(sessionIdFromUrl);
      }
    }
  }, [sessionIdFromUrl, getSession]);

  // Calculate session score (average of all prompt scores)
  const userMessages = messages.filter(m => m.role === "user" && m.score !== undefined && m.score > 0);
  const sessionScore = userMessages.length > 0
    ? Math.round(userMessages.reduce((acc, m) => acc + (m.score || 0), 0) / userMessages.length)
    : 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Simulate prompt scoring
  const scorePrompt = (prompt: string, previousMessages: ChatMessage[]) => {
    const blockedWords = ["hack", "cheat", "bypass"];
    const isBlocked = blockedWords.some(word => prompt.toLowerCase().includes(word));
    if (isBlocked) {
      return { 
        score: 0, 
        breakdown: { clarity: 0, specificity: 0, context: 0, relevance: 0 }, 
        blocked: true, 
        blockReason: "Your prompt contains restricted content. Please rephrase.",
        feedback: null
      };
    }

    const hasQuestion = prompt.includes("?");
    const wordCount = prompt.split(" ").length;
    const hasExample = prompt.toLowerCase().includes("example");
    const hasContext = prompt.toLowerCase().includes("because") || prompt.toLowerCase().includes("since") || prompt.toLowerCase().includes("given");
    
    const clarity = Math.min(100, Math.max(20, 40 + prompt.length / 3 + (hasQuestion ? 15 : 0)));
    const specificity = Math.min(100, Math.max(20, 30 + (wordCount > 8 ? 30 : wordCount > 5 ? 20 : 10) + (hasExample ? 15 : 0)));
    const context = Math.min(100, Math.max(20, previousMessages.length > 2 ? 70 + Math.random() * 15 : hasContext ? 60 : 40 + Math.random() * 20));
    const relevance = Math.min(100, Math.max(20, 50 + Math.random() * 30));
    
    const score = Math.round((clarity + specificity + context + relevance) / 4);
    const breakdown = { 
      clarity: Math.round(clarity), 
      specificity: Math.round(specificity), 
      context: Math.round(context), 
      relevance: Math.round(relevance) 
    };

    const strengths: string[] = [];
    const weakAreas: { area: string; value: number }[] = [];

    if (breakdown.clarity >= 70) strengths.push("Clear and understandable request");
    else weakAreas.push({ area: "clarity", value: breakdown.clarity });
    
    if (breakdown.specificity >= 70) strengths.push("Good level of detail");
    else weakAreas.push({ area: "specificity", value: breakdown.specificity });
    
    if (breakdown.context >= 70) strengths.push("Builds well on conversation context");
    else weakAreas.push({ area: "context", value: breakdown.context });
    
    if (breakdown.relevance >= 70) strengths.push("Relevant to learning goals");
    else weakAreas.push({ area: "relevance", value: breakdown.relevance });

    if (hasQuestion) strengths.push("Uses question format effectively");
    if (hasExample) strengths.push("Requests examples for better understanding");
    if (wordCount > 10) strengths.push("Provides sufficient detail");

    const worstArea = weakAreas.sort((a, b) => a.value - b.value)[0];
    const biggestGap = worstArea ? {
      clarity: "Your prompt could be clearer. Try stating exactly what you want to know.",
      specificity: "Your prompt is too vague. Add specific details about what aspect you want to learn.",
      context: "Try building on the previous response or explain why you're asking this.",
      relevance: "Consider how this question connects to your learning objectives."
    }[worstArea.area] || "" : "Great job! Your prompt covers all key areas well.";

    const feedback = {
      strengths: strengths.length > 0 ? strengths : ["You submitted a prompt - that's the first step!"],
      biggestGap,
      weakExample: {
        prompt: "Tell me about coding",
        issue: "Too vague - doesn't specify language, concept, or goal"
      },
      strongExample: {
        prompt: "Can you explain how Python list comprehensions work with an example comparing it to a traditional for loop?",
        why: "Specific topic, requests example, asks for comparison to aid understanding"
      },
      guidingQuestions: [
        "What specific outcome do you want from this prompt?",
        "Can you add context about why you're asking?",
        "Would an example help clarify what you're looking for?"
      ],
      whatToTryNext: breakdown.specificity < 60 
        ? ["Add a specific example of what you want", "Mention your current understanding level", "Ask about a specific aspect, not the whole topic"]
        : breakdown.clarity < 60
        ? ["Rephrase as a direct question", "Break into smaller, focused questions", "State what you already know"]
        : breakdown.context < 60
        ? ["Reference the AI's previous response", "Explain how this connects to your goal", "Add 'building on that...' to show continuity"]
        : ["Try asking for alternative approaches", "Request a comparison with related concepts", "Ask for common mistakes to avoid"]
    };

    return { score, breakdown, blocked: false, feedback };
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const inputTokens = Math.ceil(inputMessage.length / 4);
    const estimatedOutputTokens = 150;
    const userTokenCost = calculateRequestCost(currentModel.id, inputTokens, 0, inputMessage.length);
    const responseTokenCost = calculateRequestCost(currentModel.id, 0, estimatedOutputTokens, inputMessage.length);
    const totalCost = userTokenCost + responseTokenCost;
    
    if (stats.tokenBalance < totalCost) {
      return;
    }

    // Create session if this is the first message in a new chat
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const session = createSession(
        currentModel.id, 
        currentModel.name, 
        currentModel.category as 'text' | 'image' | 'audio'
      );
      activeSessionId = session.id;
      setCurrentSessionId(session.id);
    }

    const { score, breakdown, blocked, blockReason, feedback } = scorePrompt(inputMessage, messages);

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
      score: blocked ? 0 : score,
      scoreBreakdown: breakdown,
      tokensUsed: userTokenCost,
      blocked,
      blockReason,
      feedback: feedback || undefined,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    
    // Save user message to session
    if (activeSessionId) {
      addMessageToSession(activeSessionId, newUserMessage, userTokenCost, blocked ? undefined : score);
    }

    if (blocked) {
      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      const newAssistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: isImageModel 
          ? "🎨 I've generated your image based on your description!\n\n[Image would appear here]\n\n**Generation Details:**\n• Style: Based on your prompt\n• Resolution: 1024x1024\n• Model: DALL-E 3\n\nWould you like me to modify this image or create a new one with different parameters?"
          : isAudioModel
          ? "🎙️ I've converted your text to speech!\n\n[Audio player would appear here]\n\n**Audio Details:**\n• Duration: ~" + Math.ceil(inputMessage.length / 15) + " seconds\n• Voice: Natural multilingual\n• Format: MP3\n\nWould you like me to regenerate with different settings?"
          : "That's a great question! Let me help you understand this better.\n\nHere's a comprehensive explanation with examples:\n\n```python\ndef example_function():\n    # This is a sample code block\n    result = process_data()\n    return result\n```\n\nThe key concepts to understand here are:\n\n1. **First concept** - This helps establish the foundation\n2. **Second concept** - Building on what we learned\n3. **Third concept** - Putting it all together\n\nWould you like me to elaborate on any of these points?",
        timestamp: new Date().toLocaleTimeString(),
        tokensUsed: responseTokenCost,
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      
      // Save assistant message to session
      if (activeSessionId) {
        addMessageToSession(activeSessionId, newAssistantMessage, responseTokenCost);
      }
      
      setIsTyping(false);
      
      // Refresh stats to update dashboard
      refreshStats();
    }, 1500);
  };

  // Handle back button
  const handleBack = () => {
    if (cameFromSession) {
      // Came from recent sessions - go back to overview
      navigate('/student/dashboard?tab=overview');
    } else {
      // Came from models tab - go back to models with correct category
      const category = currentModel.category || 'text';
      navigate(`/student/dashboard?tab=models&category=${category}`);
    }
  };

  // Get recent sessions for this model
  const recentModelSessions = sessions
    .filter(s => s.modelId === currentModel.id && s.id !== currentSessionId)
    .slice(0, 5);

  return (
    <div className="h-screen flex bg-background relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* LEFT SIDEBAR - Sessions */}
      <div className="w-72 border-r border-white/5 flex flex-col glass relative z-10">
        <div className="p-4 border-b border-white/5 space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="w-full justify-start hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {cameFromSession ? 'Back' : 'Back to Models'}
          </Button>
          
          <Button 
            className="w-full gradient-primary glow-primary btn-press font-semibold" 
            size="sm"
            onClick={() => {
              const session = createSession(
                currentModel.id, 
                currentModel.name, 
                currentModel.category as 'text' | 'image' | 'audio'
              );
              setCurrentSessionId(session.id);
              setMessages([getWelcomeMessage()]);
              setInputMessage("");
              // Update URL to remove session param
              navigate(`/student/chat/${currentModel.id}`, { replace: true });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        {/* Model Info */}
        <div className="p-4 border-b border-white/5">
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isImageModel ? 'gradient-accent glow-accent' :
                isAudioModel ? 'gradient-success' :
                'gradient-primary glow-primary'
              }`}>
                {isImageModel ? <ImageIcon className="w-5 h-5 text-white" /> :
                 isAudioModel ? <Volume2 className="w-5 h-5 text-white" /> :
                 <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{currentModel.name}</p>
                <Badge className="gradient-secondary text-xs mt-1">{currentModel.provider}</Badge>
              </div>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">Recent Chats</p>
            {recentModelSessions.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No recent chats</p>
                <p className="text-[10px] mt-1">Start a conversation to see your history</p>
              </div>
            ) : (
              recentModelSessions.map(session => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-white/5"
                  onClick={() => {
                    navigate(`/student/chat/${session.modelId}?session=${session.id}`);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{session.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {session.messageCount} prompts • {session.tokensUsed} tokens
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Token Balance */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="glass p-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> Token Balance
              </span>
              <span className={`text-xs font-semibold ${stats.tokenBalance < 5000 ? 'text-orange-400' : 'text-blue-400'}`}>
                {stats.tokenBalance.toLocaleString()}
              </span>
            </div>
            <Progress value={(stats.tokenBalance / stats.tokenQuota) * 100} className="h-1.5" />
            {stats.tokenBalance < 5000 && (
              <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Low balance
              </p>
            )}
          </div>
          <div className="glass p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Session Tokens</span>
              <span className="text-xs font-semibold text-cyan-400">{sessionTokensUsed.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER - Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="border-b border-white/5 glass">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isImageModel ? 'gradient-accent glow-accent' :
                isAudioModel ? 'gradient-success' :
                'gradient-primary glow-primary'
              }`}>
                {isImageModel ? <ImageIcon className="w-6 h-6 text-white" /> :
                 isAudioModel ? <Volume2 className="w-6 h-6 text-white" /> :
                 <Bot className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentModel.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                  <span className="text-xs text-white/20">•</span>
                  <Badge className={`text-[10px] ${
                    isImageModel ? 'gradient-accent' :
                    isAudioModel ? 'gradient-success' :
                    'gradient-secondary'
                  }`}>{isImageModel ? 'Image' : isAudioModel ? 'Audio' : 'Text'}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-4 mr-4">
                <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs text-muted-foreground">Session Score</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-lg font-bold ${
                        sessionScore >= 80 ? 'text-emerald-400' :
                        sessionScore >= 60 ? 'text-cyan-400' :
                        sessionScore >= 40 ? 'text-orange-400' :
                        'text-pink-400'
                      }`}>{sessionScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">{sessionTokensUsed.toLocaleString()}</span>
                  <span className="text-muted-foreground">tokens</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-pink-400" />
                  <span className="font-medium">{userMessages.length}</span>
                  <span className="text-muted-foreground">prompts</span>
                </div>
              </div>
              <SkyToggle checked={isDark} onChange={toggleTheme} />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowArtifacts(!showArtifacts)}
                className="hover:bg-white/5"
              >
                {showArtifacts ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-xl gradient-primary glow-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] group ${message.role === "user" ? "order-first" : ""}`}>
                  {message.blocked && (
                    <div className="glass rounded-xl p-3 mb-2 border border-orange-500/30 bg-orange-500/5">
                      <div className="flex items-center gap-2 text-orange-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Prompt Blocked</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{message.blockReason}</p>
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl ${
                    message.role === "user"
                      ? message.blocked 
                        ? "glass-card border border-orange-500/30 bg-orange-500/5"
                        : "glass-card border border-cyan-500/30 bg-cyan-500/5"
                      : "glass-card"
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content.split('\n').map((line, i) => {
                        if (line.startsWith('```')) return null;
                        if (line.startsWith('•')) return <p key={i} className="my-1">{line}</p>;
                        if (/^\d+\./.test(line)) return <p key={i} className="my-1">{line}</p>;
                        if (line.includes('**')) {
                          const parts = line.split(/\*\*(.*?)\*\*/);
                          return (
                            <p key={i} className="my-1">
                              {parts.map((part, j) => 
                                j % 2 === 1 ? <strong key={j} className="text-primary">{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        return line ? <p key={i} className="my-1">{line}</p> : <br key={i} />;
                      })}
                      
                      {message.content.includes('```') && (
                        <div className="my-3 rounded-xl overflow-hidden glass">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                            <span className="text-xs font-medium text-muted-foreground">python</span>
                            <Button variant="ghost" size="sm" className="h-6 text-xs hover:bg-white/5">
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <pre className="p-4 text-xs overflow-x-auto text-emerald-400 font-mono">
                            <code>{message.content.match(/```[\s\S]*?\n([\s\S]*?)```/)?.[1] || ''}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}>
                    <span className="text-xs text-muted-foreground mr-2">{message.timestamp}</span>
                    {message.role === "assistant" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/5">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-10 h-10 rounded-xl gradient-secondary glow-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">You</span>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className="w-10 h-10 rounded-xl gradient-primary glow-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 glass p-4">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl overflow-hidden hover-glow">
              <div className="flex items-end gap-2 p-2">
                {!isImageModel && !isAudioModel && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 flex-shrink-0 hover:bg-white/5 relative"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.txt,.md,.doc,.docx,.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          setInputMessage(prev => prev + `\n[Attached: ${file.name}]`);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex-1 min-h-[44px] max-h-32">
                  <textarea
                    placeholder={
                      isImageModel ? "Describe the image you want to create..." :
                      isAudioModel ? "Enter text to convert to speech..." :
                      `Message ${currentModel.name}...`
                    }
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full h-full min-h-[44px] bg-transparent border-none outline-none resize-none text-sm py-3 px-2"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  className={`btn-press h-10 px-4 ${
                    isImageModel ? 'gradient-accent glow-accent' :
                    isAudioModel ? 'gradient-success' :
                    'gradient-primary glow-primary'
                  }`}
                  disabled={isTyping || !inputMessage.trim()}
                >
                  {isImageModel ? <ImageIcon className="w-4 h-4" /> :
                   isAudioModel ? <Volume2 className="w-4 h-4" /> :
                   <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isImageModel ? "Describe your image • Be specific for better results" :
               isAudioModel ? "Enter text to convert to audio" :
               "Press Enter to send • Shift+Enter for new line"}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Prompt Score Analysis */}
      {showArtifacts && (
        <div className="w-96 border-l border-white/5 flex flex-col glass relative z-10 animate-slide-in-right">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-secondary glow-secondary flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Prompt Analysis</h3>
                  <p className="text-xs text-muted-foreground">Learn to write better prompts</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 hover:bg-white/5"
                onClick={() => setShowArtifacts(false)}
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 custom-scrollbar">
            {(() => {
              const latestUserMessage = userMessages[userMessages.length - 1];
              
              if (!latestUserMessage) {
                return (
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 rounded-2xl gradient-primary glow-primary flex items-center justify-center mx-auto mb-4 opacity-50">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-medium mb-2">No prompts yet</p>
                    <p className="text-xs text-muted-foreground">Send a message to see your prompt analysis</p>
                  </div>
                );
              }

              return (
                <div className="p-4 space-y-4">
                  {/* Current Score */}
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Prompt Score</p>
                        <p className="text-xs text-muted-foreground mt-1">Prompt #{userMessages.length}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {latestUserMessage.tokensUsed} tokens
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-5xl font-bold ${
                        (latestUserMessage.score || 0) >= 80 ? 'text-emerald-400' :
                        (latestUserMessage.score || 0) >= 60 ? 'text-cyan-400' :
                        (latestUserMessage.score || 0) >= 40 ? 'text-orange-400' :
                        'text-pink-400'
                      }`}>{latestUserMessage.score}</div>
                      <div className="flex-1 space-y-1">
                        {latestUserMessage.scoreBreakdown && Object.entries(latestUserMessage.scoreBreakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 capitalize">{key}</span>
                            <Progress value={value} className="h-1 flex-1" />
                            <span className="text-[10px] font-medium w-6">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs">
                      <span className="text-muted-foreground">Session Average</span>
                      <span className="font-bold">{sessionScore}/100 ({userMessages.length} prompts)</span>
                    </div>
                  </div>

                  {/* Strengths */}
                  {latestUserMessage.feedback?.strengths && latestUserMessage.feedback.strengths.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-emerald-400">Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {latestUserMessage.feedback.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span className="text-muted-foreground">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Biggest Gap */}
                  {latestUserMessage.feedback?.biggestGap && (latestUserMessage.score || 0) < 80 && (
                    <div className="glass rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <h4 className="text-sm font-semibold text-orange-400">Biggest Gap</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{latestUserMessage.feedback.biggestGap}</p>
                    </div>
                  )}

                  {/* Learning Through Comparison */}
                  {latestUserMessage.feedback && (
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold">Learn by Comparison</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsDown className="w-3 h-3 text-pink-400" />
                            <span className="text-xs font-medium text-pink-400">Weak Prompt</span>
                          </div>
                          <p className="text-xs font-mono bg-black/20 p-2 rounded mb-2">"{latestUserMessage.feedback.weakExample.prompt}"</p>
                          <p className="text-[10px] text-pink-300">⚠️ {latestUserMessage.feedback.weakExample.issue}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-400">Strong Prompt</span>
                          </div>
                          <p className="text-xs font-mono bg-black/20 p-2 rounded mb-2">"{latestUserMessage.feedback.strongExample.prompt}"</p>
                          <p className="text-[10px] text-emerald-300">✓ {latestUserMessage.feedback.strongExample.why}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions to Guide Your Thinking */}
                  {latestUserMessage.feedback?.guidingQuestions && (latestUserMessage.score || 0) < 80 && (
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-semibold">Questions to Consider</h4>
                      </div>
                      <ul className="space-y-2">
                        {latestUserMessage.feedback.guidingQuestions.map((question, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-blue-400 mt-0.5">?</span>
                            <span className="text-muted-foreground italic">{question}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What to Try Next */}
                  {latestUserMessage.feedback?.whatToTryNext && (
                    <div className="glass rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-primary">What to Try Next</h4>
                      </div>
                      <ul className="space-y-2">
                        {latestUserMessage.feedback.whatToTryNext.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-primary font-bold">{idx + 1}.</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Artifacts Section */}
                  {artifacts.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Recent Artifacts</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      
                      {artifacts.slice(0, 2).map((artifact) => (
                        <Card key={artifact.id} className="glass-card card-hover overflow-hidden">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              {artifact.type === 'code' ? <Code className="w-4 h-4 text-blue-400" /> :
                               artifact.type === 'image' ? <ImageIcon className="w-4 h-4 text-pink-400" /> :
                               <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-xs font-medium truncate flex-1">{artifact.title}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {new Date(artifact.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              );
            })()}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default StudentChat;
