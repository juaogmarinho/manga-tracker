# Kitsune Tracker

Aplicação web para acompanhar animes e mangás, com autenticação, biblioteca individual, backups e painel administrativo.

## Estrutura

```text
index.html                        Interface principal
style.css                         Estilos base
enhancements.css                  Tela de acesso, refinamentos visuais e área VIP
admin.css                         Estilos do painel administrativo
app.js                            Biblioteca, filtros, ordenação, obras e backup
auth.js                           Login, cadastro e administrador local
cloud.js                          Integração Supabase, sincronização e VIP
sync.js                           Carregamento da biblioteca online
public-settings.js                Aplicação de personalizações globais
admin.js                          Painel administrativo (personalização + catálogo VIP)
vip.js                            Página de assinatura VIP e catálogo de mangás exclusivos
api/config.js                     Endpoint Vercel para configuração pública do Supabase
api/mercadopago/create-preference.js  Cria a cobrança de R$ 3,00 no Mercado Pago
api/mercadopago/webhook.js        Confirma o pagamento e ativa a assinatura VIP
supabase/schema.sql               Tabelas, políticas RLS e trigger do Supabase
```

## Minha biblioteca

A biblioteca ganhou: ordenação (recentes, atualizados, nome, nota, progresso), contador de
resultados, busca por nome **ou** categoria e um botão para limpar todos os filtros de uma vez.
Também foram corrigidos bugs que afetavam a tela de detalhes (ações como editar/excluir podiam
atingir a obra errada quando havia nomes repetidos), obras importadas sem categoria (que travavam
a tela) e categorias novas criadas durante o cadastro de uma obra, que se perdiam se o formulário
fosse cancelado sem salvar.

## Área VIP (R$ 3,00 · Mercado Pago)

Assinantes VIP pagam R$ 3,00 via Mercado Pago (Pix ou cartão, na página de checkout do próprio
Mercado Pago) e ganham acesso, por 30 dias, a um catálogo de mangás cadastrado pelo administrador.
Sem o Supabase e o Mercado Pago configurados, a página VIP funciona em modo de demonstração local
(sem cobrança real).

Para habilitar pagamentos reais:

1. Crie uma conta/aplicação no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
   e copie o **Access Token** de produção.
2. Em **Project Settings → API** no Supabase, copie também a chave **service_role** (além da
   `anon public` já usada). Ela é necessária só no webhook, roda apenas no servidor e **nunca**
   deve ser usada no navegador.
3. Na Vercel, além de `SUPABASE_URL` e `SUPABASE_ANON_KEY`, adicione:

   - `SUPABASE_SERVICE_ROLE_KEY`: a chave service_role do Supabase.
   - `MERCADOPAGO_ACCESS_TOKEN`: o Access Token do Mercado Pago.

4. No painel do Mercado Pago, nenhuma configuração extra de URL é necessária: a `notification_url`
   e as `back_urls` são geradas automaticamente a partir do domínio do próprio deploy.
5. No painel de Administração do site, cadastre os mangás do catálogo VIP (título, capa, descrição
   e link de leitura).

Por padrão, cada pagamento aprovado libera 30 dias de acesso VIP (renovação manual: o usuário
assina novamente ao expirar). Uma assinatura recorrente automática exigiria o produto de
"assinaturas" (preapproval) do Mercado Pago, que precisa de configuração adicional na conta.

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
