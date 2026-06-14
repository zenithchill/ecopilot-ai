'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useUserStore } from '@/stores/user-store';
import { useActivityStore } from '@/stores/activity-store';
import { useGamificationStore } from '@/stores/gamification-store';
import { MessageBubble } from '@/components/assistant/MessageBubble';
import { ChatInput } from '@/components/assistant/ChatInput';
import { Bot, AlertCircle } from 'lucide-react';

export default function AssistantPage() {
  const { messages, isLoading, error, addMessage, setLoading, setError, getMessageCount } = useChatStore();
  const { profile } = useUserStore();
  const { logs } = useActivityStore();
  const { checkBadgeEligibility } = useGamificationStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message if chat is empty
  useEffect(() => {
    if (messages.length === 0 && profile) {
      addMessage('assistant', `Hi ${profile.name.split(' ')[0]}! I'm EcoPilot, your sustainability assistant. I can help you understand your carbon footprint, suggest ways to reduce it, or simulate 'what-if' scenarios based on your lifestyle. What would you like to know?`);
    }
  }, [messages.length, profile, addMessage]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // 1. Add user message to UI immediately
    addMessage('user', content);
    setLoading(true);
    setError(null);
    
    // Check for badge (e.g. 10 messages sent)
    const newCount = getMessageCount() + 1;
    checkBadgeEligibility(0, newCount);

    try {
      // 2. Prepare payload
      const payload = {
        messages: [...messages, { role: 'user', content }],
        profile,
        logs: logs.slice(-30), // Only send last 30 days to save tokens
      };

      // 3. Make API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // 4. Add AI response to UI
      addMessage('assistant', data.content);

    } catch (err: unknown) {
      console.error('Chat Error:', err);
      const error = err as Error;
      setError(error.message || 'Something went wrong. Please try again.');
      // Add a fallback message so UI doesn't look stuck
      addMessage('assistant', "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What's my biggest carbon source?",
    "How can I improve my score?",
    "What if I switch to a vegan diet?",
    "Compare my commute to public transit."
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
          EcoPilot AI
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Your personal sustainability coach. Ask me anything.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-4 w-full">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-eco-500 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-2 h-2 rounded-full bg-eco-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-eco-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-eco-500/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-surface-850 border-t border-slate-100 dark:border-slate-800">
          <ChatInput 
            onSend={handleSendMessage} 
            isLoading={isLoading} 
            suggestions={messages.length < 3 ? suggestions : []}
          />
        </div>
      </div>
    </div>
  );
}
