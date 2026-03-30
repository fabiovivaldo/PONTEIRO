# Migração para Supabase

Para concluir a migração, siga os passos abaixo no seu painel do Supabase:

## 1. Criar a Tabela `ponteiros`

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- 1. Tabela de Perfis (Usuários)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    matricula TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Configurações do Usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    fainas_favoritas JSONB DEFAULT '[]', -- Lista de fainas que o usuário marcou como favorito
    notificacoes_ativas BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Criar a tabela de ponteiros
CREATE TABLE IF NOT EXISTS ponteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    data_turno TEXT NOT NULL,
    turno TEXT NOT NULL, -- Identificador do período (ex: 07X13)
    funcao TEXT NOT NULL,
    sinal TEXT,
    original_1 TEXT,
    temporario_1 TEXT,
    original_2 TEXT,
    temporario_2 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
    
    -- NOTA: A restrição UNIQUE foi removida para permitir múltiplas linhas da mesma função no mesmo turno.
    -- A lógica de substituição de tabela é gerenciada pela aplicação (delete + insert por turno).
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponteiros ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso (Simples para o protótipo)
CREATE POLICY "Acesso público aos perfis" ON profiles FOR ALL USING (true);
CREATE POLICY "Acesso público às configurações" ON user_settings FOR ALL USING (true);

-- Criar política para leitura (apenas o próprio usuário)
CREATE POLICY "Usuários podem ver seus próprios ponteiros" 
ON ponteiros FOR SELECT 
USING (true); -- Permitir leitura pública para o protótipo (ajuste conforme necessário)

-- Criar política para inserção/update
CREATE POLICY "Usuários podem gerenciar seus próprios ponteiros" 
ON ponteiros FOR ALL 
USING (true)
WITH CHECK (true); -- Permitir gerenciamento público para o protótipo (ajuste conforme necessário)
```

## 2. Configurar Variáveis de Ambiente

Adicione as seguintes chaves no seu ambiente (ou arquivo `.env` local):

- `NEXT_PUBLIC_SUPABASE_URL`: A URL do seu projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A chave anônima (anon key) do seu projeto.

## 3. Sincronização

O sistema agora possui uma função `syncPonteiroDataToSupabase()` no `src/lib/data-service.ts` que pode ser chamada para popular o banco de dados com os dados raspados do site oficial.
