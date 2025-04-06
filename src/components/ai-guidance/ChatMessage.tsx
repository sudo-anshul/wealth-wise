
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`p-2 rounded-full ${isUser ? 'bg-primary/10' : 'bg-white/5'}`}>
        {isUser ? <User className="h-5 w-5 text-primary" /> : <Bot className="h-5 w-5 text-white/80" />}
      </div>
      <div className={`flex-1 glass-card p-4 rounded-xl max-w-[80%] ${isUser ? 'bg-primary/5' : ''}`}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed markdown-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
