'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Loader2 } from 'lucide-react';

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let loginEmail = email;

    // Se não for um formato de e-mail (não contém @), tentamos buscar pela matrícula
    if (!email.includes('@')) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('matricula', email)
        .single();

      if (profileError || !data) {
        toast({
          title: "Erro no login",
          description: "Matrícula não encontrada ou inválida.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      loginEmail = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Bem-vindo de volta!",
      });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Sign up user
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          nome,
          matricula
        }
      }
    });

    if (authError) {
      toast({
        title: "Erro no cadastro",
        description: authError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: data.user.id, 
          nome, 
          matricula, 
          email 
        }]);

      if (profileError) {
        toast({
          title: "Erro ao criar perfil",
          description: profileError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado",
          description: "Sua conta foi criada com sucesso!",
        });
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">
            Ponteiro<span className="text-primary">Scope</span>
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
            Acesso ao Sistema Analítico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="text-[10px] font-black uppercase tracking-widest">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-[10px] font-black uppercase tracking-widest">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-70">E-mail ou Matrícula</Label>
                  <Input 
                    id="email" 
                    type="text" 
                    placeholder="seu@email.com ou 00000" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest opacity-70">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <Button type="submit" className="w-full font-black uppercase tracking-widest" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Entrar
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-nome" className="text-[10px] font-black uppercase tracking-widest opacity-70">Nome Completo</Label>
                  <Input 
                    id="reg-nome" 
                    type="text" 
                    placeholder="João Silva" 
                    required 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-matricula" className="text-[10px] font-black uppercase tracking-widest opacity-70">Matrícula</Label>
                  <Input 
                    id="reg-matricula" 
                    type="text" 
                    placeholder="00000" 
                    required 
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[10px] font-black uppercase tracking-widest opacity-70">E-mail</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[10px] font-black uppercase tracking-widest opacity-70">Senha</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <Button type="submit" className="w-full font-black uppercase tracking-widest" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            © 2026 OGMO/PR • Sistema de Monitoramento
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
