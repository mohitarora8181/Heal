import { useEffect, useRef, useState, useCallback, type JSX, MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../../auth/AuthContext';

function RoomPage(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<AudioWorkletNode | null>(null);

  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [joinStatus, setJoinedStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string>("");
  const [conversation, setConversation] = useState<string>("");
  const [popupPos, setPopupPos] = useState({ x: 32, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { currentUser } = useAuth();

  // Keep a ref to always have the latest conversation for onLeaveRoom
  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Drag handlers
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - popupPos.x,
      y: e.clientY - popupPos.y,
    };
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleDrag = (e: MouseEvent) => {
      if (!dragging) return;
      setPopupPos({
        x: Math.max(0, e.clientX - dragOffset.current.x),
        y: Math.max(0, e.clientY - dragOffset.current.y),
      });
    };
    const handleDragEnd = () => {
      setDragging(false);
      document.body.style.userSelect = '';
    };
    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dragging]);

  useEffect(() => {
    if (!socketRef.current) {
      setConnectionStatus('connecting');
      socketRef.current = io('http://localhost:4000', {
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });


      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setConnectionStatus('connected');
        setError("");
      });

      if (currentUser?.name && roomId) {
        console.log('Joining room:', roomId, 'as user:', currentUser.name);
        socket.emit('join_room', { roomId, user: currentUser.name });
      }

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnectionStatus('disconnected');
        setIsTranscribing(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('disconnected');
        setError("Failed to connect to transcription service");
      });

      socket.on('transcript', (data: any) => {
        console.log('Received transcript:', data);
        setTranscript(prev => {
          const newTranscript = prev ? `${prev}\n${typeof data === 'string' ? data : data.text}` : (typeof data === 'string' ? data : data.text);
          return newTranscript;
        });
        if (typeof data === 'object' && data.user && data.text) {
          setConversation(prev => {
            const line = `${data.user}: ${data.text}`;
            return prev ? `${prev}\n${line}` : line;
          });
        }
      });

      socket.on('transcription_error', (error: string) => {
        console.error('Transcription error:', error);
        setError(`Transcription error: ${error}`);
        setIsTranscribing(false);
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        setError("Socket connection error");
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser, roomId]);

  const convertFloat32ToInt16 = useCallback((buffer: Float32Array): ArrayBuffer => {
    const length = buffer.length;
    const result = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      const clampedValue = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = Math.round(clampedValue * 0x7FFF);
    }
    return result.buffer;
  }, []);

  const startTranscription = useCallback(async () => {
    if (isTranscribing || !socketRef.current || connectionStatus !== 'connected') {
      return;
    }
    try {
      setIsTranscribing(true);
      setError("");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: 16000 },
          channelCount: { ideal: 1 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }).catch((err) => {
        if (err.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone access and try again.');
        } else if (err.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else {
          throw new Error(`Failed to access microphone: ${err.message}`);
        }
      });

      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      try {
        await audioContext.audioWorklet.addModule('/audio-processor.js');
      } catch (error) {
        console.error('Failed to load audio worklet module:', error);
        throw new Error('Failed to load audio processing module. Please ensure the audio-processor.js file is available.');
      }

      const source = audioContext.createMediaStreamSource(stream);

      let processor: AudioWorkletNode;
      try {
        processor = new AudioWorkletNode(audioContext, 'audio-processor');
      } catch (error) {
        console.error('Failed to create AudioWorkletNode:', error);
        throw new Error('Failed to create audio processor node');
      }

      processorNodeRef.current = processor;

      processor.port.onmessage = (event) => {
        const audioData = event.data;
        if (audioData && socketRef.current?.connected) {
          try {
            const int16Data = convertFloat32ToInt16(audioData);
            socketRef.current.emit('audio_chunk', int16Data);
          } catch (err) {
            console.error('Error processing audio data:', err);
          }
        }
      };

      processor.onprocessorerror = (event) => {
        console.error('Audio worklet processor error:', event);
        setError('Audio processing error occurred');
      };

      source.connect(processor);

      socketRef.current.emit('start_transcription');

      console.log('Transcription started successfully');
    } catch (error: any) {
      console.error('Error starting transcription:', error);
      setError(error.message || 'Failed to start transcription');
      setIsTranscribing(false);

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isTranscribing, connectionStatus, convertFloat32ToInt16]);

  const stopTranscription = useCallback(() => {
    console.log('Stopping transcription...');
    setIsTranscribing(false);
    setError("");

    if (processorNodeRef.current) {
      try {
        processorNodeRef.current.disconnect();
      } catch (err) {
        console.warn('Error disconnecting processor node:', err);
      }
      processorNodeRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {
        console.warn('Error closing audio context:', err);
      }
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping media track:', err);
        }
      });
      mediaStreamRef.current = null;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stop_transcription');
    }
  }, []);

  // const clearTranscript = useCallback(() => {
  //   setTranscript("");
  //   setError("");
  // }, []);

  useEffect(() => {
    if (!roomId || !containerRef.current || !currentUser?.name) return;

    const appID = 1043447705;
    const secret = "b0820d28b88b6d9756c119e1730a0824";
    const userID = `user_${Math.random().toString(36).slice(2)}`;
    const userName = currentUser?.name || userID;

    let zc: any;
    try {
      const KitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, secret, roomId, userID, userName
      );

      zc = ZegoUIKitPrebuilt.create(KitToken);
      zc.joinRoom({
        container: containerRef.current!,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        showScreenSharingButton: true,
        showTextChat: true,
        showUserList: true,
        maxUsers: 10,
        layout: "Grid",
        onJoinRoom: () => {
          console.log('Successfully joined room:', roomId);
        },
        onLeaveRoom: () => {
          console.log('Left room:', roomId);
          // Save conversation automatically when meeting ends
          if (socketRef.current && conversationRef.current.trim()) {
            console.log('Saving conversation on leave:', conversationRef.current);
            socketRef.current.emit('save_conversation', { roomId, conversation: conversationRef.current });
          }
        }
      });
    } catch (error) {
      console.error('Error initializing video conference:', error);
      setError('Failed to initialize video conference');
    }

    return () => {
      stopTranscription();
      // Optionally leave the room if needed
      if (zc && typeof zc.leaveRoom === 'function') {
        zc.leaveRoom();
      }
    };
  }, [roomId, stopTranscription, currentUser]);

  return (
    <div className="relative h-screen flex flex-col">
      <div ref={containerRef} className="w-full flex-1" />

      {/* Draggable Live Transcript Popup - left bottom */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: popupPos.x,
          top: popupPos.y,
          bottom: 'auto',
        }}
      >
        <div
          className="min-w-[320px] max-w-xl bg-white/95 rounded-2xl shadow-2xl border border-gray-200 pointer-events-auto px-6 py-4 flex flex-col gap-2"
          style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
          {/* Drag handle */}
          <div
            className="flex items-center gap-3 mb-1 flex-wrap cursor-move"
            onMouseDown={handleDragStart}
          >
            <h3 className="m-0 text-base font-semibold text-indigo-700 select-none">Live Transcript</h3>
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600 select-none">
              {connectionStatus === 'connected' ? 'Connected' :
                connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
            <button
              onClick={isTranscribing ? stopTranscription : startTranscription}
              disabled={connectionStatus !== 'connected'}
              className={`px-3 py-1 rounded text-xs font-medium ml-2 ${isTranscribing ? 'bg-red-600' : 'bg-green-600'} text-white disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isTranscribing ? 'Stop' : 'Start'}
            </button>
            
          </div>
          {error && (
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs mb-1 border border-red-200">
              ⚠️ {error}
            </div>
          )}
          <div className="min-h-[40px] max-h-[120px] overflow-y-auto bg-indigo-50 rounded-lg px-3 py-2 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words border border-gray-200">
            {conversation ? (
              <div>{conversation}</div>
            ) : (
              <div className="text-gray-400 italic">
                {isTranscribing ? 'Listening...' :
                  connectionStatus !== 'connected' ? 'Please wait for connection...' :
                    'Click "Start" to begin live transcription'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;