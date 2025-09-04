import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  Brain, 
  Lightbulb,
  MessageCircle,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'explanation';
  context?: string;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm your AI Study Tutor. I can help you understand concepts, generate practice questions, explain difficult topics, and provide personalized learning recommendations. What would you like to learn about today?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickSuggestions = [
    "Explain photosynthesis in simple terms",
    "Generate practice problems for calculus",
    "Help me understand Newton's laws",
    "Create a study plan for chemistry",
    "What are the key concepts in molecular biology?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = (userMessage: string): string => {
    // Simple response simulation based on keywords
    const message = userMessage.toLowerCase();
    
    if (message.includes('photosynthesis')) {
      return "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. Think of it as nature's way of capturing solar energy! The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Would you like me to explain the light-dependent and light-independent reactions in detail?";
    } else if (message.includes('calculus') || message.includes('derivative')) {
      return "I'd be happy to help with calculus! Derivatives represent the rate of change of a function. For example, if f(x) = x², then f'(x) = 2x. This tells us how quickly the function is changing at any point. Would you like me to generate some practice problems or explain specific derivative rules?";
    } else if (message.includes('newton') || message.includes('physics')) {
      return "Newton's laws are fundamental to understanding motion! Law 1: Objects at rest stay at rest unless acted upon by a force. Law 2: F = ma (force equals mass times acceleration). Law 3: For every action, there's an equal and opposite reaction. Which law would you like to explore with examples?";
    } else if (message.includes('study plan') || message.includes('schedule')) {
      return "Creating an effective study plan involves breaking topics into manageable chunks and using spaced repetition. I recommend: 1) Identify your learning goals, 2) Allocate time based on difficulty, 3) Include regular review sessions, 4) Use active recall techniques. What subject are you planning to study?";
    } else {
      return `I understand you're asking about "${userMessage}". Let me help you break this down into key concepts and provide a clear explanation. Based on your question, I recommend focusing on the fundamental principles first, then building up to more complex applications. Would you like me to create a step-by-step learning path for this topic?`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        content: simulateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date(),
        type: 'explanation'
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
        <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-gradient-primary' : 'bg-gradient-secondary'
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Bot className="h-4 w-4 text-secondary-foreground" />
            )}
          </div>
          
          <div className={`rounded-lg p-4 ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'glass-effect border border-border/50'
          }`}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            
            {!isUser && (
              <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-border/30">
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(message.content)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost">
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost">
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <div className="text-xs text-muted-foreground ml-auto">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-effect border-0 h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>AI Study Tutor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-success rounded-full mr-1 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="glass-effect border border-border/50 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground mb-3 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              Quick suggestions:
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-auto py-2 text-left"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="flex-1 bg-muted/20 border-border/50 focus:border-primary/50"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              size="lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </CardContent>
    </Card>
  );
};