'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isTyping?: boolean; // true while typewriter effect is running
}

const QUICK_TOPICS = [
  'What is SIP?',
  'SIP vs Lump Sum',
  'Tax Saving ELSS',
  'Step-Up SIP',
  'Best Fund Types',
  'SIP for Beginners',
];

/* ── Status phases the assistant goes through ── */
type AssistantPhase = 'idle' | 'thinking' | 'typing';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi! 👋 I\'m your AI-powered SIP Assistant by Mera SIP Online. I can help you learn about SIP investing, mutual funds, calculators, taxation, goal planning & more. Ask me anything — even complex questions!',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [phase, setPhase] = useState<AssistantPhase>('idle');
  const [showQuickTopics, setShowQuickTopics] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingCancelRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  /**
   * Typewriter effect: reveals the reply character by character.
   * Uses chunked reveal (2-4 chars at a time) for natural speed.
   */
  const typewriterReveal = useCallback(
    (fullText: string): Promise<void> => {
      return new Promise((resolve) => {
        typingCancelRef.current = false;

        // Add a placeholder message that will be progressively filled
        const placeholderMsg: ChatMessage = {
          role: 'assistant',
          text: '',
          timestamp: new Date().toISOString(),
          isTyping: true,
        };
        setMessages((prev) => [...prev, placeholderMsg]);

        let charIndex = 0;
        const textLength = fullText.length;
        // Adaptive speed: shorter texts type slower for realism, long texts faster
        const baseDelay = textLength > 400 ? 8 : textLength > 200 ? 12 : 18;
        // Chunk size: reveal 1-4 chars per tick for natural feel
        const chunkSize = textLength > 400 ? 4 : textLength > 200 ? 3 : 2;

        const tick = () => {
          if (typingCancelRef.current) {
            // Cancelled — show full text immediately
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.isTyping) {
                updated[updated.length - 1] = { ...last, text: fullText, isTyping: false };
              }
              return updated;
            });
            resolve();
            return;
          }

          charIndex = Math.min(charIndex + chunkSize, textLength);

          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.isTyping) {
              updated[updated.length - 1] = {
                ...last,
                text: fullText.slice(0, charIndex),
              };
            }
            return updated;
          });

          if (charIndex >= textLength) {
            // Done typing — mark as complete
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.isTyping) {
                updated[updated.length - 1] = { ...last, isTyping: false };
              }
              return updated;
            });
            resolve();
          } else {
            // Add natural variation: slight pause at newlines and punctuation
            const currentChar = fullText[charIndex - 1];
            let delay = baseDelay;
            if (currentChar === '\n') delay += 60;
            else if (currentChar === '.' || currentChar === '!' || currentChar === '?') delay += 30;
            else if (currentChar === ',') delay += 15;
            // Small random jitter for human feel
            delay += Math.random() * 8;

            setTimeout(tick, delay);
          }
        };

        // Start first tick
        setTimeout(tick, 50);
      });
    },
    [],
  );

  const handleSend = async (customMessage?: string) => {
    const msgText = customMessage || message.trim();
    if (!msgText || phase !== 'idle') return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: msgText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setShowQuickTopics(false);

    // Phase 1: Thinking (show bouncing dots)
    setPhase('thinking');

    try {
      // Send conversation history for multi-turn AI context
      const currentMessages = [...messages, userMessage];
      const recentHistory = currentMessages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, history: recentHistory }),
      });

      const data = await res.json();
      const replyText = data.reply || 'Sorry, I could not process that. Please try again.';

      // Phase 2: Typing (typewriter reveal)
      setPhase('typing');

      // Small delay to transition from "thinking" to "typing" naturally
      await new Promise((r) => setTimeout(r, 300));

      await typewriterReveal(replyText);
    } catch {
      setPhase('typing');
      await typewriterReveal('Oops! Something went wrong. Please try again or reach us on WhatsApp: +91-6003903737');
    } finally {
      setPhase('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickTopic = (topic: string) => {
    handleSend(topic);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  const isBusy = phase !== 'idle';

  if (!isVisible) return null;

  return (
    <>
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-[6.5rem] left-4 sm:left-6 z-[60] w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-modal border border-surface-300 overflow-hidden animate-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand to-teal-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">SIP Assistant</div>
                <div className="text-[10px] text-teal-200 flex items-center gap-1">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full inline-block',
                    phase === 'typing' ? 'bg-yellow-400 animate-pulse' :
                    phase === 'thinking' ? 'bg-orange-400 animate-pulse' :
                    'bg-green-400 animate-pulse'
                  )} />
                  {phase === 'thinking' ? 'Thinking...' :
                   phase === 'typing' ? 'Typing...' :
                   'Online'} &middot; by Mera SIP Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/60 transition-colors"
                aria-label="Close chat"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[320px] sm:h-[360px] overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar bg-surface-100">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-brand" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line',
                    msg.role === 'user'
                      ? 'bg-brand text-white rounded-br-md'
                      : 'bg-white text-slate-700 border border-surface-300 rounded-bl-md shadow-sm'
                  )}
                >
                  {msg.text}
                  {/* Blinking cursor while typing */}
                  {msg.isTyping && (
                    <span className="inline-block w-0.5 h-4 bg-brand ml-0.5 align-middle animate-pulse" />
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                )}
              </div>
            ))}

            {/* Quick Topic Chips */}
            {showQuickTopics && messages.length <= 1 && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span className="text-[11px] font-medium text-slate-500">Popular Topics</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleQuickTopic(topic)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-brand-200 text-brand hover:bg-brand-50 hover:border-brand transition-colors shadow-sm"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thinking indicator (bouncing dots) — only during "thinking" phase */}
            {phase === 'thinking' && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-brand" />
                </div>
                <div className="bg-white text-slate-400 px-4 py-3 rounded-2xl rounded-bl-md border border-surface-300 text-sm flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                  <span className="text-xs text-slate-500">Analyzing your question...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-surface-300 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about SIP, mutual funds, tax..."
                className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand bg-surface-100"
                disabled={isBusy}
              />
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || isBusy}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
                  message.trim() && !isBusy
                    ? 'bg-brand text-white hover:bg-brand/90'
                    : 'bg-surface-200 text-slate-400'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              AI-Powered by Mera SIP Online &middot; Trustner Asset Services
            </p>
          </div>
        </div>
      )}

      {/* Minimized Bar */}
      {isOpen && isMinimized && (
        <button
          onClick={handleRestore}
          className="fixed bottom-[6.5rem] left-4 sm:left-6 z-[60] flex items-center gap-2 bg-gradient-to-r from-brand to-teal-800 text-white px-4 py-2.5 rounded-full shadow-elevated hover:shadow-lg transition-all hover:scale-105"
        >
          <Bot className="w-4 h-4" />
          <span className="text-sm font-medium">SIP Assistant</span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </button>
      )}

      {/* Toggle Button — Only show when chat is fully closed */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className={cn(
            'fixed bottom-20 left-4 sm:left-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-elevated transition-all duration-300 hover:scale-110',
            'bg-gradient-to-br from-brand to-teal-800 hover:from-brand/90 hover:to-teal-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
          aria-label="Open SIP assistant"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>
      )}
    </>
  );
}
