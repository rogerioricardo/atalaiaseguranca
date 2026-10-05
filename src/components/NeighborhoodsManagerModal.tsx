import React, { useState } from 'react';
import { Neighborhood, Camera } from '../types';
import { MockService } from '../services/mockService';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  AlertTriangle, 
  Check, 
  Video, 
  Loader2,
  ShieldAlert,
  Layers
} from 'lucide-react';

interface NeighborhoodsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  neighborhoods: Neighborhood[];
  cameras: Camera[];
  onNeighborhoodsChanged: () => void;
  onSelectNeighborhood?: (id: string) => void;
}

export const NeighborhoodsManagerModal: React.FC<NeighborhoodsManagerModalProps> = ({
  isOpen,
  onClose,
  neighborhoods,
  cameras,
  onNeighborhoodsChanged,
  onSelectNeighborhood
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingHoodId, setEditingHoodId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deletion confirm state
  const [deletingHood, setDeletingHood] = useState<Neighborhood | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const filteredNeighborhoods = neighborhoods.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.description && h.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCameraCount = (hoodId: string) => {
    return cameras.filter(c => c.neighborhoodId === hoodId).length;
  };

  const handleStartCreate = () => {
    setEditingHoodId(null);
    setName('');
    setDescription('');
    setIsCreating(true);
  };

  const handleStartEdit = (hood: Neighborhood) => {
    setIsCreating(false);
    setEditingHoodId(hood.id);
    setName(hood.name);
    setDescription(hood.description || '');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingHoodId(null);
    setName('');
    setDescription('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do bairro.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingHoodId) {
        await MockService.updateNeighborhood(
          editingHoodId,
          name.trim(),
          description.trim() || 'Monitoramento integrado Atalaia.',
          ''
        );
      } else {
        await MockService.createNeighborhood(
          name.trim(),
          description.trim() || 'Monitoramento integrado Atalaia.',
          ''
        );
      }
      handleCancelForm();
      onNeighborhoodsChanged();
    } catch (err: any) {
      console.error('[NeighborhoodsManagerModal] Error saving neighborhood:', err);
      alert('Erro ao salvar bairro: ' + (err.message || 'Erro desconhecido.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingHood) return;
    setIsDeleting(true);
    try {
      await MockService.deleteNeighborhood(deletingHood.id);
      setDeletingHood(null);
      onNeighborhoodsChanged();
    } catch (err: any) {
      console.error('[NeighborhoodsManagerModal] Error deleting neighborhood:', err);
      alert('Erro ao excluir bairro: ' + (err.message || 'Erro desconhecido.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-scale-up">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-atalaia-neon/10 border border-atalaia-neon/30 flex items-center justify-center text-atalaia-neon">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                GESTOR DE BAIRROS
                <span className="text-xs px-2 py-0.5 rounded-full bg-atalaia-neon/20 text-atalaia-neon font-mono font-bold">
                  {neighborhoods.length} cadastrados
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Cadastre, edite ou exclua os bairros e zonas monitoradas do sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 border-b border-white/10 bg-black/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição de bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-atalaia-neon/50 transition-colors"
            />
          </div>
          {!isCreating && !editingHoodId && (
            <button
              onClick={handleStartCreate}
              className="px-4 py-2 bg-atalaia-neon text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-atalaia-neon/90 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-atalaia-neon/10"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Novo Bairro</span>
            </button>
          )}
        </div>

        {/* Form Container (Add / Edit) */}
        {(isCreating || editingHoodId) && (
          <div className="p-4 border-b border-atalaia-neon/30 bg-atalaia-neon/5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-atalaia-neon tracking-wider flex items-center gap-2">
                {editingHoodId ? <Edit3 size={14} /> : <Plus size={14} />}
                {editingHoodId ? 'Editar Dados do Bairro' : 'Cadastrar Novo Bairro'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Nome do Bairro *</label>
                <input
                  type="text"
                  placeholder="Ex: Jardim das Palmeiras, Centro Cívico..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-atalaia-neon"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Descrição / Região</label>
                <input
                  type="text"
                  placeholder="Ex: Zona Leste - Monitoramento com 8 câmeras integradas"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-atalaia-neon"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-atalaia-neon text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-atalaia-neon/90 transition-all flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>{editingHoodId ? 'Atualizar Bairro' : 'Cadastrar Bairro'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Neighborhoods List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-white/5">
          {filteredNeighborhoods.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <Layers size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhum bairro encontrado com esses termos.</p>
            </div>
          ) : (
            filteredNeighborhoods.map((hood) => {
              const camCount = getCameraCount(hood.id);
              return (
                <div
                  key={hood.id}
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white group-hover:text-atalaia-neon transition-colors">
                        {hood.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 font-mono">
                        <Video size={10} className="text-atalaia-neon" />
                        {camCount} {camCount === 1 ? 'câmera' : 'câmeras'}
                      </span>
                    </div>
                    {hood.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{hood.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {onSelectNeighborhood && (
                      <button
                        onClick={() => {
                          onSelectNeighborhood(hood.id);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-colors"
                        title="Selecionar este bairro para visualização"
                      >
                        Visualizar
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(hood)}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-blue-600/20 hover:text-blue-400 text-zinc-400 border border-white/5 transition-colors"
                      title="Editar bairro"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeletingHood(hood)}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-600/20 hover:text-red-400 text-zinc-400 border border-white/5 transition-colors"
                      title="Excluir bairro"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sistema Atalaia • Permissão de Administrador</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Confirmation Modal for Deletion */}
      {deletingHood && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-red-500/40 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black tracking-tight text-white">
                Excluir Bairro Permanentemente?
              </h3>
              <p className="text-xs text-zinc-400">
                Você está prestes a excluir o bairro <strong className="text-white font-bold">"{deletingHood.name}"</strong>.
              </p>
              {getCameraCount(deletingHood.id) > 0 && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-left flex items-start gap-2.5 mt-2">
                  <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300 leading-tight">
                    <strong>Atenção:</strong> Existem <strong>{getCameraCount(deletingHood.id)}</strong> câmera(s) associadas a este bairro. A exclusão removerá as associações e os dados de monitoramento desse setor.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingHood(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-bold text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
