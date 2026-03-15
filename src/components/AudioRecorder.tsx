import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Upload, Volume2, RefreshCw, X } from 'lucide-react';
import { AudioData } from '../types';
import { fileToBase64, isValidAudio } from '../utils/fileHelpers';

interface AudioRecorderProps {
  audioData: AudioData | null;
  setAudioData: React.Dispatch<React.SetStateAction<AudioData | null>>;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ audioData, setAudioData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const cleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down height

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#14b8a6'); // teal-500
        gradient.addColorStop(1, '#0f766e'); // teal-700

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const base64 = await fileToBase64(audioBlob);
        setAudioData({
          blob: audioBlob,
          base64: base64,
          mimeType: mimeType
        });
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      // Setup Visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Low FFT size for fewer, wider bars
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start Timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start Visualizer
      drawVisualizer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidAudio(file)) {
        const base64 = await fileToBase64(file);
        setAudioData({
          blob: file,
          base64,
          mimeType: file.type
        });
      } else {
        alert("Please upload a valid audio file (mp3, wav, webm).");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioData) {
      const url = URL.createObjectURL(audioData.blob);
      audioPlayerRef.current = new Audio(url);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const deleteAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioData(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <span className="w-1 h-6 bg-teal-500 rounded-full mr-3"></span>
        Voice Symptoms (Optional)
      </h2>

      {!audioData && !isRecording ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={startRecording}
            className="relative overflow-hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl hover:border-teal-500 hover:bg-teal-50/50 transition-all group"
          >
            <div className="bg-teal-100 p-4 rounded-full text-teal-600 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Mic size={28} />
            </div>
            <span className="font-semibold text-slate-700">Record Voice</span>
            <span className="text-xs text-slate-500 mt-1">Tap to start speaking</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl hover:border-teal-500 hover:bg-teal-50/50 transition-all group"
          >
             <div className="bg-slate-100 p-4 rounded-full text-slate-600 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Upload size={28} />
            </div>
            <span className="font-semibold text-slate-700">Upload Audio</span>
            <span className="text-xs text-slate-500 mt-1">MP3, WAV, M4A</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
        </div>
      ) : isRecording ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden">
           {/* Visualizer Canvas */}
           <div className="w-full h-24 flex items-end justify-center mb-4">
             <canvas ref={canvasRef} width={300} height={100} className="w-full h-full max-w-sm" />
           </div>

           <div className="flex flex-col items-center z-10">
             <div className="text-slate-800 font-mono text-3xl font-bold mb-2 tracking-wider">
               {formatTime(recordingTime)}
             </div>
             <p className="text-slate-500 text-sm mb-6 flex items-center">
               <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
               Recording...
             </p>
             <button
               onClick={stopRecording}
               className="flex items-center space-x-2 bg-red-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
             >
               <Square size={18} fill="currentColor" />
               <span>Stop Recording</span>
             </button>
           </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-teal-50 border border-teal-100 rounded-2xl gap-4">
           <div className="flex items-center space-x-4 w-full sm:w-auto">
             <div className="bg-white p-3 rounded-full text-teal-600 shadow-sm">
               <Volume2 size={24} />
             </div>
             <div>
               <p className="font-semibold text-teal-900">Audio Captured</p>
               <p className="text-xs text-teal-700 font-medium opacity-80">
                 {audioData?.blob.type.split('/')[1].toUpperCase()} • Ready
               </p>
             </div>
           </div>

           <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
             <button
               onClick={togglePlayback}
               className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPlaying ? 'bg-teal-200 text-teal-800' : 'bg-white text-teal-700 hover:bg-teal-100'}`}
             >
               {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
               <span className="text-sm">{isPlaying ? 'Pause' : 'Play'}</span>
             </button>
             
             <div className="w-px h-8 bg-teal-200 mx-2 hidden sm:block"></div>

             <button
               onClick={deleteAudio}
               className="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
               title="Re-record (Delete current)"
             >
               <RefreshCw size={20} />
             </button>
             
             <button 
               onClick={deleteAudio}
               className="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
               title="Delete"
             >
                <X size={20} />
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;