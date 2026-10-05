
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '@/auth/context';
import { UserRole, Neighborhood } from '../types';
import { MockService } from '../services/mockService';
import { WhaticketService } from '../services/whaticketService';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Badge } from '../components/UI';
import { 
    MessageSquare, Send, Users, Wifi, Loader2, Save, 
    Plus, XCircle, Search, Trash2, Smartphone,
    Shield, MapPin, CheckCircle, Sparkles, HelpCircle, Info, RefreshCw, AlertTriangle, Database, Edit2,
    Key, Check, Lock, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WhatsAppAdmin: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'broadcast' | 'templates' | 'credentials'>('credentials');
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    
    // Credenciais Whaticket
    const [whaticketToken, setWhaticketToken] = useState('HSYumH8GyDXc90Bb1ZcBoVMBjatynktt');
    const [whaticketApiKey, setWhaticketApiKey] = useState('Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp');
    const [whaticketUrl, setWhaticketUrl] = useState('https://app.whatendimento.digital/backend/api/messages/send');
    const [savingCredentials, setSavingCredentials] = useState(false);
    const [credStatus, setCredStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [testPhone, setTestPhone] = useState('');
    const [testingMessage, setTestingMessage] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; text: string } | null>(null);

    const [templates, setTemplates] = useState<Record<string, string>>({});
    const [lastSavedValues, setLastSavedValues] = useState<Record<string, string>>({});
    const [templateSearch, setTemplateSearch] = useState('');
    const [newTemplateKey, setNewTemplateKey] = useState('');
    const [newTemplateValue, setNewTemplateValue] = useState('');
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [settingToDelete, setSettingToDelete] = useState<string | null>(null);

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
            
            const combinedTemplates = {
                'aviso_login': '🔐 *ATALAIA - AVISO DE ACESSO*\n\nOlá *{{name}}*!\nDetectamos um novo login em sua conta.\n⏰ Data/Hora: {{time}}\n\nSe você reconhece este acesso, nenhuma ação é necessária.',
                'welcome_template': '🛡️ *BEM-VINDO AO PROJETO ATALAIA*\n\nOlá, *{{name}}*!\n\nSeu cadastro na rede de proteção comunitária foi realizado com sucesso.\nAgora você conta com monitoramento inteligente, rondas preventivas e canal de emergência direto pelo aplicativo!\n\n📌 Bairro: *{{neighborhood}}*\n⏰ Data de Ativação: {{time}}\n\n_Atalaia - Segurança Colaborativa em Primeiro Lugar._',
                'chat_mirror_template': '*CHAT ATALAIA*\nDe: {user}\n{text}',
                'service_request_template': '*SOLICITAÇÃO DE SERVIÇO*\nTipo: {type}\nMorador: {user}\nBairro vigiado.',
                'support_ticket_template': '*SUPORTE ATALAIA*\nUsuário: {user}\nChamado: {text}',
                'template_broadcast_prefix': '🚨 [ATALAIA ALERTA]',
                ...settings
            };

            setNeighborhoods(hoods);
            setTemplates(combinedTemplates);
            setLastSavedValues(combinedTemplates);
            if (settings['whaticket_token']) setWhaticketToken(settings['whaticket_token']);
            if (settings['whaticket_api_key']) setWhaticketApiKey(settings['whaticket_api_key']);
            if (settings['whaticket_url']) setWhaticketUrl(settings['whaticket_url']);
            if (hoods.length > 0 && !selectedHoodId) setSelectedHoodId(hoods[0].id);
        } catch (e: any) {
            setLoadError("Erro ao sincronizar com o banco: " + e.message);
        } finally {
            setLoading(false);
        }
    }, [selectedHoodId]);

    const handleSaveCredentials = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSavingCredentials(true);
        setCredStatus(null);
        try {
            await Promise.all([
                MockService.updateSetting('whaticket_token', whaticketToken.trim()),
                MockService.updateSetting('whaticket_api_key', whaticketApiKey.trim()),
                MockService.updateSetting('whaticket_url', whaticketUrl.trim())
            ]);
            setCredStatus({ type: 'success', msg: 'Credenciais Whaticket salvas com sucesso no banco de dados!' });
            await loadData();
        } catch (e: any) {
            setCredStatus({ type: 'error', msg: 'Erro ao salvar credenciais: ' + e.message });
        } finally {
            setSavingCredentials(false);
        }
    };

    const handleTestCredentials = async () => {
        if (!testPhone.trim()) {
            setTestResult({ success: false, text: 'Digite um número de WhatsApp (com DDD, ex: 5548999999999) para testar.' });
            return;
        }
        setTestingMessage(true);
        setTestResult(null);
        try {
            const result = await WhaticketService.sendMessage(
                '🔔 *Teste de Conexão Atalaia -> Whaticket*\nAs credenciais da API foram atualizadas e a comunicação está ativa com sucesso!',
                [testPhone.trim()],
                whaticketToken.trim(),
                whaticketUrl.trim()
            );
            const failed = result?.results?.find((r: any) => !r.success);
            if (failed) {
                setTestResult({ success: false, text: `Erro retornado pela API: ${failed.error || 'Falha no envio'}` });
            } else {
                setTestResult({ success: true, text: 'Mensagem de teste disparada com sucesso via Whaticket (200 OK)!' });
            }
        } catch (e: any) {
            setTestResult({ success: false, text: 'Falha ao testar envio: ' + e.message });
        } finally {
            setTestingMessage(false);
        }
    };

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
                            <MessageSquare className="text-green-500" size={32} /> Central WhatsApp (Whaticket)
                        </h1>
                        <p className="text-gray-400">Canal: app.whatendimento.digital</p>
                    </div>
                    <div className="flex bg-[#111] p-1 rounded-xl border border-atalaia-border shadow-inner">
                        <button onClick={() => setActiveTab('credentials')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'credentials' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Credenciais API</button>
                        <button onClick={() => setActiveTab('templates')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Templates</button>
                        <button onClick={() => setActiveTab('broadcast')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'broadcast' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Disparos</button>
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
                ) : activeTab === 'credentials' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Status Bar */}
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <CheckCircle size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white">Integração Whaticket Ativa</h3>
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-bold">ONLINE</span>
                                    </div>
                                    <p className="text-xs text-zinc-400">As credenciais configuradas abaixo são utilizadas para todos os alertas, chamados e disparos.</p>
                                </div>
                            </div>
                            <button 
                                onClick={loadData}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 flex items-center gap-2 border border-white/10 transition-colors"
                            >
                                <RefreshCw size={14} /> Recarregar
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Credenciais Form */}
                            <div className="lg:col-span-2">
                                <Card className="p-8 border-white/10 bg-[#0a0a0a] shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-atalaia-neon/50 to-transparent" />
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-atalaia-neon/10 text-atalaia-neon rounded-xl border border-atalaia-neon/20">
                                                <Key size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Credenciais da API Whaticket</h2>
                                                <p className="text-xs text-zinc-400">Canal: app.whatendimento.digital</p>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveCredentials} className="space-y-6">
                                        <div>
                                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Lock size={12} className="text-atalaia-neon" /> Token Whaticket
                                            </label>
                                            <input 
                                                type="text" 
                                                value={whaticketToken}
                                                onChange={(e) => setWhaticketToken(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:border-atalaia-neon outline-none transition-all"
                                                placeholder="Ex: HSYumH8GyDXc90Bb1ZcBoVMBjatynktt"
                                                required
                                            />
                                            <p className="text-[10px] text-zinc-500 mt-1.5">Enviado no header <code className="text-zinc-400">Authorization: Bearer</code>.</p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Key size={12} className="text-atalaia-neon" /> Chave API (API Key)
                                            </label>
                                            <input 
                                                type="text" 
                                                value={whaticketApiKey}
                                                onChange={(e) => setWhaticketApiKey(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:border-atalaia-neon outline-none transition-all"
                                                placeholder="Ex: Oava7PjfYdGfc6AwQXnNTrLDIj030OdtfHgm3o+bK2Qp"
                                                required
                                            />
                                            <p className="text-[10px] text-zinc-500 mt-1.5">Enviado no header <code className="text-zinc-400">apikey</code> para autenticação adicional da instância.</p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <ExternalLink size={12} className="text-blue-400" /> URL Endpoint da API
                                            </label>
                                            <input 
                                                type="text" 
                                                value={whaticketUrl}
                                                onChange={(e) => setWhaticketUrl(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-zinc-300 focus:border-atalaia-neon outline-none transition-all"
                                                placeholder="https://app.whatendimento.digital/backend/api/messages/send"
                                                required
                                            />
                                            <p className="text-[10px] text-zinc-500 mt-1.5">Endpoint ativo do backend Whaticket: <code className="text-zinc-400">/backend/api/messages/send</code>.</p>
                                        </div>

                                        {credStatus && (
                                            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                                                credStatus.type === 'success' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                                {credStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                                {credStatus.msg}
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-2">
                                            <Button type="submit" disabled={savingCredentials} className="px-8 h-12">
                                                {savingCredentials ? (
                                                    <><Loader2 className="animate-spin mr-2" size={16} /> Salvando...</>
                                                ) : (
                                                    <><Save size={16} className="mr-2" /> Salvar Credenciais</>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            </div>

                            {/* Test Card */}
                            <div>
                                <Card className="p-8 border-white/10 bg-[#0a0a0a] shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                                <Send size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Testar Conexão</h3>
                                                <p className="text-xs text-zinc-400">Envie um teste imediato</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            Valide se o Whaticket está recebendo requisições com o novo token e chave API informados:
                                        </p>

                                        <div>
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">
                                                Número de Destino (com DDD)
                                            </label>
                                            <input 
                                                type="text" 
                                                value={testPhone}
                                                onChange={(e) => setTestPhone(e.target.value)}
                                                placeholder="Ex: 5548999999999"
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-atalaia-neon outline-none"
                                            />
                                        </div>

                                        {testResult && (
                                            <div className="space-y-3">
                                                <div className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2 ${
                                                    testResult.success 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                    {testResult.success ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                                                    <span>{testResult.text}</span>
                                                </div>

                                                {testResult.success && (
                                                    <div className="p-3.5 bg-blue-500/5 border border-blue-500/15 rounded-xl text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                                                        <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                                                            <Info size={14} className="text-blue-400" /> Mensagem colocada na fila do Whaticket:
                                                        </p>
                                                        <p>Se o aparelho ainda não recebeu a mensagem, verifique no painel do <strong>Whaticket</strong>:</p>
                                                        <ul className="list-disc list-inside text-zinc-400 space-y-1 pl-1">
                                                            <li><strong>Conexão WhatsApp:</strong> Verifique se a conexão WhatsApp está com status <span className="text-emerald-400 font-bold">CONECTADO</span> (QR Code logado) em <code className="text-zinc-300">app.whatendimento.digital</code>.</li>
                                                            <li><strong>Variação do 9º Dígito:</strong> Tente com ou sem o 9º dígito (ex: <code className="text-zinc-300">554899...</code> ou <code className="text-zinc-300">5548...</code>).</li>
                                                            <li><strong>Fila de Mensagens:</strong> Verifique na aba de filas/mensagens do Whaticket se o envio aguarda liberação.</li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button 
                                        type="button" 
                                        onClick={handleTestCredentials}
                                        disabled={testingMessage}
                                        className="w-full mt-6 h-12"
                                    >
                                        {testingMessage ? (
                                            <><Loader2 className="animate-spin mr-2" size={16} /> Disparando Teste...</>
                                        ) : (
                                            <><Send size={16} className="mr-2" /> Enviar Mensagem de Teste</>
                                        )}
                                    </Button>
                                </Card>
                            </div>
                        </div>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                             {/* Configuração Extra: Admin WhatsApp */}
                             <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-atalaia-neon/30 transition-all group">
                                <div>
                                    <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                                        <Smartphone size={16} className="text-blue-400" /> Admin Monitor
                                    </h3>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Monitor Geral do Sistema</label>
                                    <input 
                                        type="text" 
                                        value={templates['admin_whatsapp'] || ''}
                                        onChange={(e) => setTemplates({...templates, admin_whatsapp: e.target.value})}
                                        placeholder="554899999999"
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:border-atalaia-neon outline-none"
                                    />
                                    <p className="text-[9px] text-gray-600 mt-2">Recebe avisos automáticos de logins, chamados e cadastros.</p>
                                </div>
                                <Button 
                                    className="mt-4 h-9 text-xs font-bold" 
                                    onClick={() => handleSaveTemplate('admin_whatsapp', templates['admin_whatsapp'] || '')}
                                    disabled={savingKeys.has('admin_whatsapp')}
                                >
                                    {savingKeys.has('admin_whatsapp') ? 'Gravando...' : 'Salvar Admin'}
                                </Button>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col hover:border-atalaia-neon/30 transition-all">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                                    <Shield size={16} className="text-emerald-400" /> Aviso de Login
                                </h3>
                                <p className="text-[10px] text-gray-500 mb-2 font-medium">Disparado no Zap do morador e admin ao acessar a conta (Tags: <strong>{'{name}'}</strong>, <strong>{'{time}'}</strong>).</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-auto h-8 text-[9px] uppercase font-black"
                                    onClick={() => setTemplateSearch('aviso_login')}
                                >
                                    Editar Template
                                </Button>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col hover:border-atalaia-neon/30 transition-all">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                                    <Sparkles size={16} className="text-amber-400" /> Boas-Vindas
                                </h3>
                                <p className="text-[10px] text-gray-500 mb-2 font-medium">Enviado no novo cadastro de moradores (Tags: <strong>{'{name}'}</strong>, <strong>{'{neighborhood}'}</strong>).</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-auto h-8 text-[9px] uppercase font-black"
                                    onClick={() => setTemplateSearch('welcome_template')}
                                >
                                    Editar Template
                                </Button>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col hover:border-atalaia-neon/30 transition-all">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                                    <RefreshCw size={16} className="text-green-400" /> Espelhamento Chat
                                </h3>
                                <p className="text-[10px] text-gray-500 mb-2 font-medium">Define como a mensagem do chat chega no Zap do morador (Tags: <strong>{'{user}'}</strong>, <strong>{'{text}'}</strong>).</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-auto h-8 text-[9px] uppercase font-black"
                                    onClick={() => setTemplateSearch('chat_mirror')}
                                >
                                    Configurar Template
                                </Button>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col hover:border-atalaia-neon/30 transition-all">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                                    <Shield size={16} className="text-yellow-400" /> Alertas Integrador
                                </h3>
                                <p className="text-[10px] text-gray-500 mb-2 font-medium">Define alertas de Escolta/Ronda para os Integradores (Tags: <strong>{'{type}'}</strong>, <strong>{'{user}'}</strong>).</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-auto h-8 text-[9px] uppercase font-black"
                                    onClick={() => setTemplateSearch('service_request')}
                                >
                                    Configurar Template
                                </Button>
                            </div>
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-white font-black uppercase tracking-tighter italic text-xl">Dicionário de Configurações</h2>
                            <p className="text-xs text-gray-500 italic">
                                Use o campo abaixo para buscar e editar qualquer valor de sistema.
                            </p>
                        </div>

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
                                                        <Edit2 size={18} className="pointer-events-none" />
                                                    </button>
                                                    <button onClick={() => handleSaveTemplate(key, val)} disabled={!isDirty || isSaving} className={`p-2 rounded-lg ${isDirty ? 'text-atalaia-neon' : 'text-gray-700'}`}><Save size={18} className="pointer-events-none" /></button>
                                                    <button onClick={() => setSettingToDelete(key)} className="p-2 text-red-700"><Trash2 size={18} className="pointer-events-none" /></button>
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
            <AnimatePresence>
                {settingToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-mono">
                                Remover Configuração
                            </h3>
                            <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans">
                                Deseja realmente remover a configuração <span className="text-white font-bold">"{settingToDelete}"</span> do banco de dados?
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSettingToDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (settingToDelete) {
                                            await MockService.deleteSetting(settingToDelete);
                                            await loadData();
                                            setSettingToDelete(null);
                                        }
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/15 cursor-pointer font-sans"
                                >
                                    Excluir
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default WhatsAppAdmin;
