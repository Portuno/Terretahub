import React, { useState } from 'react';
import { MessageCircle, Share2, MoreHorizontal, Send, Trash2, Shield } from 'lucide-react';
import { AgoraPost as AgoraPostType, AuthUser } from '../types';
import { canDelete } from '../lib/userRoles';
import { useProfileNavigation } from '../hooks/useProfileNavigation';

interface AgoraPostProps {
  post: AgoraPostType;
  currentUser: AuthUser | null;
  onReply: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onOpenAuth: () => void;
}

export const AgoraPost: React.FC<AgoraPostProps> = ({ post, currentUser, onReply, onDelete, onOpenAuth }) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [pasteCount, setPasteCount] = useState(0);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  
  const navigateToProfile = useProfileNavigation();

  const canDeletePost = canDelete(currentUser, post.authorId);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (replyText.trim()) {
      onReply(post.id, replyText);
      setReplyText('');
      setPasteCount(0);
      setShowPasteWarning(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); // Block paste
    
    const newCount = pasteCount + 1;
    setPasteCount(newCount);

    if (newCount >= 3) {
      setShowPasteWarning(true);
      // Reset after a delay so they don't get stuck with the error forever
      setTimeout(() => {
        setPasteCount(0);
        setShowPasteWarning(false);
      }, 5000);
    }
  };

  const handleProfileClick = () => {
    navigateToProfile(post.author.handle);
  };

  // Cerrar menú de eliminación al hacer click fuera
  React.useEffect(() => {
    if (!showDeleteMenu) return;
    
    const handleClickOutside = () => {
      setShowDeleteMenu(false);
    };
    
    // Usar setTimeout para evitar que se cierre inmediatamente al abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDeleteMenu]);

  return (
    <div className="bg-terreta-card border border-terreta-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mb-4">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            className="w-12 h-12 rounded-full bg-terreta-bg object-cover border border-terreta-border cursor-pointer"
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
              {post.author.role === 'Admin' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-terreta-accent text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                  <Shield size={10} />
                  Admin
                </span>
              )}
              <span className="text-xs text-terreta-secondary font-sans">{post.timestamp}</span>
            </div>
            <p 
                className="text-xs text-terreta-accent font-bold uppercase tracking-wide cursor-pointer hover:text-terreta-accent/80"
                onClick={handleProfileClick}
            >
              {post.author.handle}
            </p>
          </div>
        </div>
        <div className="relative">
          {canDeletePost && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteMenu(!showDeleteMenu);
              }}
              className="text-terreta-secondary hover:text-terreta-dark relative"
            >
              <MoreHorizontal size={20} />
            </button>
          )}
          {showDeleteMenu && canDeletePost && onDelete && (
            <div 
              className="absolute right-0 top-8 bg-terreta-card border border-terreta-border rounded-lg shadow-lg z-10 min-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post.id);
                  setShowDeleteMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-5 pl-[60px]">
        <p className="text-terreta-dark text-base leading-relaxed whitespace-pre-line font-sans">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pl-[60px] border-t border-terreta-border pt-3">
        <button 
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className="flex items-center gap-2 text-sm font-medium text-terreta-secondary hover:text-terreta-accent transition-colors"
        >
          <MessageCircle size={18} />
          <span>{post.comments.length}</span>
        </button>

        <button className="flex items-center gap-2 text-sm font-medium text-terreta-secondary hover:text-terreta-accent transition-colors ml-auto">
          <Share2 size={18} />
        </button>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="mt-4 pl-[60px] animate-fade-in space-y-4">
          
          {/* List of Comments */}
          {post.comments.map(comment => (
            <div key={comment.id} className="bg-terreta-bg/50 rounded-lg p-3 flex gap-3 border border-terreta-border/50">
              <img 
                src={comment.author.avatar} 
                alt={comment.author.name} 
                className="w-8 h-8 rounded-full bg-terreta-card object-cover cursor-pointer"
                onClick={() => navigateToProfile(comment.author.handle)}
              />
              <div className="flex-1">
                 <div className="flex justify-between items-baseline">
                    <span 
                        className="font-bold text-xs text-terreta-dark cursor-pointer hover:underline"
                        onClick={() => navigateToProfile(comment.author.handle)}
                    >
                        {comment.author.name}
                    </span>
                    <span className="text-[10px] text-terreta-secondary">{comment.timestamp}</span>
                 </div>
                 <p className="text-sm text-terreta-dark/90 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}

          {/* Reply Input */}
          <form onSubmit={handleSubmitReply} className="flex gap-2 items-center mt-2 relative">
             {currentUser ? (
                <>
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full" alt="me" />
                  <div className="flex-1 relative">
                    {/* Anti-Paste Warning Overlay */}
                    {showPasteWarning && (
                      <div className="absolute -top-8 left-0 right-0 bg-red-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg text-center z-20 animate-slide-up shadow-md flex items-center justify-center gap-2">
                        <span>⚠️</span>
                        <span>No, no, no — Ctrl + V no es permitido. No sea un robot y escriba.</span>
                      </div>
                    )}
                    <input 
                      type="text" 
                      placeholder="Escribe una respuesta..." 
                      className="w-full bg-terreta-bg/50 border-terreta-border border rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark placeholder-terreta-secondary/50"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onPaste={handlePaste}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!replyText.trim()}
                    className="p-2 text-terreta-accent hover:bg-terreta-accent/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </>
             ) : (
                <div 
                  onClick={onOpenAuth}
                  className="w-full bg-terreta-bg/50 p-3 rounded-lg text-center text-sm text-terreta-secondary cursor-pointer hover:bg-terreta-bg transition-colors border border-terreta-border/50"
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