import React, { useState, useRef } from 'react';
import { Send, User, Bold, Italic, AlertTriangle } from 'lucide-react';
import { AgoraPost as AgoraPostComponent } from './AgoraPost';
import { AgoraPost, AuthUser } from '../types';

// Mock Data for the Feed
const INITIAL_POSTS: AgoraPost[] = [
  {
    id: '1',
    author: {
        name: 'Lucía Valero',
        handle: '@lucia_arch',
        role: 'Arquitecta',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia'
    },
    content: '¡Hola Terreta! 👋 Estoy buscando colaboradores para un proyecto de arquitectura sostenible en la Albufera. ¿Algún diseñador interesado en biomateriales? #Sostenibilidad #Valencia',
    timestamp: 'hace 2 horas',
    comments: [
        {
            id: 'c1',
            author: { name: 'Marc Soler', handle: '@marcsoler', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc' },
            content: '¡Suena increíble Lucía! Te escribo por DM, tengo experiencia en renderizado orgánico.',
            timestamp: 'hace 1 hora'
        }
    ]
  },
  {
    id: '2',
    author: {
        name: 'Pablo Mir',
        handle: '@chefpablo',
        role: 'Gastronomía',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pablo'
    },
    content: 'Organizando el próximo evento de "Gastro-Tech" en el Hub. ¿Qué os parece fusionar impresión 3D con repostería tradicional valenciana? 🥘🤖',
    timestamp: 'hace 5 horas',
    comments: []
  }
];

interface AgoraFeedProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onViewProfile?: (handle: string) => void;
}

export const AgoraFeed: React.FC<AgoraFeedProps> = ({ user, onOpenAuth, onViewProfile }) => {
  const [posts, setPosts] = useState<AgoraPost[]>(INITIAL_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  
  // Anti-Paste & Formatting State
  const [pasteCount, setPasteCount] = useState(0);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostContent.trim()) return;

    const newPost: AgoraPost = {
      id: Date.now().toString(),
      author: {
        name: user.name,
        handle: `@${user.username}`,
        avatar: user.avatar,
        role: 'Miembro'
      },
      content: newPostContent,
      timestamp: 'Ahora mismo',
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setPasteCount(0);
    setShowPasteWarning(false);
  };

  const handleReply = (postId: string, content: string) => {
    if (!user) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: Date.now().toString(),
              author: { name: user.name, handle: user.username, avatar: user.avatar },
              content: content,
              timestamp: 'Ahora mismo'
            }
          ]
        };
      }
      return post;
    }));
  };

  // --- EDITOR LOGIC ---

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

  const handleFormat = (type: 'bold' | 'italic') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = newPostContent;
    
    // Define wrappers
    const wrapper = type === 'bold' ? '**' : '_';
    
    // Insert text
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = `${before}${wrapper}${selected || 'texto'}${wrapper}${after}`;
    setNewPostContent(newText);
    
    // Restore focus
    textareaRef.current.focus();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Create Post Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 relative overflow-hidden">
        
        {/* Anti-Paste Warning Overlay */}
        {showPasteWarning && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold py-2 text-center z-20 animate-slide-up shadow-md flex items-center justify-center gap-2">
             <AlertTriangle size={14} />
             Não, não, não — Ctrl + V não é permitido. No sea un robot y escriba.
          </div>
        )}

        <div className="flex gap-4">
           <div className="w-12 h-12 rounded-full bg-[#EBE5DA] flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
             {user ? <img src={user.avatar} className="w-full h-full object-cover"/> : <User className="text-gray-400" />}
           </div>
           
           <div className="flex-1">
             {user ? (
               <form onSubmit={handleCreatePost}>
                 <div className="relative border-b border-gray-100 mb-2">
                    <textarea
                        ref={textareaRef}
                        placeholder="¿Qué estás cocinando hoy?"
                        className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-gray-400 resize-none h-24 p-0 font-sans"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onPaste={handlePaste}
                    />
                    
                    {/* Formatting Toolbar */}
                    <div className="flex gap-2 pb-2">
                        <button 
                            type="button"
                            onClick={() => handleFormat('bold')}
                            className="p-1.5 text-gray-400 hover:text-terreta-dark hover:bg-gray-100 rounded transition-colors"
                            title="Negrita"
                        >
                            <Bold size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleFormat('italic')}
                            className="p-1.5 text-gray-400 hover:text-terreta-dark hover:bg-gray-100 rounded transition-colors"
                            title="Cursiva"
                        >
                            <Italic size={16} />
                        </button>
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-[#D97706] uppercase tracking-wide">Público</span>
                    <button 
                      type="submit" 
                      disabled={!newPostContent.trim()}
                      className="bg-terreta-dark text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-[#2C1E1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>Publicar</span>
                      <Send size={14} />
                    </button>
                 </div>
               </form>
             ) : (
               <div 
                  onClick={onOpenAuth} 
                  className="h-full flex flex-col justify-center cursor-pointer group"
                >
                  <p className="text-gray-400 text-lg group-hover:text-[#D97706] transition-colors">Inicia sesión para compartir tus ideas con la comunidad...</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {posts.map(post => (
          <AgoraPostComponent 
            key={post.id} 
            post={post} 
            currentUser={user}
            onReply={handleReply}
            onOpenAuth={onOpenAuth}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>

    </div>
  );
};