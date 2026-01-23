import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AgentVoiceRecorder } from '@/components/app/AgentVoiceRecorder';
import { praxisAgentOrchestrator } from '@/lib/praxisAgentOrchestrator';
import { useUser } from '@clerk/clerk-react';
import type { AgentStage } from '@/types/praxis';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSEO } from '@/hooks/useSEO';
import { toast } from 'sonner';
import { MinimalAIScene } from '@/components/ai/MinimalAIScene';
import { MinimalResponseDisplay } from '@/components/ai/MinimalResponseDisplay';
import { MinimalInput } from '@/components/ai/MinimalInput';

export default function Agent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  useSEO();
  const [currentResponse, setCurrentResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stage, setStage] = useState<AgentStage>('intake');
  const [announcement, setAnnouncement] = useState('');

  // Initialize fresh conversation on mount
  useEffect(() => {
    praxisAgentOrchestrator.reset();
    setCurrentResponse('Hi! I\'m Praxis Agent. Tell me what you need, and I\'ll handle the rest.');
    setStage('intake');
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setCurrentResponse(''); // Clear previous response

    try {
      // Process with orchestrator
      const context = praxisAgentOrchestrator.getContext();
      const response = await praxisAgentOrchestrator.processUserMessage(text, context);

      // Set assistant response
      setCurrentResponse(response.assistantMessage);
      setStage(response.nextStage);
      // Announce for screen readers
      setAnnouncement(response.assistantMessage);

      // Handle actions with auto-navigation
      if (response.actions) {
        for (const action of response.actions) {
          if (action.type === 'request_capture') {
            setTimeout(() => {
              navigate('/agent/capture');
            }, 2000);
          } else if (action.type === 'generate_outfits') {
            setTimeout(() => {
              navigate('/agent/results');
            }, 2000);
          }
        }
      } else if (response.nextStage === 'generate') {
        setTimeout(() => {
          navigate('/agent/results');
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setCurrentResponse('Sorry, I encountered an error. Please try again.');
      toast.error('Failed to process message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    setIsRecording(false);
    if (transcript && transcript.trim()) {
      await handleSendMessage(transcript);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col relative overflow-hidden">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/20 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800" style={{ pointerEvents: 'auto' }}>
        <div className="px-4 h-14 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-14 flex flex-col items-center">
        {/* 3D Head Container - Isolated */}
        <div className="w-full flex-shrink-0">
          <MinimalAIScene 
            isSpeaking={!!currentResponse && !isProcessing}
            isThinking={isProcessing}
            particleCount={isMobile ? 300 : 500}
          />
        </div>

        {/* Intro Text - Below 3D Head */}
        {!currentResponse && (
          <p className="text-center text-gray-700 dark:text-gray-300 text-lg mt-4 mb-8 px-4 z-10 relative">
            Hi! I'm Praxis Agent. Tell me what you need, and I'll handle the rest.
          </p>
        )}

        {/* Screen reader announcement */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>

        {/* Response Display - Below intro text */}
        <div className="w-full max-w-2xl px-4 mb-8 z-10 relative">
          <MinimalResponseDisplay
            text={currentResponse}
            isVisible={!!currentResponse}
            isTyping={isProcessing}
          />
        </div>

        {/* Input Container - Clearly separated */}
        <div className="w-full max-w-xl px-4 mb-8 z-10 relative" style={{ pointerEvents: 'auto' }}>
          {!isRecording ? (
            <MinimalInput
              onSendMessage={handleSendMessage}
              onVoiceRecord={() => setIsRecording(true)}
              disabled={isProcessing}
              placeholder="Ask me anything..."
            />
          ) : (
            <div className="rounded-full bg-white/90 dark:bg-black/30 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 p-4">
              <AgentVoiceRecorder
                onTranscript={handleVoiceTranscript}
                onError={(error) => {
                  console.error(error);
                  setIsRecording(false);
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
