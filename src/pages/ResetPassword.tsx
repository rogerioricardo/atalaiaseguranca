import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button, Input, Card } from '@/components/UI';
import { ShieldCheck, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A nova senha deve possuir no mínimo 6 caracteres.');
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const { error: resetError } = await supabase.auth.updateUser({ password });
            if (resetError) throw resetError;

            setSuccess('Senha redefinida com sucesso! Redirecionando para o painel...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        } catch (err: any) {
            console.error('[ResetPassword] Error:', err);
            setError(err.message || 'Erro ao redefinir a senha. O token pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#010101] relative overflow-hidden px-4 py-8">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-atalaia-neon/5 rounded-full blur-[120px]" />
            
            <Card className="w-full max-w-md p-8 border-atalaia-border relative z-10 bg-[#040404]">
                <button 
                    onClick={() => navigate('/login')}
                    className="absolute top-6 left-6 text-gray-500 hover:text-atalaia-neon transition-colors flex items-center gap-2 text-sm font-medium group"
                >
                    <ArrowLeft size={18} />
                    <span>Voltar ao login</span>
                </button>

                <div className="text-center mb-8 pt-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-atalaia-neon/10 text-atalaia-neon mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Nova Senha</h1>
                    <p className="text-gray-500 text-sm mt-2">
                        Digite sua nova credencial de acesso tático ao Atalaia.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-500 text-sm">
                        <CheckCircle size={20} className="shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input 
                        label="Nova Senha" 
                        type="password" 
                        placeholder="Mínimo 6 caracteres" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6} 
                    />
                    <Input 
                        label="Confirmar Nova Senha" 
                        type="password" 
                        placeholder="Repita a senha acima" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        minLength={6} 
                    />

                    <Button type="submit" className="w-full h-12 text-sm uppercase tracking-wider font-bold mt-6" disabled={loading || !!success}>
                        {loading ? <><Loader2 className="animate-spin mr-2" /> Salvando...</> : 'Definir Nova Senha'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ResetPassword;
