# Kitsune Tracker

Aplicação web para acompanhar animes e mangás, com autenticação, biblioteca individual, backups e painel administrativo.

## Estrutura

```text
index.html             Interface principal
style.css              Estilos base
enhancements.css       Tela de acesso e refinamentos visuais
admin.css              Estilos do painel administrativo
app.js                 Biblioteca, filtros, obras e backup
auth.js                Login, cadastro e administrador local
cloud.js               Integração Supabase e sincronização
sync.js                Carregamento da biblioteca online
public-settings.js     Aplicação de personalizações globais
admin.js               Painel administrativo
api/config.js          Endpoint Vercel para configuração pública
supabase/schema.sql    Tabelas, políticas RLS e trigger do Supabase
```

## Visualização local

Abra `index.html` em um navegador. Sem banco configurado, entre com:

- E-mail: `admin@kitsune.local`
- Senha: `admin123`

Esse administrador existe apenas para visualização local; não é usado após conectar o Supabase.

## Deploy: Supabase + Vercel

1. Crie um projeto gratuito no [Supabase](https://supabase.com/dashboard).
2. Abra **SQL Editor → New query**, cole todo o arquivo `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
4. Em **Authentication → URL Configuration**, adicione `http://localhost:3000` em Redirect URLs para desenvolvimento. Após publicar, inclua também `https://SEU-PROJETO.vercel.app`.
5. Envie esta pasta para um repositório GitHub.
6. Na [Vercel](https://vercel.com/new), importe o repositório. Não é necessário framework ou comando de build: mantenha as configurações padrão.
7. Em **Settings → Environment Variables**, crie:

   - `SUPABASE_URL`: a Project URL do Supabase.
   - `SUPABASE_ANON_KEY`: a chave anon public do Supabase.

8. Faça um novo deploy. A rota `/api/config` disponibiliza essas chaves públicas ao navegador.
9. Crie sua primeira conta no site publicado. Em seguida, rode no SQL Editor, substituindo pelo seu e-mail:

   ```sql
   update public.profiles
   set is_admin = true
   where id = (select id from auth.users where email = 'seu@email.com');
   ```

10. Saia e entre novamente. O item **Administração** aparecerá na barra lateral.

## Segurança

Nunca configure ou publique a chave `service_role`. A aplicação usa somente `SUPABASE_ANON_KEY`, e o banco protege bibliotecas individuais com Row Level Security.
