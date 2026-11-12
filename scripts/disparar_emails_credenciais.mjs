/**
 * Script CLI: Disparo de E-mails com Credenciais de Primeiro Acesso
 * Província Brasileira Meridional - Portal do Religioso
 * 
 * Uso:
 *   node scripts/disparar_emails_credenciais.mjs --teste seu.email@dominio.com
 *   node scripts/disparar_emails_credenciais.mjs --dry-run
 *   node scripts/disparar_emails_credenciais.mjs --executar [--limit 5]
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = ['.env', 'frontend/.env', '../.env'];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length) {
          const val = rest.join('=').replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

console.log('=================================================================');
console.log('🏛️  PROVÍNCIA BRM - DISPARO DE CREDENCIAIS DE PRIMEIRO ACESSO');
console.log('=================================================================\n');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const args = process.argv.slice(2);
  const testeIdx = args.indexOf('--teste');
  const isDryRun = args.includes('--dry-run');
  const isExecutar = args.includes('--executar');

  if (testeIdx !== -1 && args[testeIdx + 1]) {
    const emailTeste = args[testeIdx + 1].trim();
    console.log(`🧪 Modo Teste Ativado para o e-mail: ${emailTeste}`);
    
    const { data, error } = await supabase.functions.invoke('disparar-credenciais-religioso', {
      body: {
        modo: 'teste',
        destinatarios: [emailTeste],
        nome_teste: 'Pe. João da Silva, SCJ',
        senha_teste: 'brm@15081978',
        operador_nome: 'CLI / Homologação',
      },
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      process.exit(1);
    }

    console.log('✅ Resultado do Envio de Teste:', JSON.stringify(data, null, 2));
    return;
  }

  if (isDryRun) {
    console.log('🔍 MODO SIMULAÇÃO (--dry-run):');
    const { data: religiosos, error } = await supabase
      .from('religiosos')
      .select('id, grau, nome_civil, nome_religioso, nome_elenco, email_institucional, email_pessoal, data_nascimento, credenciais_enviadas_em')
      .order('nome_civil');

    if (error) {
      console.error('Erro ao consultar religiosos:', error.message);
      process.exit(1);
    }

    let aptos = 0;
    let semEmail = 0;
    let jaEnviados = 0;

    for (const r of religiosos) {
      const email = (r.email_institucional || r.email_pessoal || '').trim();
      const nome = r.nome_elenco || r.nome_religioso || r.nome_civil;
      if (!email || !email.includes('@')) {
        semEmail++;
        console.log(`⚠️  [SEM E-MAIL] ${r.grau} ${nome}`);
      } else {
        aptos++;
        if (r.credenciais_enviadas_em) {
          jaEnviados++;
          console.log(`ℹ️  [JÁ ENVIADO em ${r.credenciais_enviadas_em.split('T')[0]}] ${r.grau} ${nome} <${email}>`);
        } else {
          console.log(`✅  [PRONTO PARA ENVIO] ${r.grau} ${nome} <${email}>`);
        }
      }
    }

    console.log('\n📊 Resumo da Base:');
    console.log(`- Total de confrades: ${religiosos.length}`);
    console.log(`- Aptos para disparo: ${aptos}`);
    console.log(`- Já notificados: ${jaEnviados}`);
    console.log(`- Pendentes de e-mail: ${semEmail}`);
    return;
  }

  if (!isExecutar) {
    console.log('Nenhum comando fornecido. Opções disponíveis:');
    console.log('  --teste <email>    Dispara e-mail de teste para o endereço informado');
    console.log('  --dry-run          Simula a verificação da base sem disparar e-mails');
    console.log('  --executar         Dispara para os confrades selecionados');
  }
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
