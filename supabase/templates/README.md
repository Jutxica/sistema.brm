# Supabase Auth email templates

## Signup confirmation

1. In Supabase, open **Authentication → Email Templates → Confirm signup**.
2. Paste the contents of [`confirm-signup.html`](./confirm-signup.html) into the template editor and save.
3. In **Authentication → URL Configuration**, set the production Site URL to `https://sistema.brm.org.br` and add `https://sistema.brm.org.br/portal-religioso` to the allowed redirect URLs.
4. In the EasyPanel frontend service, set the build environment variable `VITE_PORTAL_PUBLIC_URL=https://sistema.brm.org.br` and redeploy. This keeps signup and password-recovery links on the production portal even if a user starts from another origin.

For local development, leave `VITE_PORTAL_PUBLIC_URL` unset to return to the local site. The email template uses Supabase's `{{ .ConfirmationURL }}` so the confirmation token is handled by Supabase and then sent to the configured portal URL.

## Welcome message and portal instructions

[`welcome-portal.html`](./welcome-portal.html) contains a branded welcome message explaining the first steps in the portal. Its first instruction is to open **Cadastro BRM** after confirming the email and signing in; it then describes the personal profile and other portal features.

Supabase Auth does not send this welcome message automatically as part of its standard confirmation templates. Configure its delivery separately (for example, through a trusted server-side function or your email provider) after account confirmation. Do not send it from the browser with privileged credentials.

The official BRM form is available to accounts whose link to an official record has been validated. If a new user sees **Vínculo pendente**, they should contact the Provincial Secretariat at `secretaria@brm.org.br` for guidance.
