import React, { useState, useRef } from 'react';
import { 
  Save, Send, Image as ImageIcon, Video, X, Plus, 
  Bold, Italic, Info, ChevronDown, CheckCircle 
} from 'lucide-react';
import { Project, ProjectPhase, AuthUser } from '../types';

interface ProjectEditorProps {
  user: AuthUser;
  onCancel: () => void;
  onSave: (project: Project) => void;
}

const PHASES: ProjectPhase[] = ['Idea', 'MVP', 'Mercado Temprano', 'Escalado'];

export const ProjectEditor: React.FC<ProjectEditorProps> = ({ user, onCancel, onSave }) => {
  // Form State
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [phase, setPhase] = useState<ProjectPhase>('Idea');
  const [images, setImages] = useState<string[]>([]);
  
  // Tag State
  const [catInput, setCatInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);

  // UI State
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleFormat = (type: 'bold' | 'italic') => {
    if (!descriptionRef.current) return;
    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const wrapper = type === 'bold' ? '**' : '_';
    
    const newText = 
      description.substring(0, start) + 
      wrapper + 
      description.substring(start, end) + 
      wrapper + 
      description.substring(end);
      
    setDescription(newText);
    textarea.focus();
  };

  // Tag Handlers
  const handleTagKeyDown = (
    e: React.KeyboardEvent, 
    value: string, 
    setValue: (v: string) => void, 
    list: string[], 
    setList: (l: string[]) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (value.trim()) {
        const newTags = value.split(',').map(t => t.trim()).filter(t => t && !list.includes(t));
        setList([...list, ...newTags]);
        setValue('');
      }
    } else if (e.key === 'Backspace' && !value && list.length > 0) {
      setList(list.slice(0, -1));
    }
  };

  const removeTag = (tag: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.filter(t => t !== tag));
  };

  // Image Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: Project['status']) => {
    const newProject: Project = {
      id: Date.now().toString(),
      authorId: user.id,
      name,
      slogan,
      description,
      images,
      videoUrl,
      categories,
      technologies,
      phase,
      status,
      createdAt: new Date().toISOString()
    };
    onSave(newProject);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in pb-24">
      
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h2 className="font-serif text-3xl text-terreta-dark mb-2">Sube tu Proyecto</h2>
        <p className="text-sm text-gray-500 font-sans">
          Comparte tu visión con la comunidad. Completa la información clave para incubación o inversores.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* 1. Basic Info */}
        <section className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Nombre del Proyecto <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-terreta-dark focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none placeholder-gray-300"
              placeholder="Ej. Terreta Hub"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Slogan (Descripción Corta) <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none placeholder-gray-300"
              placeholder="Una línea que defina tu propuesta de valor..."
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
            />
          </div>
        </section>

        {/* 2. The Pitch */}
        <section>
           <div className="flex justify-between items-end mb-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                El Pitch (Descripción Detallada) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-1">
                 <button onClick={() => handleFormat('bold')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Bold size={14}/></button>
                 <button onClick={() => handleFormat('italic')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Italic size={14}/></button>
              </div>
           </div>
           <div className="relative">
             <textarea 
                ref={descriptionRef}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none placeholder-gray-300 min-h-[200px] resize-y font-sans leading-relaxed"
                placeholder="Cuenta tu historia. ¿Qué problema resuelves? ¿Cuál es tu solución? Usa **negrita** para resaltar."
                value={description}
                onChange={e => setDescription(e.target.value)}
             />
           </div>
        </section>

        {/* 3. Multimedia */}
        <section className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <h3 className="font-serif text-lg text-terreta-dark mb-2 flex items-center gap-2">
            <ImageIcon size={18} /> Multimedia
          </h3>
          
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Imágenes Destacadas (Logos, Mockups)
            </label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden group shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt="preview" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#D97706] hover:text-[#D97706] transition-colors bg-white"
              >
                <Plus size={24} />
                <span className="text-[10px] font-bold mt-1">SUBIR</span>
              </button>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImageUpload} 
              />
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 mt-4">
              Video Pitch (YouTube/Vimeo)
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="url" 
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                placeholder="https://..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 4. Details */}
        <section className="grid md:grid-cols-2 gap-6">
           
           {/* Categories */}
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Categoría / Sector
              </label>
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 focus-within:border-[#D97706] focus-within:ring-1 focus-within:ring-[#D97706] transition-all">
                {categories.map(cat => (
                  <span key={cat} className="bg-orange-50 text-[#D97706] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    {cat}
                    <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeTag(cat, categories, setCategories)} />
                  </span>
                ))}
                <input 
                  type="text" 
                  className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                  placeholder="Ej. Fintech, Salud..."
                  value={catInput}
                  onChange={e => setCatInput(e.target.value)}
                  onKeyDown={e => handleTagKeyDown(e, catInput, setCatInput, categories, setCategories)}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Presiona Enter o Coma para agregar.</p>
           </div>

           {/* Phase */}
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Fase del Proyecto
              </label>
              <div className="relative">
                <select 
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as ProjectPhase)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 appearance-none focus:border-[#D97706] outline-none cursor-pointer"
                >
                  {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
              </div>
           </div>

           {/* Tech Stack */}
           <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Tecnologías Usadas
              </label>
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-2 focus-within:border-[#D97706] focus-within:ring-1 focus-within:ring-[#D97706] transition-all">
                {technologies.map(tech => (
                  <span key={tech} className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    {tech}
                    <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeTag(tech, technologies, setTechnologies)} />
                  </span>
                ))}
                <input 
                  type="text" 
                  className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                  placeholder="Ej. React, Python, Solidity..."
                  value={techInput}
                  onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => handleTagKeyDown(e, techInput, setTechInput, technologies, setTechnologies)}
                />
              </div>
           </div>

        </section>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
          <Info className="text-blue-500 flex-shrink-0" size={20} />
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Tu proyecto pasará por un breve proceso de revisión por parte del equipo de Terreta Hub antes de ser publicado visiblemente en la galería principal.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row gap-4 pt-4">
           <button 
             onClick={() => handleSubmit('draft')}
             className="flex-1 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
           >
             <Save size={18} /> Guardar Borrador
           </button>
           <button 
             onClick={() => handleSubmit('review')}
             className="flex-[2] py-4 bg-[#D97706] text-white font-bold rounded-xl hover:bg-[#B45309] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
           >
             <Send size={18} /> Enviar para Revisión
           </button>
        </div>
        
        <div className="text-center">
             <button onClick={onCancel} className="text-sm text-gray-400 hover:text-red-500 hover:underline">Cancelar</button>
        </div>

      </div>
    </div>
  );
};