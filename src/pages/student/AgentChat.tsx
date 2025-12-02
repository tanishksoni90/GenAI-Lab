import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SkyToggle from "@/components/ui/sky-toggle";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser, ChatMessage, AIAgent } from "@/contexts/UserContext";
import { 
  ArrowLeft, Send, Plus, MessageSquare, EyeOff, Bot, 
  Sparkles, Zap, Code, Target, TrendingUp, AlertTriangle,
  Copy, ThumbsUp, ThumbsDown, RefreshCw, PanelRightClose,
  PanelRight, Loader2, CheckCircle, Info, FileText, Shield
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { calculateRequestCost } from "@/lib/modelPricing";

const AgentChat = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { 
    stats, 
    agents,
    getAgent,
    createAgentSession,
    getSession,
    addMessageToSession,
    getAgentSessions,
    artifacts,
    refreshStats
  } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get the agent
  const agent = agentId ? getAgent(agentId) : undefined;
  
  // Check if we're opening an existing session
  const sessionIdFromUrl = searchParams.get('session');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdFromUrl);
  
  // Get or create session
  useEffect(() => {
    if (!agent) return;
    
    if (sessionIdFromUrl) {
      // Load existing session
      setCurrentSessionId(sessionIdFromUrl);
    } else if (!currentSessionId) {
      // Create new session
      const newSession = createAgentSession(agent.id);
      if (newSession) {
        setCurrentSessionId(newSession.id);
      }
    }
  }, [agent, sessionIdFromUrl]);
  
  // Get welcome message
  const getWelcomeMessage = (): ChatMessage => ({
    id: "welcome-1",
    role: "assistant",
    content: agent 
      ? `Hello! I'm **${agent.name}**, powered by ${agent.modelName}.\n\n${agent.description || "I'm here to help you with your questions."}\n\n${agent.knowledgeBaseFiles.length > 0 ? `📚 I have access to ${agent.knowledgeBaseFiles.length} knowledge base file(s) to help answer your questions.\n\n` : ''}How can I assist you today?`
      : "Hello! How can I help you?",
    timestamp: new Date().toLocaleTimeString(),
  });
  
  // Initialize messages
  const existingSession = currentSessionId ? getSession(currentSessionId) : null;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (existingSession && existingSession.messages.length > 0) {
      return existingSession.messages;
    }
    return [getWelcomeMessage()];
  });
  
  // Load session messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      const session = getSession(currentSessionId);
      if (session && session.messages.length > 0) {
        setMessages(session.messages);
      } else {
        setMessages([getWelcomeMessage()]);
      }
    }
  }, [currentSessionId]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  // Calculate session tokens used
  const sessionTokensUsed = messages.reduce((acc, m) => acc + (m.tokensUsed || 0), 0);
  
  // Get recent sessions for this agent
  const agentSessions = agent ? getAgentSessions(agent.id).filter(s => s.id !== currentSessionId) : [];
  
  // Calculate session score
  const userMessages = messages.filter(m => m.role === "user" && m.score !== undefined && m.score > 0);
  const sessionScore = userMessages.length > 0
    ? Math.floor(userMessages.reduce((acc, m) => acc + (m.score || 0), 0) / userMessages.length)
    : 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Score prompt (same logic as regular chat)
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
    const hasContext = prompt.toLowerCase().includes("because") || prompt.toLowerCase().includes("since");
    
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
    if (breakdown.clarity >= 70) strengths.push("Clear and understandable request");
    if (breakdown.specificity >= 70) strengths.push("Good level of detail");
    if (breakdown.context >= 70) strengths.push("Builds well on conversation context");
    if (hasQuestion) strengths.push("Uses question format effectively");

    const feedback = {
      strengths: strengths.length > 0 ? strengths : ["You submitted a prompt - that's the first step!"],
      biggestGap: score < 60 ? "Try adding more specific details to your prompt." : "Great job!",
      weakExample: { prompt: "Tell me about coding", issue: "Too vague" },
      strongExample: { prompt: "Can you explain how Python list comprehensions work?", why: "Specific and clear" },
      guidingQuestions: ["What specific outcome do you want?", "Can you add more context?"],
      whatToTryNext: ["Add specific examples", "Be more precise about your goal"]
    };

    return { score, breakdown, blocked: false, feedback };
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !agent || !currentSessionId) return;

    const inputTokens = Math.ceil(inputMessage.length / 4);
    const estimatedOutputTokens = 150;
    const userTokenCost = calculateRequestCost(agent.modelId, inputTokens, 0, inputMessage.length);
    const responseTokenCost = calculateRequestCost(agent.modelId, 0, estimatedOutputTokens, inputMessage.length);
    const totalCost = userTokenCost + responseTokenCost;
    
    if (stats.tokenBalance < totalCost) {
      return;
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
    addMessageToSession(currentSessionId, newUserMessage, userTokenCost, blocked ? undefined : score);

    if (blocked) {
      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      const newAssistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `Based on my knowledge base and the ${agent.modelName} model, here's my response:\n\nThis is a simulated response from the **${agent.name}** agent. In production, this would use RAG (Retrieval-Augmented Generation) to:\n\n1. Search through the uploaded knowledge base files\n2. Find relevant context\n3. Generate a response using ${agent.modelName}\n\n${agent.behaviorPrompt ? `My behavior is guided by: "${agent.behaviorPrompt}"` : ''}\n\nWould you like me to elaborate on any specific aspect?`,
        timestamp: new Date().toLocaleTimeString(),
        tokensUsed: responseTokenCost,
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      addMessageToSession(currentSessionId, newAssistantMessage, responseTokenCost);
      setIsTyping(false);
      refreshStats();
    }, 1500);
  };

  if (!agent) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
          <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/student/dashboard?tab=agents')}>
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-aurora" />
      <div className="fixed inset-0 noise pointer-events-none" />

      {/* LEFT SIDEBAR - Agent Sessions */}
      <div className="w-72 border-r border-white/5 flex flex-col glass relative z-10">
        <div className="p-4 border-b border-white/5 space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/student/dashboard?tab=agents')}
            className="w-full justify-start hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>
          
          <Button 
            className="w-full gradient-accent glow-accent btn-press font-semibold" 
            size="sm"
            onClick={() => {
              const newSession = createAgentSession(agent.id);
              if (newSession) {
                setCurrentSessionId(newSession.id);
                setMessages([getWelcomeMessage()]);
                navigate(`/student/agent-chat/${agent.id}`, { replace: true });
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        {/* Agent Info */}
        <div className="p-4 border-b border-white/5">
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{agent.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge className="gradient-primary text-[10px]">Powered by</Badge>
                  <span className="text-[10px] text-muted-foreground">{agent.modelName}</span>
                </div>
              </div>
            </div>
            {agent.knowledgeBaseFiles.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  {agent.knowledgeBaseFiles.length} KB file(s)
                </div>
              </div>
            )}
            {agent.guardrails.length > 0 && (
              <div className="mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  {agent.guardrails.length} guardrail(s)
                </div>
              </div>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-3">Agent Sessions</p>
            {agentSessions.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No previous sessions</p>
                <p className="text-[10px] mt-1">Start chatting to create sessions</p>
              </div>
            ) : (
              agentSessions.slice(0, 10).map(session => (
                <Button
                  key={session.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-white/5"
                  onClick={() => {
                    navigate(`/student/agent-chat/${agent.id}?session=${session.id}`);
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
              <div className="w-12 h-12 rounded-2xl gradient-accent glow-accent flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{agent.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">Powered by</span>
                  <Badge className="gradient-primary text-[10px]">{agent.modelName}</Badge>
                  <Badge className={`text-[10px] ${agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {agent.status}
                  </Badge>
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
                  <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center flex-shrink-0">
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
                        : "glass-card border border-pink-500/30 bg-pink-500/5"
                      : "glass-card"
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content.split('\n').map((line, i) => {
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
                <div className="w-10 h-10 rounded-xl gradient-accent glow-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass-card p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    <span className="text-sm text-muted-foreground">{agent.name} is thinking...</span>
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
                <div className="flex-1 min-h-[44px] max-h-32">
                  <textarea
                    placeholder={`Message ${agent.name}...`}
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
                  className="btn-press h-10 px-4 gradient-accent glow-accent"
                  disabled={isTyping || !inputMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send • Shift+Enter for new line
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
                    <div className="w-20 h-20 rounded-2xl gradient-accent glow-accent flex items-center justify-center mx-auto mb-4 opacity-50">
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
                  {latestUserMessage.feedback?.strengths && (
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
                </div>
              );
            })()}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AgentChat;

