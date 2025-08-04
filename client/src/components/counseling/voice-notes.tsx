import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Save, 
  FileText, 
  Clock,
  User,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceNotesProps {
  leadId: number;
  leadName: string;
  onSave?: (notes: string, summary: string) => void;
}

interface CounselingSession {
  id: string;
  leadId: number;
  counselorName: string;
  timestamp: Date;
  duration: number;
  transcript: string;
  summary: string;
  keyPoints: string[];
  nextActions: string[];
  sentiment: "positive" | "neutral" | "negative";
}

export default function VoiceNotes({ leadId, leadName, onSave }: VoiceNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<CounselingSession>) => {
      const response = await apiRequest("POST", "/api/counseling-sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
      toast({
        title: "Session Saved",
        description: "Counseling session has been saved successfully",
      });
    }
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const response = await apiRequest("POST", "/api/ai/summarize-session", {
        transcript,
        leadId,
        leadName
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newSession: CounselingSession = {
        id: Date.now().toString(),
        leadId,
        counselorName: "Current User",
        timestamp: new Date(),
        duration,
        transcript,
        summary: data.summary,
        keyPoints: data.keyPoints,
        nextActions: data.nextActions,
        sentiment: data.sentiment
      };
      
      setSessions(prev => [newSession, ...prev]);
      if (onSave) {
        onSave(transcript, data.summary);
      }
    }
  });

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }
        
        setTranscript(prev => prev + finalTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Speech Recognition Error",
          description: "There was an issue with speech recognition. Please try again.",
          variant: "destructive"
        });
      };
      
      recognitionRef.current = recognition;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      initializeSpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      toast({
        title: "Recording Started",
        description: "Voice recording and transcription in progress",
      });
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }

      toast({
        title: "Recording Stopped",
        description: "Processing audio and generating summary...",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateSummary = () => {
    if (transcript.trim()) {
      generateSummaryMutation.mutate(transcript);
    } else {
      toast({
        title: "No Content",
        description: "Please record some notes before generating summary",
        variant: "destructive"
      });
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-100 text-green-800";
      case "negative": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="mr-2" size={20} />
            Voice Notes - {leadName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
              
              {duration > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  {formatDuration(duration)}
                </div>
              )}
              
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600">Recording...</span>
                </div>
              )}
            </div>

            {transcript && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Live Transcript
                  </label>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Transcript will appear here as you speak..."
                    rows={6}
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={generateSummary}
                    disabled={generateSummaryMutation.isPending}
                    variant="outline"
                  >
                    <FileText className="mr-2" size={16} />
                    {generateSummaryMutation.isPending ? "Generating..." : "Generate Summary"}
                  </Button>
                  
                  <Button
                    onClick={() => setTranscript("")}
                    variant="outline"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Counseling Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        <span className="font-medium">{session.counselorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {session.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                    </div>
                    <Badge className={getSentimentColor(session.sentiment)}>
                      {session.sentiment}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Summary</h4>
                      <p className="text-sm text-gray-700">{session.summary}</p>
                    </div>

                    {session.keyPoints.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Key Points</h4>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {session.keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {session.nextActions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Next Actions</h4>
                        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                          {session.nextActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}