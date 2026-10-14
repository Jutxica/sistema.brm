# Guia Completo de Implantação no Easypanel (Sistema BRM / Conventinho)

Este guia ensina o passo a passo para colocar o **Sistema Conventinho / BRM** no ar usando o **Easypanel** (painel Docker moderno para VPS).

---

## 🏗️ Visão Geral da Arquitetura

- **Frontend:** React (Vite, TypeScript, Tailwind CSS).
- **Servidor Web:** Docker com Nginx (Alpine Linux) servindo os arquivos estáticos na porta `80`, com suporte a SPA e endpoint de saúde `/healthz`.
- **Backend & Banco de Dados:** 
  - **Opção A (Recomendada):** Supabase Cloud (https://supabase.com).
  - **Opção B (100% Self-hosted):** Template do Supabase dentro do próprio Easypanel.

---

## ⚠️ Ponto Crítico de Atenção (Vite + Docker)

No React com Vite, as variáveis de ambiente que começam com `VITE_` são **injetadas no momento do build (`npm run build`)** e embutidas nos arquivos JavaScript finais.

> [!IMPORTANT]
> No Easypanel, você **DEVE** adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na aba **Build > Build Args** (e também em **Environment**), caso contrário o frontend será compilado sem as credenciais do banco e não conseguirá conectar ao Supabase!

---

## 📋 Pré-requisitos

1. Um servidor VPS (Ubuntu 22.04/24.04 ou Debian 12) com o Easypanel instalado.
2. Seu código enviado para um repositório Git (GitHub ou GitLab).
3. As credenciais do Supabase (`URL` do projeto e `ANON_KEY`).
4. (Opcional) Um domínio apontado (DNS tipo A) para o IP do seu servidor VPS.

---

## 🚀 Passo a Passo no Easypanel

### 1. Criar o Projeto no Easypanel
1. Acesse o painel do seu Easypanel (`http://seu-ip:3000` ou pelo domínio do seu painel).
2. Clique no botão **+ Project** (ou **Create Project**).
3. Dê o nome de `sistema-conventinho` (ou `brm`).

---

### 2. Configurar o Banco de Dados (Supabase)

Escolha uma das duas opções:

#### Opção A: Usar Supabase Cloud (Mais simples e recomendado)
1. Crie o projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do Supabase, execute o script unificado localizado em:
   `supabase/SCRIPT_UNIFICADO_SUPABASE.sql`
3. Vá em **Project Settings > API** e copie:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **anon / public key** (chave longa `eyJhbGciOi...`)

#### Opção B: Rodar Supabase no próprio Easypanel
1. Dentro do projeto no Easypanel, clique em **+ Service > Template**.
2. Pesquise por **Supabase** e instale o template oficial do Easypanel.
3. Configure os domínios para o Studio e API.
4. Após inicializado, acerte o banco executando o script `supabase/SCRIPT_UNIFICADO_SUPABASE.sql`.

---

### 3. Criar o Serviço do Frontend (App)

1. Dentro do seu projeto no Easypanel, clique em **+ Service > App**.
2. Defina o nome do serviço (ex: `frontend` ou `sistema-brm`).

#### A. Aba Source (Origem do Código)
1. Selecione **Git** (ou **GitHub** se tiver integrado a conta).
2. Cole a URL do repositório: `https://github.com/usuario/repositorio.git`.
3. Selecione o Branch: `main` (ou o branch que você usa).
4. Se o repositório for privado, adicione a chave SSH Deploy Key ou Personal Access Token.

#### B. Aba Build (Configuração do Docker)
1. Em **Build Type**, selecione **Dockerfile**.
2. **Dockerfile Path**: `Dockerfile` (ou `./Dockerfile`).
3. **Context**: `.`
4. Na seção **Build Args** (Argumentos de Compilação), adicione:
   - **Key:** `VITE_SUPABASE_URL`  
     **Value:** `https://seu-projeto.supabase.co`
   - **Key:** `VITE_SUPABASE_ANON_KEY`  
     **Value:** `sua-chave-anonima-do-supabase`

#### C. Aba Environment (Variáveis de Ambiente)
Adicione também em **Environment Variables** (boa prática):
- `VITE_SUPABASE_URL` = `https://seu-projeto.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sua-chave-anonima-do-supabase`

#### D. Aba Ports & Domains
1. **Container Port**: Configure para `80` (o Nginx no Dockerfile escuta na porta 80).
2. **Domain**:
   - Adicione o seu domínio personalizado (ex: `sistema.seudominio.com.br`) ou use o subdomínio gratuito gerado pelo Easypanel (ex: `frontend-sistema.easypanel.host`).
   - O Easypanel gera certificado SSL (HTTPS) gratuito via Let's Encrypt de forma automática.

#### E. Aba Health Check (Opcional, mas recomendado)
1. **Path**: `/healthz`
2. O Nginx já possui uma rota pronta que responde `200 OK` nessa URL.

---

### 4. Deploy e Publicação

1. Clique no botão **Deploy** no canto superior direito do Easypanel.
2. Acompanhe a aba **Deployments / Logs**:
   - O Easypanel irá baixar o código;
   - Instalará as dependências (`npm ci`);
   - Compilará o frontend com Vite (`npm run build`);
   - Copiará os arquivos para a imagem Nginx;
   - Subirá o container na porta 80.
3. Assim que o status ficar verde (**Running**), acesse a URL configurada!

---

### 5. Configurar CORS e Redirecionamentos no Supabase

Para permitir autenticação e chamadas sem bloqueio:
1. Acesse o painel do Supabase.
2. Vá em **Authentication > URL Configuration**:
   - **Site URL**: `https://seu-dominio-no-easypanel.com`
   - **Additional Redirect URLs**: Adicione `https://seu-dominio-no-easypanel.com/**`

### 6. Publicar o Portal do Religioso em um subdomínio próprio

O portal pode usar um domínio adicional no mesmo serviço frontend, sem duplicar a aplicação:

1. No Easypanel, mantenha os domínios existentes e adicione `portascj.brm.org.br` ao serviço frontend.
2. Em **Build > Build Args**, configure `VITE_PORTAL_PUBLIC_URL` com `https://portascj.brm.org.br`. Como essa variável é incorporada pelo Vite durante a compilação, faça um novo build/deploy após configurá-la.
3. Em **Authentication > URL Configuration** do Supabase, adicione `https://portascj.brm.org.br/**` em **Additional Redirect URLs**. Mantenha o domínio atual como **Site URL**.
4. Após o deploy, teste `https://portascj.brm.org.br`: a raiz do subdomínio deve abrir o Portal do Religioso. Os caminhos antigos `/portal-religioso` e `/area-religioso` continuam disponíveis no domínio principal.

---

## 🛠️ Resolução de Problemas Comuns (Troubleshooting)

### 1. Tela branca ou erro "Supabase credentials are missing"
- **Causa:** As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não foram passadas como **Build Args** no momento em que o Vite executou `npm run build`.
- **Solução:** No Easypanel, vá na aba **Build** do serviço, adicione os dois parâmetros em **Build Args** e clique em **Redeploy**.

### 2. Erro 502 Bad Gateway no Easypanel
- **Causa:** A porta interna configurada no Easypanel está diferente da porta do container.
- **Solução:** Certifique-se de que a **Porta do Container** está definida como `80`.

### 3. Erro 404 ao atualizar a página em rotas internas (ex: `/inscricao`)
- **Causa:** Servidor web não redirecionando rotas SPA para o `index.html`.
- **Solução:** O arquivo `nginx.conf` do projeto já trata isso com `try_files $uri $uri/ /index.html;`. Verifique se o Dockerfile copiou o `nginx.conf` corretamente.

### 4. Memória insuficiente durante o build (OOM Killed)
- **Causa:** Se a sua VPS tiver pouca memória RAM (1GB ou 2GB), o `npm run build` do TypeScript pode consumir toda a memória.
- **Solução:** Crie um arquivo swap na sua VPS:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
