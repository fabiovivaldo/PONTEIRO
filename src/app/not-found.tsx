import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-6">
      <div className="bg-primary/10 p-4 rounded-3xl">
        <BrainCircuit className="h-16 w-16 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-black uppercase tracking-tighter text-primary">404</h1>
        <h2 className="text-xl font-bold uppercase tracking-widest opacity-70">Página Não Encontrada</h2>
      </div>
      <p className="max-w-md text-muted-foreground font-medium">
        O recurso que você está procurando não existe ou foi movido para outro endereço.
      </p>
      <Button asChild className="font-black uppercase tracking-widest px-8 h-12 rounded-2xl">
        <Link href="/">Voltar ao Início</Link>
      </Button>
    </div>
  );
}
