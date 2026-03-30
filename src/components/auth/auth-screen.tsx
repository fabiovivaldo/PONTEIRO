'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, LogIn } from 'lucide-react';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(matricula);
      } else {
        await register(name, matricula, email);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              {isLogin ? <LogIn className="w-8 h-8 text-primary" /> : <UserPlus className="w-8 h-8 text-primary" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isLogin ? 'Acessar Painel' : 'Criar Nova Conta'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Informe sua matrícula para entrar no sistema' 
              : 'Preencha seus dados para começar a usar'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm font-medium text-red-500 bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Seu nome" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input 
                id="matricula" 
                placeholder="Ex: 12345" 
                value={matricula} 
                onChange={(e) => setMatricula(e.target.value)} 
                required 
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
            <div className="text-sm text-center text-slate-500">
              {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
              <button 
                type="button" 
                className="ml-1 font-semibold text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Cadastre-se' : 'Faça Login'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
