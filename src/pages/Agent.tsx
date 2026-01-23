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
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-[#050510] to-black -z-10" />
      
      {/* Minimal AI Scene with Robotic Head */}
      <MinimalAIScene 
        isSpeaking={!!currentResponse && !isProcessing}
        isThinking={isProcessing}
        particleCount={isMobile ? 500 : 800}
      />

      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-sm border-b border-cyan-500/10">
        <div className="px-4 h-12 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/10"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Screen reader announcement */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Response Display - Under the head */}
      <MinimalResponseDisplay
        text={currentResponse}
        isVisible={!!currentResponse}
        isTyping={isProcessing}
      />

      {/* Minimal Input */}
      {!isRecording ? (
        <MinimalInput
          onSendMessage={handleSendMessage}
          onVoiceRecord={() => setIsRecording(true)}
          disabled={isProcessing}
          placeholder="Ask me anything..."
        />
      ) : (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-xl px-4 z-50">
          <div className="rounded-full bg-black/30 backdrop-blur-xl border border-cyan-500/20 p-4">
            <AgentVoiceRecorder
              onTranscript={handleVoiceTranscript}
              onError={(error) => {
                console.error(error);
                setIsRecording(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
