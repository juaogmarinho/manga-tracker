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
api/vip/activate-trial.js         Ativa o teste grátis do VIP (modo atual, sem cobrança)
api/mercadopago/create-preference.js  Cria a cobrança de R$ 3,00 no Mercado Pago (pronto p/ quando sair do teste)
api/mercadopago/webhook.js        Confirma o pagamento e ativa a assinatura VIP
supabase/schema.sql               Tabelas, políticas RLS e trigger do Supabase
```

## Meu perfil

Em **Configurações → Meu perfil**, cada usuário pode trocar o nome de exibição e enviar uma foto
(até 2,5 MB). Com o Supabase conectado, isso fica salvo em `profiles.avatar_url`/`full_name` e
sincroniza entre dispositivos; sem banco configurado, fica salvo só neste navegador.

## Minha biblioteca

A biblioteca ganhou: ordenação (recentes, atualizados, nome, nota, progresso), contador de
resultados, busca por nome **ou** categoria e um botão para limpar todos os filtros de uma vez.
Também foram corrigidos bugs que afetavam a tela de detalhes (ações como editar/excluir podiam
atingir a obra errada quando havia nomes repetidos), obras importadas sem categoria (que travavam
a tela) e categorias novas criadas durante o cadastro de uma obra, que se perdiam se o formulário
fosse cancelado sem salvar.

## Área VIP — atualmente em modo "Teste grátis"

Enquanto a Área VIP está em desenvolvimento, o botão de assinatura ativa um **teste grátis de 7
dias** (sem cobrança) em vez de cobrar via Mercado Pago. Isso é controlado por uma única constante
no topo de `vip.js`:

```js
const VIP_MODE = 'trial'; // troque para 'paid' quando quiser cobrar de verdade
```

Com `VIP_MODE = 'trial'`, o botão chama `/api/vip/activate-trial`, que confirma a sessão do
usuário no Supabase Auth e libera 7 dias de acesso ao catálogo. Com `VIP_MODE = 'paid'`, o
botão volta a usar o checkout do Mercado Pago (fluxo abaixo), sem precisar mexer em mais nada.

Assinantes (em teste ou pagos) ganham acesso a um catálogo de mangás cadastrado pelo administrador
em **Administração → Catálogo de mangás exclusivos**. Sem o Supabase configurado, a página VIP
funciona em modo de demonstração local (o teste grátis fica salvo só neste navegador).

### Habilitando o pagamento real (Mercado Pago)

1. Crie uma conta/aplicação no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
   e copie o **Access Token** de produção.
2. Em **Project Settings → API** no Supabase, copie também a chave **service_role** (além da
   `anon public` já usada). Ela é necessária para o webhook de pagamento e para o endpoint de
   teste grátis, roda apenas no servidor e **nunca** deve ser usada no navegador.
3. Na Vercel, além de `SUPABASE_URL` e `SUPABASE_ANON_KEY`, adicione:

   - `SUPABASE_SERVICE_ROLE_KEY`: a chave service_role do Supabase (necessária mesmo no modo
     de teste grátis, para o endpoint `activate-trial` gravar a assinatura).
   - `MERCADOPAGO_ACCESS_TOKEN`: o Access Token do Mercado Pago (só é usado quando `VIP_MODE`
     estiver como `'paid'`).

4. No painel do Mercado Pago, nenhuma configuração extra de URL é necessária: a `notification_url`
   e as `back_urls` são geradas automaticamente a partir do domínio do próprio deploy.
5. Troque `VIP_MODE` para `'paid'` em `vip.js` e publique um novo deploy.

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
