import React, { useState } from 'react';
import { MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { AgoraPost as AgoraPostType, AuthUser } from '../types';

interface AgoraPostProps {
  post: AgoraPostType;
  currentUser: AuthUser | null;
  onReply: (postId: string, content: string) => void;
  onOpenAuth: () => void;
  onViewProfile?: (handle: string) => void;
}

export const AgoraPost: React.FC<AgoraPostProps> = ({ post, currentUser, onReply, onOpenAuth, onViewProfile }) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (replyText.trim()) {
      onReply(post.id, replyText);
      setReplyText('');
    }
  };

  const handleProfileClick = () => {
      if (onViewProfile) {
          onViewProfile(post.author.handle);
      }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-4">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="w-12 h-12 rounded-full bg-gray-100 object-cover border border-gray-200 cursor-pointer"
            onClick={handleProfileClick}
          />
          <div>
            <div className="flex items-baseline gap-2">
              <h3 
                className="font-bold text-terreta-dark hover:underline cursor-pointer"
                onClick={handleProfileClick}
              >
                {post.author.name}
              </h3>
              <span className="text-xs text-gray-400 font-sans">{post.timestamp}</span>
            </div>
            <p 
                className="text-xs text-[#D97706] font-bold uppercase tracking-wide cursor-pointer hover:text-[#B45309]"
                onClick={handleProfileClick}
            >
              {post.author.handle}
            </p>
          </div>
        </div>
        <button className="text-gray-300 hover:text-gray-500">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-5 pl-[60px]">
        <p className="text-terreta-dark text-base leading-relaxed whitespace-pre-line font-sans">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pl-[60px] border-t border-gray-50 pt-3">
        <button 
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#D97706] transition-colors"
        >
          <MessageCircle size={18} />
          <span>{post.comments.length}</span>
        </button>

        <button className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#D97706] transition-colors ml-auto">
          <Share2 size={18} />
        </button>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="mt-4 pl-[60px] animate-fade-in space-y-4">
          
          {/* List of Comments */}
          {post.comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3 flex gap-3">
              <img 
                src={comment.author.avatar} 
                alt={comment.author.name} 
                className="w-8 h-8 rounded-full bg-white object-cover cursor-pointer"
                onClick={() => onViewProfile && onViewProfile(comment.author.handle)}
              />
              <div className="flex-1">
                 <div className="flex justify-between items-baseline">
                    <span 
                        className="font-bold text-xs text-terreta-dark cursor-pointer hover:underline"
                        onClick={() => onViewProfile && onViewProfile(comment.author.handle)}
                    >
                        {comment.author.name}
                    </span>
                    <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                 </div>
                 <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}

          {/* Reply Input */}
          <form onSubmit={handleSubmitReply} className="flex gap-2 items-center mt-2 relative">
             {currentUser ? (
                <>
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="me" />
                  <input 
                    type="text" 
                    placeholder="Escribe una respuesta..." 
                    className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-[#D97706] outline-none"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!replyText.trim()}
                    className="p-2 text-[#D97706] hover:bg-orange-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </>
             ) : (
                <div 
                  onClick={onOpenAuth}
                  className="w-full bg-gray-50 p-3 rounded-lg text-center text-sm text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                   Inicia sesión para responder
                </div>
             )}
          </form>

        </div>
      )}

    </div>
  );
};