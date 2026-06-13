import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Command,
  ArrowRight,
  Loader2,
  Activity
} from 'lucide-react';
import { apiFetch } from '../../lib/auth';

interface Message {
  role: 'user' | 'soul';
  content: string;
  mood?: string;
  initiative?: any;
}

export function CEOChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'soul', content: "ExOS Strategic Partner initialized. I'm here to help you orchestrate your affiliate empire. Before we dive into the data, what are your primary targets for the week? Are we focusing on scale, or optimizing existing conversion silos?", mood: 'inquisitive' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ceoName, setCeoName] = useState("ExOS Strategic Core");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Fetch CEO name
    apiFetch('/api/settings/get-ceo-name')
      .then(res => res.json())
      .then(data => { if (data.ceoName) setCeoName(data.ceoName); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Voice Interaction Logic
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const playTTS = async (text: string) => {
    try {
      setIsSpeaking(true);
      const res = await apiFetch('/api/executive/soul/tts', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      const audio = data?.audio;
      if (audio) {
        const audioBlob = new Audio(`data:audio/mp3;base64,${audio}`);
        audioBlob.onended = () => setIsSpeaking(false);
        audioBlob.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("TTS failed:", err);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ 
        role: m.role === 'user' ? 'user' : 'model', 
        parts: [{ text: m.content }] 
      }));

      const res = await apiFetch('/api/executive/soul/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history })
      });

      const data = await res.json();
      const soulMsg: Message = { 
        role: 'soul', 
        content: data.response, 
        mood: data.mood,
        initiative: data.initiative 
      };

      setMessages(prev => [...prev, soulMsg]);
      playTTS(data.response);
    } catch (err) {
      console.error("Executor chat failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-[#a8ff35] flex items-center justify-center">
              <Brain className="w-6 h-6 text-black" />
            </div>
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" 
            />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">{ceoName}</h3>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#a8ff35] rounded-full animate-pulse" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Real-time Intelligence Active</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <div className="px-3 py-1 bg-zinc-200 dark:bg-white/5 rounded-full border border-zinc-300 dark:border-white/10">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prod Ready</span>
           </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-zinc-50/30 dark:bg-black/20"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-5 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-zinc-900 dark:bg-indigo-600 text-white rounded-tr-none font-medium shadow-lg' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-white/5 shadow-md shadow-black/5'
              }`}>
                {msg.role === 'soul' && (
                  <div className="flex items-center space-x-1.5 mb-2 opacity-60">
                    <Command className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{msg.mood || 'strategic'}</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                
                {msg.initiative && msg.initiative.action !== 'none' && (
                  <div className="mt-4 p-4 bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-[#a8ff35] uppercase tracking-widest">Recommended Move</span>
                      <Activity className="w-3 h-3 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      {msg.initiative.reasoning}
                    </p>
                    <button className="mt-3 w-full py-2 bg-[#a8ff35] text-black text-[10px] font-bold rounded-lg flex items-center justify-center hover:bg-[#92ec1d] transition-colors">
                      Execute Initiative <ArrowRight className="w-3 h-3 ml-2" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl rounded-tl-none flex items-center space-x-3 border border-zinc-100 dark:border-white/5">
                <Loader2 className="w-4 h-4 animate-spin text-[#a8ff35]" />
                <span className="text-xs text-zinc-500 font-mono italic tracking-tight">AI is evaluating strategic data...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleToggleListening}
            className={`p-4 rounded-2xl transition-all shadow-md active:scale-95 ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-[#a8ff35]'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 relative group">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Issue strategic commands..."
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 p-4 pr-14 rounded-2xl text-sm focus:outline-none focus:border-[#a8ff35] transition-all shadow-inner placeholder:text-zinc-500"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 top-2.5 p-2 bg-[#a8ff35] text-black rounded-xl disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => {}} // Could toggle mute
            className={`p-4 rounded-2xl transition-all shadow-md ${
              isSpeaking ? 'text-black bg-[#a8ff35] scale-110' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {isSpeaking ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5 opacity-40" />}
          </button>
        </div>
      </div>
    </div>
  );
}

