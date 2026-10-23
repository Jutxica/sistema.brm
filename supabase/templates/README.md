# Modelos de E-mail do Supabase Auth (Sistema BRM)

Este diretório contém os templates oficiais e as instruções de configuração de e-mail para a autenticação do sistema.

---

## 1. Configuração no Painel do Supabase

### A. URLs de Redirecionamento (URL Configuration)
No painel do Supabase, acesse **Authentication → URL Configuration**:
1. **Site URL:**
   - Defina como: `https://sistema.brm.org.br`
2. **Redirect URLs (URLs Permitidas):**
   Adicione as seguintes linhas:
   - `https://sistema.brm.org.br/**`
   - `https://sistema.brm.org.br/redefinir-senha`
   - `https://sistema.brm.org.br/portal-religioso`
   - `http://localhost:5173/**` *(para testes locais)*

### B. Provedor de E-mail (SMTP)
Para garantir que os e-mails cheguem e não caiam na caixa de spam (e para evitar o limite de 3-4 envios/hora do Supabase):
1. Acesse **Project Settings → Authentication → SMTP Settings**.
2. Ative **Enable Custom SMTP**.
3. Preencha com as credenciais do seu provedor transacional (**Resend**, **Brevo/Sendinblue**, **SendGrid**, **Amazon SES** ou o servidor de e-mail corporativo da Província `@brm.org.br`).
4. Em **Authentication → Providers → Email**, confirme que **"Enable email confirmations"** está ativo.

---

## 2. Modelos de E-mail (Email Templates)

No painel do Supabase, acesse **Authentication → Email Templates**:

### Template 1: Confirmação de Cadastro (Confirm signup)
1. Abra o template **Confirm signup**.
2. Cole o conteúdo de [`confirm-signup.html`](./confirm-signup.html) no editor e salve.

### Template 2: Redefinição de Senha (Reset password)
1. Abra o template **Reset password**.
2. Cole o conteúdo de [`reset-password.html`](./reset-password.html) no editor e salve.

---

## 3. Mensagem de Boas-Vindas
[`welcome-portal.html`](./welcome-portal.html) contém uma mensagem com as orientações iniciais para os novos religiosos do portal.
