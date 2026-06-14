import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  suggestions?: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, suggestions = [] }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSend(suggestion)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-eco-500" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-eco-500/30 focus-within:border-eco-500 transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your footprint, get tips, or request a 'what-if' simulation..."
          className="flex-1 max-h-[150px] min-h-[44px] py-3 px-4 bg-transparent border-none outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-[15px]"
          disabled={isLoading}
          rows={1}
        />
        <div className="pb-1 pr-1 shrink-0">
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className={`rounded-xl w-10 h-10 ${input.trim() ? 'bg-eco-600 text-white' : 'bg-slate-100 dark:bg-surface-800 text-slate-400'}`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <div className="text-center mt-2">
        <span className="text-[10px] text-slate-400">EcoPilot AI can make mistakes. Consider verifying important information.</span>
      </div>
    </div>
  );
};
