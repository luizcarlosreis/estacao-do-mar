'use client';

import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Lightbulb, 
  Tag, 
  Plus, 
  MessageCircle, 
  Heart, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  User,
  Trash2,
  RefreshCw,
  X,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const categoryMap = {
  AVISO: { label: 'Aviso', icon: <Megaphone size={16} />, color: 'bg-red-100 text-red-600' },
  PENSAMENTO: { label: 'Pensamento', icon: <Lightbulb size={16} />, color: 'bg-amber-100 text-amber-600' },
  CLASSIFICADO: { label: 'Classificado', icon: <Tag size={16} />, color: 'bg-emerald-100 text-emerald-600' }
};



export default function MuralPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Filtros e Busca
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'AVISO',
    price: '',
    expiresAt: ''
  });
  
  // Comentários
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetch('/api/me').then(res => res.json()).then(data => setUser(data.user));
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [categoryFilter]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewPost({ title: '', description: '', category: 'AVISO', price: '', expiresAt: '' });
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        setCommentText('');
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  const handleRenew = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'PATCH' });
      if (res.ok) {
        alert('Post renovado por mais 30 dias!');
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header do Mural */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Megaphone className="text-blue-600" size={32} />
            Mural do Condomínio
          </h1>
          <p className="text-slate-500 mt-1">Comunicados, interações e classificados do Estação do Mar.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95 self-start md:self-center"
        >
          <Plus size={20} /> Novo Post
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar no mural..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['ALL', 'AVISO', 'PENSAMENTO', 'CLASSIFICADO', 'EXPIRADO'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat === 'EXPIRADO' ? 'Expirados' : categoryMap[cat as keyof typeof categoryMap].label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-20">
          <RefreshCw className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-medium">Carregando o mural...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Search size={40} />
          </div>
          <p className="text-slate-500 font-bold text-xl">Nenhuma publicação encontrada</p>
          <p className="text-slate-400 text-sm mt-1">Seja o primeiro a postar algo no mural!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
              {/* Card Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-lg">
                      {post.user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-none">{post.user.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                        Apt {post.user.unit?.number} - {post.user.unit?.block}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${categoryMap[post.category as keyof typeof categoryMap].color}`}>
                      {categoryMap[post.category as keyof typeof categoryMap].icon}
                      {categoryMap[post.category as keyof typeof categoryMap].label}
                    </span>
                    
                    {post.isArchived && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        Expirado
                      </span>
                    )}
                    
                    {(user?.id === post.userId || user?.role === 'SUPER_ADMIN') && (
                      <div className="flex gap-1">
                        <button onClick={() => handleRenew(post.id)} title="Renovar por 30 dias" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                          <RefreshCw size={16} />
                        </button>
                        <button onClick={() => handleDelete(post.id)} title="Excluir" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-black text-slate-900 mb-2">{post.title}</h2>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{post.description}</p>
                
                {post.category === 'CLASSIFICADO' && post.price && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-lg">
                    <DollarSign size={20} />
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(post.price)}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 font-bold text-sm transition-colors ${
                      post.likes.some((l: any) => l.userId === user?.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={20} fill={post.likes.some((l: any) => l.userId === user?.id) ? 'currentColor' : 'none'} />
                    {post._count.likes}
                  </button>
                  <button 
                    onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors"
                  >
                    <MessageCircle size={20} />
                    {post._count.comments} Comentários
                  </button>
                  <div className="ml-auto text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                    <Calendar size={12} />
                    {post.isArchived ? 'Expirou em' : 'Expira em'} {new Date(post.expiresAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Seção de Comentários */}
              {activeCommentId === post.id && (
                <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4 mb-6">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3 items-start">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-bold text-blue-600 border border-slate-200 shrink-0">
                          {comment.user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black text-slate-800">{comment.user.name}</span>
                            <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Escreva um comentário..."
                      className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <button 
                      onClick={() => handleAddComment(post.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Megaphone size={20} /> Criar Publicação
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-6 space-y-6">
              <div className="flex gap-3">
                {Object.entries(categoryMap).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewPost({...newPost, category: key})}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      newPost.category === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`${newPost.category === key ? 'text-blue-600' : 'text-slate-400'}`}>
                      {value.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase ${newPost.category === key ? 'text-blue-600' : 'text-slate-400'}`}>
                      {value.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Título do Post</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Dê um título para sua mensagem"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-800"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Descrição</label>
                  <textarea 
                    required
                    placeholder="Descreva seu comunicado, pensamento ou item..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[120px] text-slate-700"
                    value={newPost.description}
                    onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                  />
                </div>

                {newPost.category === 'CLASSIFICADO' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Valor (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-emerald-600"
                        value={newPost.price}
                        onChange={(e) => setNewPost({...newPost, price: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {user?.role === 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Data de Vencimento (Opcional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-blue-600"
                        value={newPost.expiresAt}
                        onChange={(e) => setNewPost({...newPost, expiresAt: e.target.value})}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tight">Deixe vazio para o padrão de 30 dias.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Publicar no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-12 text-center pb-8">
        <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full text-red-600 bg-white shadow-sm border border-red-100">
          Estação do Mar Management Portal • {APP_VERSION}
        </span>
      </div>
    </div>
  );
}
