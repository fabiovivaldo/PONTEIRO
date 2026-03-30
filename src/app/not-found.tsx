import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <h3 className="text-xl font-semibold mb-2">Página Não Encontrada</h3>
      <p className="text-muted-foreground mb-6">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <Link href="/">
        <Button variant="default">
          Voltar para o Início
        </Button>
      </Link>
    </div>
  );
}
