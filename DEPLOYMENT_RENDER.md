# Guia de Implantação e Deploy no Render (Fase Experimental)

Este documento descreve o processo completo para colocar o **Sistema BRM** online na nuvem através do **Render** em fase experimental.

---

## 🏗️ Arquitetura do Sistema

- **Frontend & UI:** React (Vite, TypeScript, Tailwind CSS, Lucide Icons).
- **Servidor Web / Container:** Docker com Nginx (Alpine Linux) otimizado com suporte a roteamento SPA (React Router) e endpoint `/healthz`.
- **Backend & Banco de Dados:** Supabase (PostgreSQL, Autenticação, Row Level Security, Storage).
- **Hospedagem:** Render (Web Service Docker no plano gratuito ou starter).

---

## 📋 Pré-requisitos

1. **Conta no Supabase** (https://supabase.com).
2. **Conta no Render** (https://render.com).
3. **Repositório Git** atualizado no GitHub (ou GitLab).

---

## 🗄️ Passo 1: Configuração do Supabase (Banco de Dados)

1. Acesse o [Supabase Dashboard](https://app.supabase.com) e crie um novo projeto.
2. Acesse o **SQL Editor** no painel do Supabase.
3. Execute o script unificado localizado em `supabase/SCRIPT_UNIFICADO_SUPABASE.sql` (ou os scripts individuais da pasta `supabase/`).
4. Acesse **Project Settings > API** e copie:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **Anon / Public Key** (`eyJhbGci...`)

---

## 🚀 Passo 2: Implantação no Render

### Método A: Implantação Automática via Blueprint (`render.yaml`) - RECOMENDADO

1. Acesse o [Render Dashboard](https://dashboard.render.com).
2. Clique em **New +** e selecione **Blueprint**.
3. Conecte o repositório GitHub do projeto.
4. O Render lerá automaticamente o arquivo `render.yaml` (serviço configurado como `sistema-brm`).
5. Preencha as variáveis de ambiente necessárias quando solicitado:
   - `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: A chave anônima (anon key) do seu Supabase.
6. Clique em **Apply**. O Render iniciará a compilação Docker e publicará a aplicação automaticamente em `https://sistema-brm.onrender.com`.

### Método B: Criação Manual do Web Service no Render

1. No Render Dashboard, clique em **New +** -> **Web Service**.
2. Escolha **Build and deploy from a Git repository**.
3. Selecione o repositório do projeto.
4. Configure os campos:
   - **Name:** `sistema-brm`
   - **Region:** `Oregon (US West)` ou de sua preferência.
   - **Branch:** `main` (ou o branch de produção/experimental).
   - **Environment:** `Docker`
   - **Dockerfile Path:** `Dockerfile`
   - **Docker Context:** `.`
   - **Health Check Path:** `/healthz`
5. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`: `https://seu-projeto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sua-chave-anonima-aqui`
6. Clique em **Create Web Service**.

---

## 🔍 Passo 3: Validação da Implantação

Após o término da compilação e deploy no Render (status `Live`):

1. **Health Check:** Acesse `https://sistema-brm.onrender.com/healthz` (deve retornar `OK`).
2. **Navegação do Frontend:** Acesse `https://sistema-brm.onrender.com`.
3. **Login e Acessos:** Realize o login no sistema e valide as rotas públicas (ex: `/inscricao`, `/cadastro-religiosos`) e administrativas.
4. **Logs no Render:** Em caso de dúvidas ou problemas, acompanhe os logs em tempo real na aba **Logs** do serviço no Render.

---

## 🛡️ Dicas de Segurança e Manutenção na Fase Experimental

- **SSL/HTTPS:** O Render disponibiliza certificados SSL gratuitos e automáticos para todos os domínios `.onrender.com`.
- **CORS no Supabase:** Lembre-se de adicionar a URL do Render (`https://sistema-brm.onrender.com`) nas configurações do Supabase em **Authentication > URL Configuration > Additional Redirect URLs** e no **CORS origin**.
