import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AgentChatInput } from '@/components/app/AgentChatInput';
import { AgentSuggestedPrompts } from '@/components/app/AgentSuggestedPrompts';
import { AgentVoiceRecorder } from '@/components/app/AgentVoiceRecorder';
import { praxisAgentOrchestrator } from '@/lib/praxisAgentOrchestrator';
import type { PraxisAgentMessage, AgentStage } from '@/types/praxis';
import { ArrowLeft, Bot } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSEO } from '@/hooks/useSEO';
import { toast } from 'sonner';

const STORAGE_KEY = 'praxis_agent_state';
const SUGGESTED_PROMPTS = [
  'Work dinner in Riyadh',
  'First date',
  'Wedding guest',
  'Hot weather smart casual',
];

export default function Agent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  useSEO(); // Set SEO metadata for this route
  const [messages, setMessages] = useState<PraxisAgentMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<AgentStage>('intake');

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        praxisAgentOrchestrator.loadState(parsed);
        setMessages(praxisAgentOrchestrator.getConversationHistory());
        setStage(praxisAgentOrchestrator.getCurrentStage());
      } catch (error) {
        console.error('Failed to load agent state:', error);
      }
    } else {
      // Initialize with welcome message
      const welcomeMessage: PraxisAgentMessage = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m Praxis Agent. Tell me what you need, and I\'ll handle the rest.',
        createdAt: new Date(),
      };
      setMessages([welcomeMessage]);
      praxisAgentOrchestrator.reset();
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      const state = praxisAgentOrchestrator.getState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [messages, stage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: PraxisAgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Process with orchestrator (now async with OpenAI)
      const context = praxisAgentOrchestrator.getContext();
      const response = await praxisAgentOrchestrator.processUserMessage(text, context);

    // Add assistant response
    const assistantMessage: PraxisAgentMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.assistantMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setStage(response.nextStage);

      // Handle actions with auto-navigation
      if (response.actions) {
        for (const action of response.actions) {
          if (action.type === 'request_capture') {
            // Navigate to capture page after a short delay
            setTimeout(() => {
              navigate('/agent/capture');
            }, 1500);
          } else if (action.type === 'generate_outfits') {
            // Navigate to results page after a short delay
            setTimeout(() => {
              navigate('/agent/results');
            }, 1500);
          }
        }
      } else if (response.nextStage === 'generate') {
        // Auto-navigate to results if stage is generate
        setTimeout(() => {
          navigate('/agent/results');
        }, 1500);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    setIsRecording(false);
    // Send the transcript (now using real Whisper transcription)
    if (transcript && transcript.trim()) {
      await handleSendMessage(transcript);
    }
  };

  const handleAttachment = () => {
    navigate('/agent/capture');
  };

  const handleSelectPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-4 md:px-6 h-14 flex items-center w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="shrink-0"
                aria-label="Back to home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h1 className="font-serif text-xl font-medium text-foreground tracking-wide">
                  Praxis Agent
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-24 flex flex-col overflow-hidden">
        {/* Subtext */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm text-muted-foreground text-center">
            Tell me what you need. I'll handle the rest.
          </p>
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <AgentSuggestedPrompts prompts={SUGGESTED_PROMPTS} onSelectPrompt={handleSelectPrompt} />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          {isRecording ? (
            <div className="px-4 py-2">
              <AgentVoiceRecorder
                onTranscript={handleVoiceTranscript}
                onError={(error) => {
                  console.error(error);
                  setIsRecording(false);
                }}
              />
            </div>
          ) : (
            <AgentChatInput
              onSendMessage={handleSendMessage}
              onVoiceRecord={() => setIsRecording(true)}
              onAttachment={handleAttachment}
              isRecording={false}
              disabled={isProcessing}
              placeholder="Tell me what you need..."
            />
          )}
        </div>
      </main>
    </div>
  );
}
