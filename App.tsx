import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Activity, Mic, Volume2, VolumeX, Play, Square, Github } from 'lucide-react';
import CameraView from './components/CameraView';
import PerformanceChart from './components/PerformanceChart';
import { translateSignLanguageFrame } from './services/geminiService';
import { ChartDataPoint, TranslationResult } from './types';

// Helper to simulate time formatting
const formatTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

function App() {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSign, setCurrentSign] = useState<string>('...');
  const [sentence, setSentence] = useState<string[]>([]);
  const [confidenceHistory, setConfidenceHistory] = useState<ChartDataPoint[]>(
    Array(10).fill({ name: '', confidence: 0 })
  );
  
  // Ref to track if we are currently processing a frame to avoid overlap
  const isProcessingRef = useRef(false);

  // Text to Speech Handler
  const speak = useCallback((text: string) => {
    if (isMuted || !text || text === '...') return;
    
    // Cancel previous speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Frame Processing Logic
  const handleFrameCapture = useCallback(async (base64Image: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const response = await translateSignLanguageFrame(base64Image);
      const result: TranslationResult = { ...response, timestamp: Date.now() };
      
      // Update UI state
      setCurrentSign(result.text);
      
      // Update Chart
      setConfidenceHistory(prev => {
        const newData = [...prev.slice(1), { name: formatTime(), confidence: result.confidence }];
        return newData;
      });

      // Logic to build sentence
      // If valid text and different from last word (debouncing simple repeat)
      if (result.text !== '...' && result.confidence > 60) {
         setSentence(prev => {
           const lastWord = prev[prev.length - 1];
           if (lastWord !== result.text) {
             speak(result.text); // Speak the new word
             return [...prev, result.text];
           }
           return prev;
         });
      }

    } catch (e) {
      console.error("Processing failed", e);
    } finally {
      isProcessingRef.current = false;
    }
  }, [speak]);

  const toggleRecording = () => {
    setIsActive(!isActive);
    if (!isActive) {
      // Reset state on start
      setSentence([]);
      setConfidenceHistory(Array(10).fill({ name: '', confidence: 0 }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SignEcho</h1>
              <p className="text-xs text-slate-400 font-mono">CNN-LSTM / MediaPipe / Gemini</p>
            </div>
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
            <Github size={24} />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          
          {/* Left Column: Camera & Controls */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <CameraView isActive={isActive} onFrameCapture={handleFrameCapture} />
            
            {/* Control Bar */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isActive ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  {isActive ? 'Stop Translation' : 'Start Translation'}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title={isMuted ? "Unmute TTS" : "Mute TTS"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400 font-mono bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                STATUS: {isActive ? 'ACTIVE_INFERENCE' : 'IDLE'}
              </div>
            </div>

            {/* Visualization Chart */}
            <PerformanceChart data={confidenceHistory} />
          </div>

          {/* Right Column: Output & Logs */}
          <div className="flex flex-col gap-6">
            
            {/* Current Detection Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={120} />
              </div>
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Detected Gesture</h2>
              <div className="h-32 flex items-center justify-center">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {currentSign}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Model Confidence</span>
                <span className="text-emerald-400 font-mono font-bold">
                   {confidenceHistory[confidenceHistory.length - 1]?.confidence}%
                </span>
              </div>
            </div>

            {/* Translation History */}
            <div className="flex-1 bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mic size={16} className="text-cyan-400" />
                  Translation Log
                </h3>
                <button 
                  onClick={() => setSentence([])}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                 {sentence.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm text-center p-4">
                     <p>No gestures detected yet.</p>
                     <p className="mt-2 text-xs opacity-60">Start camera and perform ASL signs.</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                      {sentence.map((word, idx) => (
                        <div key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                           <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                           <div className="bg-slate-800/80 px-3 py-2 rounded-lg rounded-tl-none text-slate-200 text-sm border border-slate-700/50">
                             {word}
                           </div>
                        </div>
                      ))}
                      {/* Scrolling Anchor */}
                      <div className="h-4" />
                   </div>
                 )}
              </div>
              
              {/* Live Sentence Construction */}
              <div className="p-4 bg-slate-900 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Current Sentence</div>
                <div className="text-lg font-mono text-cyan-100 min-h-[28px]">
                  {sentence.join(' ')}
                  <span className="animate-pulse inline-block w-2 h-5 bg-cyan-500 ml-1 align-middle"></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;