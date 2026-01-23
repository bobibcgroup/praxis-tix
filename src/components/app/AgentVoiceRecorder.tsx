import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentVoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const AgentVoiceRecorder = ({ onTranscript, onError }: AgentVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // For MVP: Use Web Speech API for transcription
        // In production, this would call a speech-to-text service
        setIsProcessing(true);
        
        try {
          // Mock transcription for MVP - in production, use a real service
          // For now, we'll use a simple prompt
          const mockTranscript = '[Voice message recorded - transcription coming soon]';
          onTranscript(mockTranscript);
        } catch (error) {
          onError?.('Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      onError?.('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Processing audio...
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-destructive/10 border-t border-border">
        <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
        <span className="text-sm font-medium text-destructive">Recording...</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="ml-auto"
        >
          <Square className="w-4 h-4 mr-2" />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startRecording}
      className="shrink-0"
      aria-label="Start voice recording"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
};
