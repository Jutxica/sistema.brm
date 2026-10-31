/**
 * Script de Provisionamento de Contas do Elenco de Religiosos - Província BRM
 * 
 * Regra Institucional:
 * - Login: E-mail institucional (ou pessoal cadastrado)
 * - Senha Inicial Padrão: brm@<data de nascimento no formato DDMMAAAA> (ex: brm@09111995)
 * - Flag no metadado: precisa_trocar_senha = true
 * - Vínculo canônico: preenchimento de religiosos.auth_user_id
 * 
 * Uso:
 *   node scripts/provisionar-contas-religiosos.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente de .env ou frontend/.env
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  console.error('Certifique-se de configurar a SERVICE_ROLE_KEY para operações administrativas de autenticação.');
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function formatarDataNascimentoParaSenha(dataNasc) {
  if (!dataNasc) return null;
  // Trata formato YYYY-MM-DD
  const partes = String(dataNasc).split('T')[0].split('-');
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia.padStart(2, '0')}${mes.padStart(2, '0')}${ano}`;
  }
  // Trata formato DD/MM/YYYY
  const partesBr = String(dataNasc).split('/');
  if (partesBr.length === 3) {
    const [dia, mes, ano] = partesBr;
    return `${dia.padStart(2, '0')}${mes.padStart(2, '0')}${ano}`;
  }
  return null;
}

async function main() {
  console.log('=================================================================');
  console.log('🏛️  PROVÍNCIA BRASILEIRA MERIDIONAL - PROVISIONAMENTO DO ELENCO');
  console.log(`Modo: ${isDryRun ? 'SIMULAÇÃO (--dry-run)' : 'EXECUÇÃO REAL'}`);
  console.log('=================================================================\n');

  // Buscar todos os religiosos
  const { data: religiosos, error: relError } = await supabase
    .from('religiosos')
    .select('id, nome_civil, nome_religioso, nome_elenco, grau, data_nascimento, email_institucional, email_pessoal, auth_user_id, status, situacao_elenco')
    .order('nome_civil', { ascending: true });

  if (relError) {
    console.error('❌ Erro ao consultar a base de religiosos:', relError.message);
    process.exit(1);
  }

  console.log(`Total de religiosos encontrados no banco: ${religiosos.length}`);

  let criados = 0;
  let vinculadosExistentes = 0;
  let jaVinculados = 0;
  let semEmail = 0;
  let semDataNasc = 0;
  let erros = 0;

  const relatorio = [];

  for (const rel of religiosos) {
    const nome = rel.nome_elenco || rel.nome_religioso || rel.nome_civil;

    if (rel.auth_user_id) {
      jaVinculados++;
      continue;
    }

    const email = (rel.email_institucional || rel.email_pessoal || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      semEmail++;
      relatorio.push({ nome, status: 'IGNORADO', motivo: 'Sem e-mail cadastrado' });
      continue;
    }

    const ddmmaaaa = formatarDataNascimentoParaSenha(rel.data_nascimento);
    if (!ddmmaaaa) {
      semDataNasc++;
      relatorio.push({ nome, email, status: 'IGNORADO', motivo: 'Sem data de nascimento válida' });
      continue;
    }

    const senhaInicial = `brm@${ddmmaaaa}`;

    if (isDryRun) {
      console.log(`[SIMULAÇÃO] ${rel.grau} ${nome} | E-mail: ${email} | Senha inicial: ${senhaInicial}`);
      criados++;
      continue;
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: senhaInicial,
        email_confirm: true,
        user_metadata: {
          nome,
          precisa_trocar_senha: true,
          primeiro_acesso: true,
          religioso_id: rel.id,
          grau: rel.grau,
        },
      });

      let userId = authData?.user?.id;

      if (authError) {
        if (authError.message.includes('already been registered') || authError.status === 422) {
          // Usuário já existe no Auth; vincular o auth_user_id existente
          const { data: usersList } = await supabase.auth.admin.listUsers();
          const existing = usersList?.users?.find(u => u.email?.toLowerCase() === email);
          if (existing) {
            userId = existing.id;
            // Atualizar senha para o padrão institucional e marcar precisa_trocar_senha
            await supabase.auth.admin.updateUserById(userId, {
              password: senhaInicial,
              user_metadata: {
                ...existing.user_metadata,
                precisa_trocar_senha: true,
              },
            });
            vinculadosExistentes++;
            console.log(`🔄 Conta já existia, atualizada e vinculada: ${nome} (${email})`);
          } else {
            throw authError;
          }
        } else {
          throw authError;
        }
      } else {
        criados++;
        console.log(`✅ Conta criada: ${rel.grau} ${nome} (${email}) | Senha: ${senhaInicial}`);
      }

      // 2. Vincular na tabela religiosos
      if (userId) {
        const { error: updateError } = await supabase
          .from('religiosos')
          .update({ auth_user_id: userId })
          .eq('id', rel.id);

        if (updateError) {
          console.error(`⚠️ Erro ao vincular auth_user_id na ficha de ${nome}:`, updateError.message);
        }
      }

      relatorio.push({
        id: rel.id,
        nome,
        grau: rel.grau,
        email,
        senha_inicial: senhaInicial,
        status: 'CRIADO_E_VINCULADO',
      });
    } catch (err) {
      erros++;
      console.error(`❌ Falha ao processar ${nome} (${email}):`, err.message);
      relatorio.push({ nome, email, status: 'ERRO', motivo: err.message });
    }
  }

  console.log('\n=================================================================');
  console.log('📊 RESUMO DO PROVISIONAMENTO:');
  console.log(`- Contas já vinculadas anteriormente: ${jaVinculados}`);
  console.log(`- Novas contas criadas: ${criados}`);
  console.log(`- Contas existentes atualizadas/vinculadas: ${vinculadosExistentes}`);
  console.log(`- Confrades sem e-mail (necessitam complemento): ${semEmail}`);
  console.log(`- Confrades sem data de nascimento: ${semDataNasc}`);
  console.log(`- Erros operacionais: ${erros}`);
  console.log('=================================================================\n');

  if (!isDryRun && relatorio.length > 0) {
    const csvHeader = 'Nome;Grau;Email;SenhaInicial;Status;Motivo\n';
    const csvRows = relatorio
      .map(r => `"${r.nome || ''}";"${r.grau || ''}";"${r.email || ''}";"${r.senha_inicial || ''}";"${r.status || ''}";"${r.motivo || ''}"`)
      .join('\n');
    const relatorioPath = path.resolve(process.cwd(), 'relatorio-provisionamento-contas.csv');
    fs.writeFileSync(relatorioPath, csvHeader + csvRows, 'utf8');
    console.log(`📄 Relatório para a Secretaria Provincial salvo em: ${relatorioPath}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
