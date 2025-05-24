import React, { useEffect, useRef, useState, useCallback, type JSX } from 'react';
import { useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import io, { Socket } from 'socket.io-client';


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
  const [error, setError] = useState<string>("");

  // Initialize socket connection
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

      socket.on('transcript', (data: string) => {
        console.log('Received transcript:', data);
        setTranscript(prev => {
          const newTranscript = prev ? `${prev}\n${data}` : data;
          return newTranscript;
        });
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
  }, []);

  const convertFloat32ToInt16 = useCallback((buffer: Float32Array): ArrayBuffer => {
    const length = buffer.length;
    const result = new Int16Array(length);
    
    for (let i = 0; i < length; i++) {
      // Clamp the value between -1 and 1, then convert to 16-bit
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
      console.log('Starting transcription...');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Get user media with error handling
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

      // Create audio context with error handling
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }

      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      const audioContext = audioContextRef.current;

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Load audio worklet processor - changed from .ts to .js
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

      // Connect the nodes
      source.connect(processor);
      // Note: Don't connect to destination to avoid feedback

      // Notify server that transcription started
      socketRef.current.emit('start_transcription');

      console.log('Transcription started successfully');
    } catch (error: any) {
      console.error('Error starting transcription:', error);
      setError(error.message || 'Failed to start transcription');
      setIsTranscribing(false);
      
      // Cleanup on error
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

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  // Initialize video conference
  useEffect(() => {
    if (!roomId || !containerRef.current) return;

    const initializeConference = () => {
      // Use environment variables for credentials
      const appID = 1043447705;
      const secret = "b0820d28b88b6d9756c119e1730a0824";
      const userID = `user_${Math.random().toString(36).slice(2)}`;
      const userName = `User_${Math.random().toString(36).slice(2, 8)}`;

      try {
        const KitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, secret, roomId, userID, userName
        );
        
        const zc = ZegoUIKitPrebuilt.create(KitToken);
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
          }
        });
      } catch (error) {
        console.error('Error initializing video conference:', error);
        setError('Failed to initialize video conference');
      }
    };

    initializeConference();

    // Cleanup function
    return () => {
      stopTranscription();
    };
  }, [roomId, stopTranscription]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Video Conference Container */}
      <div ref={containerRef} style={{ width: "100%", height: "70vh", flex: 1 }} />
      
      {/* Transcription Panel */}
      <div style={{ 
        height: '30vh', 
        display: 'flex', 
        flexDirection: 'column',
        borderTop: '2px solid #ddd',
        backgroundColor: '#f8f9fa'
      }}>
        {/* Controls */}
        <div style={{ 
          padding: '10px', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'white',
          flexWrap: 'wrap'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Live Transcript</h3>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: connectionStatus === 'connected' ? '#28a745' : 
                           connectionStatus === 'connecting' ? '#ffc107' : '#dc3545'
          }} />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
          <button
            onClick={isTranscribing ? stopTranscription : startTranscription}
            disabled={connectionStatus !== 'connected'}
            style={{
              padding: '5px 15px',
              backgroundColor: isTranscribing ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: connectionStatus === 'connected' ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              opacity: connectionStatus === 'connected' ? 1 : 0.6
            }}
          >
            {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
          </button>
          <button
            onClick={clearTranscript}
            style={{
              padding: '5px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '8px 10px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            borderBottom: '1px solid #f5c6cb',
            fontSize: '12px'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        {/* Transcript Display */}
        <div style={{ 
          flex: 1,
          padding: '10px', 
          overflowY: 'auto', 
          backgroundColor: 'white',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {transcript ? (
            <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {transcript}
            </div>
          ) : (
            <div style={{ color: '#999', fontStyle: 'italic' }}>
              {isTranscribing ? 'Listening...' : 
               connectionStatus !== 'connected' ? 'Please wait for connection...' :
               'Click "Start Transcription" to begin'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomPage;