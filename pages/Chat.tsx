
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Card, Input, Button } from '../components/UI';
import { MessageCircle, Send, AlertTriangle, ShieldAlert, CheckCircle, Eye, ImageIcon, MapPin, Loader2, Wifi, WifiOff } from 'lucide-react';
import { MockService } from '../services/mockService';
import { ChatMessage, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Carrega Nome do Bairro (Apenas visual)
  useEffect(() => {
    const loadHoodName = async () => {
        if (user?.neighborhoodId) {
            const hood = await MockService.getNeighborhoodById(user.neighborhoodId);
            setNeighborhoodName(hood?.name || '');
        } else if (user?.role === UserRole.ADMIN) {
            setNeighborhoodName('Visão Global (Admin)');
        }
    };
    loadHoodName();
  }, [user?.neighborhoodId, user?.role]);

  // 2. Busca Mensagens Iniciais
  useEffect(() => {
      const fetchInitialMessages = async () => {
          if (!user) return;
          const data = await MockService.getMessages(user.neighborhoodId || '');
          setMessages(data);
      };
      fetchInitialMessages();
  }, [user?.neighborhoodId]); // Só recarrega lista se mudar de bairro

  // 3. Configuração REALTIME OTIMIZADA
  useEffect(() => {
      if (!user) return;

      setConnectionStatus('CONNECTING');

      // Define filtro estrito: só escuta mensagens deste bairro
      const filterConfig = user.neighborhoodId 
        ? `neighborhood_id=eq.${user.neighborhoodId}` 
        : undefined;

      // Canal único baseado no ID do bairro para evitar conflitos
      const channelId = `chat_room_${user.neighborhoodId || 'global'}`;

      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: filterConfig 
          },
          (payload) => {
            const newMsg = payload.new as any;
            
            // Tratamento de mensagem recebida
            const formattedMsg: ChatMessage = {
                id: newMsg.id,
                neighborhoodId: newMsg.neighborhood_id,
                userId: newMsg.user_id,
                userName: newMsg.user_name,
                userRole: newMsg.user_role as UserRole,
                text: newMsg.text,
                timestamp: new Date(newMsg.timestamp),
                isSystemAlert: newMsg.is_system_alert,
                alertType: newMsg.alert_type,
                image: newMsg.image
            };

            setMessages((prev) => {
                if (prev.some(m => m.id === formattedMsg.id)) return prev;
                return [...prev, formattedMsg];
            });
          }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setConnectionStatus('CONNECTED');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setConnectionStatus('DISCONNECTED');
            }
        });

      return () => {
          supabase.removeChannel(channel);
          setConnectionStatus('DISCONNECTED');
      };
  }, [user?.neighborhoodId]); // CRÍTICO: Dependência reduzida para evitar reconexão

  // Scroll automático inteligente
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastMessageId]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !user) return;

      const tempId = crypto.randomUUID();
      const msgText = newMessage;
      
      // Optimistic UI Update (Mostra na hora antes de confirmar)
      const optimisticMsg: ChatMessage = {
          id: tempId,
          neighborhoodId: user.neighborhoodId || 'unknown',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          text: msgText,
          timestamp: new Date()
      };
      
      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');

      try {
        await MockService.sendMessage({
            neighborhoodId: user.neighborhoodId || undefined, 
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            text: msgText,
        });
      } catch (err) {
          console.error("Error sending message", err);
      }
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
      const colors = {
          [UserRole.ADMIN]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          [UserRole.INTEGRATOR]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          [UserRole.SCR]: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          [UserRole.RESIDENT]: "bg-gray-700/50 text-gray-300 border-gray-600",
      };

      const roleNames: Record<string, string> = {
          ADMIN: 'ADMINISTRADOR',
          INTEGRATOR: 'INTEGRADOR',
          SCR: 'MOTOVIGIA',
          RESIDENT: 'MORADOR'
      };

      return (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[role]} uppercase tracking-wider font-bold`}>
              {roleNames[role]}
          </span>
      );
  };

  const getAlertIcon = (type: string) => {
      switch(type) {
          case 'PANIC': return <ShieldAlert size={24} className="mb-1" />;
          case 'DANGER': return <AlertTriangle size={24} className="mb-1" />;
          case 'SUSPICIOUS': return <Eye size={24} className="mb-1" />;
          case 'OK': return <CheckCircle size={24} className="mb-1" />;
          default: return <MessageCircle size={24} />;
      }
  };

  return (
    <Layout>
        <div className="flex flex-col h-[calc(100vh-100px)]">
             <div className="mb-4">
                <h1 className="text-3xl font-bold text-white mb-2">Chat da Comunidade</h1>
                <p className="text-gray-400">Comunicação direta com seus vizinhos e a central.</p>
            </div>

            <Card className="flex-1 flex flex-col border-atalaia-border/50 overflow-hidden bg-[#0a0a0a]">
                <div className="p-4 border-b border-white/5 bg-[#111] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="text-atalaia-neon" size={20} />
                        <div>
                            <h3 className="font-bold text-white">
                                {neighborhoodName ? `Canal: ${neighborhoodName}` : 'Carregando...'}
                            </h3>
                            {connectionStatus === 'CONNECTED' && (
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <Wifi size={12} /> Conectado ao Bairro
                                </p>
                            )}
                            {connectionStatus === 'CONNECTING' && (
                                <p className="text-xs text-yellow-500 flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" /> Conectando...
                                </p>
                            )}
                            {connectionStatus === 'DISCONNECTED' && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <WifiOff size={12} /> Desconectado
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={12} />
                        Vínculo Seguro
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#080808]">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-10">
                            Nenhuma mensagem ainda. Inicie a conversa.
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.userId === user?.id;
                        const isAlert = msg.isSystemAlert;
                        
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                {!isAlert && (
                                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="text-xs font-bold text-gray-300">{msg.userName}</span>
                                        <RoleBadge role={msg.userRole} />
                                        <span className="text-[10px] text-gray-600">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                )}
                                
                                {isAlert ? (
                                    <div className="w-full flex justify-center my-2">
                                        <div className={`
                                            flex flex-col items-center justify-center p-4 rounded-xl border-2 w-[90%] md:w-[60%]
                                            ${msg.alertType === 'PANIC' ? 'bg-red-900/30 border-red-500/50 text-red-500' : 
                                              msg.alertType === 'DANGER' ? 'bg-orange-900/30 border-orange-500/50 text-orange-500' :
                                              msg.alertType === 'SUSPICIOUS' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-500' :
                                              'bg-green-900/30 border-green-500/50 text-green-500'}
                                        `}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {getAlertIcon(msg.alertType || '')}
                                                <span className="font-black text-lg uppercase tracking-wider">{msg.text}</span>
                                            </div>
                                            
                                            {/* RENDER ALERT IMAGE IF EXISTS */}
                                            {msg.image && (
                                                <div className="mb-2 w-full max-h-60 overflow-hidden rounded-lg border border-black/50 shadow-lg">
                                                    <img src={msg.image} alt="Evidência" className="w-full h-full object-cover" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                                                <span>Acionado por: <strong>{msg.userName}</strong></span>
                                                <span>•</span>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                                            ${isMe 
                                                    ? 'bg-atalaia-neon text-black rounded-tr-none' 
                                                    : 'bg-[#222] text-gray-200 border border-white/5 rounded-tl-none'
                                            }
                                        `}
                                    >
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[#111] border-t border-white/5 flex gap-3">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 !bg-black !border-white/10 focus:!border-atalaia-neon !h-12"
                        disabled={connectionStatus !== 'CONNECTED'} // Evita envio sem conexão
                    />
                    <Button type="submit" disabled={connectionStatus !== 'CONNECTED'} className="px-6 bg-white/5 hover:bg-atalaia-neon hover:text-black text-atalaia-neon transition-colors h-12 disabled:opacity-50">
                        <Send size={20} />
                    </Button>
                </form>
            </Card>
        </div>
    </Layout>
  );
};

export default Chat;
