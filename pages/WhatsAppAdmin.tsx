
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserRole, Neighborhood } from '../types';
import { MockService } from '../services/mockService';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Badge } from '../components/UI';
import { 
    MessageSquare, Send, Users, Wifi, Loader2, Save, 
    Plus, XCircle, Search, Trash2, Smartphone,
    Shield, MapPin, CheckCircle, Sparkles, HelpCircle, Info, RefreshCw, AlertTriangle, Database, Edit2
} from 'lucide-react';

const WhatsAppAdmin: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'broadcast' | 'templates'>('templates');
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    
    const [templates, setTemplates] = useState<Record<string, string>>({});
    const [lastSavedValues, setLastSavedValues] = useState<Record<string, string>>({});
    const [templateSearch, setTemplateSearch] = useState('');
    const [newTemplateKey, setNewTemplateKey] = useState('');
    const [newTemplateValue, setNewTemplateValue] = useState('');
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
    const [editingKey, setEditingKey] = useState<string | null>(null);

    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'ALL' | 'ADMINS' | 'HOOD' | 'INDIVIDUAL'>('ADMINS');
    const [selectedHoodId, setSelectedHoodId] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [hoods, settings] = await Promise.all([
                MockService.getNeighborhoods(true),
                MockService.getSettings(true)
            ]);
            
            setNeighborhoods(hoods);
            setTemplates(settings);
            setLastSavedValues(settings);
            if(hoods.length > 0 && !selectedHoodId) setSelectedHoodId(hoods[0].id);
        } catch (e: any) {
            setLoadError("Erro ao sincronizar com o banco: " + e.message);
        } finally {
            setLoading(false);
        }
    }, [selectedHoodId]);

    useEffect(() => { 
        if (user?.role === UserRole.ADMIN) loadData(); 
        
        const subSettings = MockService.subscribeToTable('system_settings', loadData);
        const subHoods = MockService.subscribeToTable('neighborhoods', loadData);

        return () => {
            supabase.removeChannel(subSettings);
            supabase.removeChannel(subHoods);
        };
    }, [user?.role, loadData]);

    const handleSaveTemplate = async (key: string, value: string) => {
        setSavingKeys(prev => new Set(prev).add(key));
        try {
            await MockService.updateSetting(key, value.trim());
            setLastSavedValues(prev => ({ ...prev, [key]: value.trim() }));
            setEditingKey(null); // Fecha edição após salvar
        } catch (e: any) { 
            alert("Erro ao gravar no banco: " + e.message); 
        } finally {
            setTimeout(() => setSavingKeys(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            }), 500);
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await MockService.updateSetting(newTemplateKey.trim(), newTemplateValue.trim());
            await loadData();
            setNewTemplateKey(''); 
            setNewTemplateValue(''); 
            setIsAddingTemplate(false);
        } catch (e: any) { alert(e.message); }
        finally { setSending(false); }
    };

    if (user?.role !== UserRole.ADMIN) return <Layout><div className="p-8 text-center text-gray-500">Acesso Negado.</div></Layout>;

    const filteredTemplates = (Object.entries(templates) as [string, string][]).filter(([k]) => k.toLowerCase().includes(templateSearch.toLowerCase()));

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <MessageSquare className="text-green-500" size={32} /> Central WhatsApp
                        </h1>
                        <p className="text-gray-400">Sincronizado com tabela `system_settings`.</p>
                    </div>
                    <div className="flex bg-[#111] p-1 rounded-xl border border-atalaia-border shadow-inner">
                        <button onClick={() => setActiveTab('broadcast')} className={`px-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'broadcast' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Disparos</button>
                        <button onClick={() => setActiveTab('templates')} className={`px-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Templates</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="text-atalaia-neon animate-spin mb-4" size={48} />
                        <p className="text-gray-500 font-black uppercase tracking-[0.2em]">Consultando Supabase...</p>
                    </div>
                ) : loadError ? (
                    <div className="py-20 text-center bg-red-900/10 border border-red-500/20 rounded-3xl">
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg">{loadError}</h3>
                        <Button onClick={loadData} className="mt-4"><RefreshCw size={18} className="mr-2"/> Tentar Novamente</Button>
                    </div>
                ) : activeTab === 'templates' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Button onClick={() => setIsAddingTemplate(!isAddingTemplate)} className="h-12 px-6">
                                {isAddingTemplate ? <XCircle size={18} className="mr-2"/> : <Plus size={18} className="mr-2"/>} 
                                {isAddingTemplate ? 'Cancelar' : 'Nova Chave'}
                            </Button>
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Filtrar chaves..." 
                                    className="w-full h-12 bg-black border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white focus:border-atalaia-neon outline-none" 
                                    value={templateSearch} 
                                    onChange={e => setTemplateSearch(e.target.value)} 
                                />
                            </div>
                            <button onClick={loadData} className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-atalaia-neon transition-colors">
                                <RefreshCw size={20} />
                            </button>
                        </div>

                        {isAddingTemplate && (
                            <Card className="p-8 border-atalaia-neon/40 bg-atalaia-neon/5 shadow-2xl animate-in slide-in-from-top-4">
                                <form onSubmit={handleCreateTemplate} className="space-y-6">
                                    <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center gap-2">
                                        <Sparkles className="text-atalaia-neon" size={18} /> Gravar Nova Configuração
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <Input label="Identificador (Chave)" value={newTemplateKey} onChange={e => setNewTemplateKey(e.target.value)} required placeholder="Ex: alerta_manual" />
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Mensagem WhatsApp</label>
                                            <textarea className="w-full h-32 bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:border-atalaia-neon outline-none resize-none" value={newTemplateValue} onChange={e => setNewTemplateValue(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={sending}>Criar Template</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredTemplates.map(([key, val]) => {
                                const isDirty = val.trim() !== (lastSavedValues[key] || '').trim();
                                const isSaving = savingKeys.has(key);
                                const isEditing = editingKey === key;
                                return (
                                    <Card key={key} className={`p-6 bg-[#0a0a0a] border-white/5 transition-all ${isSaving ? 'border-atalaia-neon/50 bg-atalaia-neon/5' : isEditing ? 'border-atalaia-neon/30' : isDirty ? 'border-yellow-500/30' : ''}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 text-gray-400 rounded-lg"><Smartphone size={16}/></div>
                                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{key.replace(/_/g, ' ')}</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isDirty && <Badge color="yellow">ALTERADO</Badge>}
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => setEditingKey(isEditing ? null : key)}
                                                        className={`p-2 rounded-lg transition-colors ${isEditing ? 'text-atalaia-neon bg-atalaia-neon/10' : 'text-blue-500 hover:bg-blue-500/10'}`} 
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18}/>
                                                    </button>
                                                    <button onClick={() => handleSaveTemplate(key, val)} disabled={!isDirty || isSaving} className={`p-2 rounded-lg ${isDirty ? 'text-atalaia-neon' : 'text-gray-700'}`}><Save size={18}/></button>
                                                    <button onClick={async () => { if(confirm('Remover do banco?')) { await MockService.deleteSetting(key); loadData(); } }} className="p-2 text-red-700"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                        </div>
                                        <textarea 
                                            readOnly={!isEditing}
                                            className={`w-full h-40 bg-black/40 border rounded-xl p-4 text-[11px] font-mono text-gray-300 outline-none resize-none transition-all ${isEditing ? 'border-atalaia-neon focus:ring-1 ring-atalaia-neon/20' : 'border-white/5 cursor-default'}`} 
                                            value={val} 
                                            onChange={e => setTemplates(prev => ({...prev, [key]: e.target.value}))} 
                                            autoFocus={isEditing}
                                        />
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <Card className="p-8 border-atalaia-neon/20 shadow-2xl max-w-4xl mx-auto">
                             <form onSubmit={async (e) => {
                                e.preventDefault();
                                setSending(true);
                                try {
                                    await MockService.sendCustomBroadcast(message, targetType, targetType === 'HOOD' ? selectedHoodId : undefined);
                                    setStatus({ type: 'success', msg: 'Mensagens enviadas via WhatsApp!' });
                                    setMessage('');
                                } catch (err: any) { setStatus({ type: 'error', msg: err.message }); }
                                finally { setSending(false); }
                            }} className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['ADMINS', 'HOOD', 'ALL', 'INDIVIDUAL'].map(t => (
                                        <button key={t} type="button" onClick={() => setTargetType(t as any)} className={`p-4 rounded-xl border text-[10px] font-black uppercase transition-all ${targetType === t ? 'border-atalaia-neon bg-atalaia-neon/10 text-atalaia-neon' : 'border-white/5 bg-black/40 text-gray-500'}`}>
                                            {t === 'HOOD' ? 'Bairro' : t === 'ADMINS' ? 'Admins' : t === 'ALL' ? 'Todos' : 'Manual'}
                                        </button>
                                    ))}
                                </div>
                                {targetType === 'HOOD' && (
                                    <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-white outline-none" value={selectedHoodId} onChange={e => setSelectedHoodId(e.target.value)}>
                                        {neighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                )}
                                <textarea className="w-full h-48 bg-black border border-white/10 rounded-2xl p-6 text-white text-sm focus:border-atalaia-neon outline-none resize-none" placeholder="Digite a mensagem para disparo..." value={message} onChange={e => setMessage(e.target.value)} />
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        {status && <div className={`text-sm font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{status.msg}</div>}
                                        {status?.type === 'error' && status.msg.includes('WHATSAPP_TOKEN') && (
                                            <p className="text-[10px] text-red-400 mt-1">Dica: Configure o WHATSAPP_TOKEN nos Secrets do Supabase.</p>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={sending || !message.trim()}>
                                        {sending ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-2"/> Disparar Agora</>}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WhatsAppAdmin;
