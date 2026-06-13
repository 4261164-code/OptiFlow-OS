import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Search, 
  Command,
  ArrowRight,
  Loader2,
  Activity,
  MessageSquare
} from 'lucide-react';
import { apiFetch } from '../lib/auth';
import { auth } from '../lib/firebase';

interface Message {
  role: 'user' | 'soul';
  content: string;
  mood?: string;
  initiative?: any;
}

export function SEOChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'soul', content: 'Autonomous SEO Consultant initialized. Tell me about your niche, or ask me for target keywords and content clusters.', mood: 'analytical' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

      const res = await apiFetch('/api/executive/soul/seo-chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history, userId: auth.currentUser?.uid || 'system' })
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
      console.error("SEO chat failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" 
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-tight">SEO Consultant Agent</h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Ready to Audit & Plan</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isSpeaking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-xs font-medium flex items-center"
            >
              <Volume2 className="w-3 h-3 mr-1.5 animate-pulse" /> Speaking
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={["flex", msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
            >
              <div className={["max-w-[85%] rounded-2xl p-4",
                msg.role === 'user' 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-sm'
                  : 'bg-zinc-100 dark:bg-[#16171d] text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-200 dark:border-white/5'
              ].join(' ')}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                
                {msg.initiative && msg.initiative.action !== 'none' && (
                  <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                   <div className="flex items-center text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-500">
                     <Command className="w-3 h-3 mr-1.5" /> Proposed Action
                   </div>
                   <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{msg.initiative.reasoning}</p>
                   <button className="flex items-center text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors">
                     Execute {msg.initiative.action.replace('_', ' ')}
                     <ArrowRight className="w-3 h-3 ml-1.5" />
                   </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-100 dark:bg-[#16171d] border border-zinc-200 dark:border-white/5 rounded-2xl rounded-tl-sm p-4 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-500 font-mono">Analyzing semantic graph...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-[#09090b] border-t border-zinc-100 dark:border-white/5">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <button
            type="button"
            onClick={handleToggleListening}
            className={["absolute left-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors", 
              isListening ? 'bg-red-500/10 text-red-500 animate-pulse' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            ].join(' ')}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., I want to target 'home gym setup'..."
            className="w-full bg-zinc-50 dark:bg-[#16171d] border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
            disabled={isLoading || isListening}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-8 h-8 bg-indigo-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
