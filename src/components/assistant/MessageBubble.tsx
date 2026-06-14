import React from 'react';
import type { ChatMessage } from '@/types';
import { Bot, User } from 'lucide-react';
import { useUserStore } from '@/stores/user-store';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { profile } = useUserStore();
  const isUser = message.role === 'user';

  // A very simple markdown formatter for the chat text
  // In a real app, use react-markdown
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold text handling
      let formattedLine = line;
      if (formattedLine.includes('**')) {
        const parts = formattedLine.split('**');
        return (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part)}
          </p>
        );
      }
      
      // List items
      if (formattedLine.trim().startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc mt-1">
            {formattedLine.trim().substring(2)}
          </li>
        );
      }
      if (formattedLine.trim().startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc mt-1">
            {formattedLine.trim().substring(2)}
          </li>
        );
      }

      return <p key={i} className={i > 0 ? 'mt-2' : ''}>{formattedLine}</p>;
    });
  };

  return (
    <div className={`flex gap-4 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-400 to-eco-500 flex items-center justify-center text-white text-xs font-semibold">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-eco-500 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className={`
        max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl
        ${isUser 
          ? 'bg-eco-600 text-white rounded-tr-sm shadow-md shadow-eco-500/10' 
          : 'bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
        }
      `}>
        <div className={`text-[15px] leading-relaxed ${isUser ? 'text-white' : ''}`}>
          {formatText(message.content)}
        </div>
        <div className={`text-[10px] mt-2 opacity-60 text-right`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
