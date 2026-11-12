import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Send, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, 
  Users, Search, ExternalLink, Square, Filter, FileText, Check, ChevronDown, 
  History, Sparkles, ShieldCheck, Eye, Layers, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast, confirmAction } from '../hooks/useFeedback';
import { atribuirNomeReligioso } from '../lib/religiosoNome';
import type { Religioso } from '../types/religioso';

export type TipoMensagem = 'credenciais' | 'comunicado' | 'circular' | 'convocacao';
export type ViewModo = 'elenco' | 'redigir' | 'teste' | 'historico';

interface ItemLog {
  id: string;
  nome: string;
  email: string;
  status: 'pendente' | 'enviando' | 'sucesso' | 'erro';
  mensagem?: string;
  resendId?: string;
}

interface RegistroHistorico {
  id: string;
  criado_em: string;
  operador_nome: string;
  tipo_mensagem: string;
  assunto: string;
  subtitulo_cabecalho?: string;
  total_destinatarios: number;
  total_sucessos: number;
  total_falhas: number;
  relatorio_envio?: any[];
}

function gerarHtmlCredenciaisPreview(
  nomeTratamento?: string,
  emailLogin?: string,
  senhaProvisoria?: string
): string {
  const nome = nomeTratamento || 'Pe. João da Silva, SCJ';
  const email = emailLogin || 'joao.silva@brm.org.br';
  const senha = senhaProvisoria || 'brm@15081978';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso ao Portal do Religioso - Província BRM</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #17333d;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #226380;
      text-decoration: underline;
    }
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
      .cred-table td {
        display: block !important;
        width: 100% !important;
        padding: 4px 0 !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f3f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #17333d;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 620px; background-color: #ffffff; border: 1px solid #dce5e8; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(17, 50, 64, 0.05);">
          
          <!-- Cabeçalho Timbrado com Identidade Visual BRM -->
          <tr>
            <td style="background-color: #113240; padding: 36px 28px 24px; text-align: center; border-bottom: 3px solid #226380;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <img src="https://sistema.brm.org.br/brasao-colorido-dehoniano.png" alt="Brasão Dehoniano - Província BRM" width="125" style="display: block; width: 125px; max-width: 100%; height: auto; margin: 0 auto 16px; border: 0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: #8bb6c6;">
                      Província Brasileira Meridional · SCJ
                    </div>
                    <div style="margin-top: 6px; font-size: 23px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                      Portal do Religioso
                    </div>
                    <div style="margin-top: 4px; font-size: 13px; color: #c0d6df;">
                      Credenciais de Primeiro Acesso
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td class="content-padding" style="padding: 36px 36px 28px;">
              
              <!-- Saudação Oficial Dehoniana -->
              <p style="margin: 0 0 14px; font-size: 16px; font-weight: 700; color: #113240;">
                Prezado ${nome},
              </p>
              
              <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; font-weight: 600; font-style: italic; color: #226380; letter-spacing: 0.2px;">
                Vivat Cor Iesu, Per Cor Mariae
              </p>
              
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #374f59;">
                A Secretaria Provincial disponibiliza o seu acesso ao <strong>Portal do Religioso</strong> da Província Brasileira Meridional. Este ambiente digital reúne a sua Ficha Cadastral Oficial, histórico formativo, designações, agenda e comunicados da Província.
              </p>

              <!-- Card de Credenciais -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafb; border: 1px solid #d5e2e6; border-left: 4px solid #226380; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #226380; margin-bottom: 12px;">
                      Credenciais de Acesso
                    </div>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="cred-table" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #627b85; font-weight: 500; width: 36%;">
                          Endereço do Portal:
                        </td>
                        <td style="padding: 6px 0; color: #113240; font-weight: 600;">
                          <a href="https://portal.brm.org.br" style="color: #226380; text-decoration: none; word-break: break-all;">https://portal.brm.org.br</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #627b85; font-weight: 500;">
                          E-mail de Login:
                        </td>
                        <td style="padding: 6px 0; color: #113240; font-weight: 600;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; word-break: break-all;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0 6px; color: #627b85; font-weight: 500;">
                          Senha Provisória:
                        </td>
                        <td style="padding: 8px 0 6px;">
                          <span style="display: inline-block; background-color: #e6eef1; border: 1px solid #cad8dc; border-radius: 4px; padding: 4px 10px; font-family: 'SF Mono', Menlo, Consolas, Monaco, monospace; font-size: 14px; font-weight: 700; color: #113240; letter-spacing: 0.6px;">${senha}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Nota de Primeiro Acesso -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; line-height: 1.6; color: #526b75; border-left: 3px solid #cad8dc; padding-left: 12px;">
                    <strong>Observação:</strong> no primeiro acesso com a senha provisória, o sistema solicitará o cadastro de uma nova senha pessoal definitiva. A senha provisória deixa de valer logo após essa atualização.
                  </td>
                </tr>
              </table>

              <!-- Passo a Passo -->
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #113240; margin-bottom: 14px;">
                Como realizar o primeiro acesso:
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #113240; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">1</div>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #374f59;">
                    Acesse o endereço do Portal pelo botão abaixo.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #113240; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">2</div>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #374f59;">
                    Informe seu e-mail e a <strong>senha provisória</strong> indicada acima.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="padding-bottom: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #113240; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">3</div>
                  </td>
                  <td style="padding-bottom: 10px; font-size: 14px; line-height: 1.6; color: #374f59;">
                    Cadastre a sua <strong>nova senha pessoal</strong> na tela de primeiro acesso.
                  </td>
                </tr>
                <tr>
                  <td width="30" valign="top">
                    <div style="width: 22px; height: 22px; background-color: #226380; color: #ffffff; border-radius: 50%; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;">4</div>
                  </td>
                  <td style="font-size: 14px; line-height: 1.6; color: #374f59;">
                    Concluída a alteração, o acesso ao Portal estará liberado para que você realize seu cadastro, anexe documentos e consulte a agenda provincial.
                  </td>
                </tr>
              </table>

              <!-- Botão CTA Centralizado -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://portal.brm.org.br" class="btn-cta" style="background-color: #113240; color: #ffffff; display: inline-block; padding: 13px 30px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.2px; text-align: center;">
                      Acessar o Portal do Religioso &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Bloco de Apoio da Secretaria -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafb; border: 1px solid #e1ebed; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; line-height: 1.6; color: #4e656d; text-align: center;">
                    Em caso de dúvidas ou necessidade de auxílio no primeiro acesso, entre em contato com a Secretaria Provincial pelo e-mail <a href="mailto:secretaria@brm.org.br" style="color: #226380; font-weight: 600; text-decoration: none;">secretaria@brm.org.br</a>.
                  </td>
                </tr>
              </table>

              <!-- Fechamento Oficial Dehoniano -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center" style="font-size: 14px; font-style: italic; font-weight: 600; color: #48626e;">
                    In corde Iesu.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Rodapé Institucional -->
          <tr>
            <td style="background-color: #edf2f4; border-top: 1px solid #dce5e8; padding: 22px 28px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #113240;">
                Província Brasileira Meridional · Congregação dos Sacerdotes do Sagrado Coração de Jesus
              </p>
              <p style="margin: 0 0 10px; font-size: 11px; line-height: 1.6; color: #627b85;">
                Cúria Provincial · Rua Padre Gabriel Lux, 900 – Caixa Postal 21 · Corupá - SC · CEP 89278-000<br>
                Secretaria Provincial · <a href="mailto:secretaria@brm.org.br" style="color: #226380; text-decoration: none;">secretaria@brm.org.br</a>
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #78909c;">
                <em>Aviso: este e-mail contém credenciais temporárias de uso individual e intransferível. Por favor, não compartilhe esta mensagem.</em>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

export const DispararCredenciaisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('religioso');

  const [religiosos, setReligiosos] = useState<Religioso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModo, setViewModo] = useState<ViewModo>('elenco');

  // =========================================================================
  // MODELO E CONTEÚDO DA MENSAGEM
  // =========================================================================
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>('credenciais');
  const [assunto, setAssunto] = useState('');
  const [tituloCabecalho, setTituloCabecalho] = useState('Secretaria Provincial');
  const [subtituloCabecalho, setSubtituloCabecalho] = useState('Credenciais de Primeiro Acesso');
  const [corpoTexto, setCorpoTexto] = useState('');
  const [blocoDestaque, setBlocoDestaque] = useState('');
  const [botaoTexto, setBotaoTexto] = useState('');
  const [botaoUrl, setBotaoUrl] = useState('');
  const [assinaturaTexto, setAssinaturaTexto] = useState('Secretaria Provincial');

  // Alternar modelo preenchendo presets institucionais dehonianos
  const aplicarPresetModelo = (tipo: TipoMensagem) => {
    setTipoMensagem(tipo);
    if (tipo === 'credenciais') {
      setAssunto('Portal do Religioso: Suas credenciais de primeiro acesso');
      setTituloCabecalho('Portal do Religioso');
      setSubtituloCabecalho('Credenciais de Primeiro Acesso');
      setCorpoTexto('');
      setBlocoDestaque('');
      setBotaoTexto('Acessar Portal do Religioso');
      setBotaoUrl('https://portal.brm.org.br');
      setAssinaturaTexto('Secretaria Provincial');
    } else if (tipo === 'comunicado') {
      setAssunto('Comunicado Oficial da Secretaria Provincial');
      setTituloCabecalho('Secretaria Provincial');
      setSubtituloCabecalho('Comunicado Oficial');
      setCorpoTexto(
        'A Secretaria Provincial transmite a todos os confrades as seguintes orientações canônicas e administrativas para conhecimento e devido cumprimento.\n\nPedimos que leiam com atenção as determinações e realizem os devidos encaminhamentos no prazo estipulado.'
      );
      setBlocoDestaque('Aviso da Cúria:\nFavor acusar recebimento desta comunicação e regularizar as pendências cadastrais solicitadas até o dia 30 do corrente mês.');
      setBotaoTexto('Acessar Documentos no Portal');
      setBotaoUrl('https://portal.brm.org.br');
      setAssinaturaTexto('Secretaria Provincial');
    } else if (tipo === 'circular') {
      setAssunto('Carta Circular nº 01/2026 - Governo Provincial');
      setTituloCabecalho('Governo Provincial');
      setSubtituloCabecalho('Carta Circular nº 01/2026');
      setCorpoTexto(
        'Vivat Cor Iesu, Per Cor Mariae\n\nCaríssimos confrades,\n\nDirijo-me a toda a Província Brasileira Meridional para comunicar as recentes deliberações e nomeações canônicas homologadas pelo Superior Provincial e seu Conselho.\n\nRenovamos nossa fraterna comunhão de orações e zelo pela missão em todas as nossas obras e comunidades.'
      );
      setBlocoDestaque('Atos do Governo Provincial:\nAs nomeações entram em vigor canônico a partir da data de publicação desta circular provincial.');
      setBotaoTexto('Consultar Atos no Sistema');
      setBotaoUrl('https://sistema.brm.org.br/secretaria/governo-provincial');
      setAssinaturaTexto('Pe. Superior Provincial e Conselho');
    } else if (tipo === 'convocacao') {
      setAssunto('Convocação Oficial: Retiro Provincial 2026');
      setTituloCabecalho('Secretaria Provincial');
      setSubtituloCabecalho('Convocação Oficial');
      setCorpoTexto(
        'Por determinação do Superior Provincial, convocamos todos os confrades da Província Brasileira Meridional para participarem do Retiro Provincial anual.\n\nPedimos que confirmem sua participação e hospedagem com antecedência através do Portal do Religioso.'
      );
      setBlocoDestaque('Informações do Encontro:\nData: 15 a 19 de Outubro de 2026\nLocal: Convento SCJ - Corupá / SC\nTema: "Sint Unum no Coração de Jesus"');
      setBotaoTexto('Confirmar Participação no Portal');
      setBotaoUrl('https://portal.brm.org.br');
      setAssinaturaTexto('Secretaria Provincial');
    }
  };

  // Inicializar presets no primeiro carregamento
  useEffect(() => {
    aplicarPresetModelo('credenciais');
  }, []);

  // =========================================================================
  // DESTINATÁRIOS E FILTROS DO ELENCO
  // =========================================================================
  const [busca, setBusca] = useState('');
  const [filtroGrau, setFiltroGrau] = useState<string>('todos');
  const [filtroComunidade, setFiltroComunidade] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'enviados'>('todos');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Execução do lote
  const [disparandoLote, setDisparandoLote] = useState(false);
  const [progressoLote, setProgressoLote] = useState({
    total: 0,
    atual: 0,
    sucessos: 0,
    falhas: 0,
    atualNome: '',
  });
  const [logsLote, setLogsLote] = useState<ItemLog[]>([]);
  const abortBatchRef = useRef(false);

  // Estados do Envio de Teste
  const [emailTeste1, setEmailTeste1] = useState('');
  const [emailTeste2, setEmailTeste2] = useState('');
  const [nomeTeste, setNomeTeste] = useState('Pe. João da Silva, SCJ');
  const [senhaTeste, setSenhaTeste] = useState('brm@15081978');
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    executado: boolean;
    itens: { email: string; ok: boolean; id?: string; error?: string }[];
  } | null>(null);
  const [erroPublicacaoEdgeFunction, setErroPublicacaoEdgeFunction] = useState<boolean>(false);

  // Histórico de disparos
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [historicoItemAberto, setHistoricoItemAberto] = useState<string | null>(null);

  // Carregar lista de religiosos da base
  const carregarReligiosos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('religiosos')
        .select('id,nome_civil,nome_religioso,nome_elenco,grau,status,situacao_elenco,comunidade_atual_nome,email_institucional,email_pessoal,data_nascimento,credenciais_enviadas_em,credenciais_enviadas_por')
        .order('nome_elenco')
        .order('nome_civil');

      if (error) throw error;
      const lista = (data || []) as Religioso[];
      setReligiosos(lista);

      if (preselectedId) {
        setSelecionados(new Set([preselectedId]));
        setFiltroStatus('todos');
      }
    } catch (err: any) {
      console.error('Erro ao carregar religiosos:', err);
      showToast.error(`Não foi possível carregar os religiosos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [preselectedId]);

  // Carregar histórico de disparos
  const carregarHistorico = useCallback(async () => {
    try {
      setCarregandoHistorico(true);
      const { data, error } = await supabase
        .from('comunicados_disparos')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(40);

      if (error) {
        // Se a tabela ainda não existir no banco do usuário, trata graciosamente
        console.warn('Aviso ao carregar histórico (tabela comunicados_disparos pode estar pendente de migração):', error.message);
        setHistorico([]);
      } else {
        setHistorico((data || []) as RegistroHistorico[]);
      }
    } catch (err) {
      console.warn('Erro ao consultar histórico:', err);
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);

  useEffect(() => {
    void carregarReligiosos();
  }, [carregarReligiosos]);

  useEffect(() => {
    if (viewModo === 'historico') {
      void carregarHistorico();
    }
  }, [viewModo, carregarHistorico]);

  // Lista única de comunidades para filtro
  const listaComunidades = useMemo(() => {
    const setCom = new Set<string>();
    for (const r of religiosos) {
      if (r.comunidade_atual_nome && r.comunidade_atual_nome.trim()) {
        setCom.add(r.comunidade_atual_nome.trim());
      }
    }
    return Array.from(setCom).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [religiosos]);

  // Estatísticas da base
  const stats = useMemo(() => {
    let total = religiosos.length;
    let aptos = 0;
    let semEmail = 0;
    let jaEnviados = 0;

    for (const r of religiosos) {
      const email = (r.email_institucional || r.email_pessoal || '').trim();
      if (!email || !email.includes('@')) {
        semEmail++;
      } else {
        aptos++;
      }
      if (r.credenciais_enviadas_em) {
        jaEnviados++;
      }
    }

    return { total, aptos, semEmail, jaEnviados };
  }, [religiosos]);

  // Filtro de religiosos na tabela
  const religiososFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return religiosos.filter(r => {
      const email = (r.email_institucional || r.email_pessoal || '').trim().toLowerCase();
      const nome = (r.nome_elenco || r.nome_religioso || r.nome_civil || '').toLowerCase();
      const comunidade = (r.comunidade_atual_nome || '').toLowerCase();

      // Filtro de status
      if (filtroStatus === 'pendentes' && r.credenciais_enviadas_em) return false;
      if (filtroStatus === 'enviados' && !r.credenciais_enviadas_em) return false;

      // Filtro de grau
      if (filtroGrau !== 'todos') {
        const g = (r.grau || '').toLowerCase();
        if (filtroGrau === 'padres' && !g.includes('padre') && !g.includes('presbítero')) return false;
        if (filtroGrau === 'fratres' && !g.includes('frater') && !g.includes('fráter')) return false;
        if (filtroGrau === 'irmaos' && !g.includes('irmão') && !g.includes('irmao')) return false;
        if (filtroGrau === 'bispos' && !g.includes('bispo')) return false;
      }

      // Filtro de comunidade
      if (filtroComunidade !== 'todas') {
        if ((r.comunidade_atual_nome || '').trim() !== filtroComunidade) return false;
      }

      // Busca textual
      if (!q) return true;
      return nome.includes(q) || email.includes(q) || comunidade.includes(q);
    });
  }, [religiosos, busca, filtroStatus, filtroGrau, filtroComunidade]);

  // Ações de Seleção
  const handleToggleSelect = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelecionarTodos = () => {
    setSelecionados(new Set(religiososFiltrados.map(r => r.id)));
  };

  const handleLimparSelecao = () => {
    setSelecionados(new Set());
  };

  // Disparo de Teste (Homologação)
  const handleEnviarTeste = async (e: React.FormEvent) => {
    e.preventDefault();
    const destinatarios = [emailTeste1.trim(), emailTeste2.trim()].filter(em => em && em.includes('@'));

    if (!destinatarios.length) {
      showToast.error('Informe ao menos um e-mail válido para o teste.');
      return;
    }

    setEnviandoTeste(true);
    setResultadoTeste(null);
    setErroPublicacaoEdgeFunction(false);

    try {
      const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
        body: {
          modo: 'teste',
          destinatarios,
          tipo_mensagem: tipoMensagem,
          assunto: assunto.trim() || undefined,
          titulo_cabecalho: tituloCabecalho.trim() || undefined,
          subtitulo_cabecalho: subtituloCabecalho.trim() || undefined,
          corpo_texto: corpoTexto.trim() || undefined,
          bloco_destaque: blocoDestaque.trim() || undefined,
          botao_texto: botaoTexto.trim() || undefined,
          botao_url: botaoUrl.trim() || undefined,
          assinatura_texto: assinaturaTexto.trim() || undefined,
          nome_teste: nomeTeste.trim() || 'Pe. João da Silva, SCJ',
          senha_teste: senhaTeste.trim() || 'brm@15081978',
          operador_nome: 'Secretaria Provincial',
        },
      });

      if (res.error) throw res.error;

      const data = res.data;
      if (data && data.resultados) {
        setResultadoTeste({
          executado: true,
          itens: data.resultados,
        });

        const erros = data.resultados.filter((it: any) => !it.ok);
        if (erros.length === 0) {
          showToast.success(`E-mail de teste enviado com sucesso para ${destinatarios.length} destinatário(s)!`);
        } else {
          showToast.warning('O teste foi disparado, mas houve aviso em um dos endereços.');
        }
      }
    } catch (err: any) {
      console.error('Falha no envio de teste:', err);
      const msg = err?.message || String(err || '');
      const isNotFound = msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError') || msg.includes('NOT_FOUND') || msg.includes('404');
      if (isNotFound) {
        setErroPublicacaoEdgeFunction(true);
        showToast.error('A Edge Function "disparar-credenciais-religioso" ainda não foi publicada no projeto Supabase.');
      } else {
        showToast.error(`Erro ao disparar teste: ${msg || 'Falha na Edge Function'}`);
      }
    } finally {
      setEnviandoTeste(false);
    }
  };

  // Iniciar Disparo em Lote
  const handleIniciarDisparoLote = async () => {
    if (selecionados.size === 0) {
      showToast.error('Selecione ao menos um confrade para o disparo.');
      return;
    }

    const rotuloTipo = 
      tipoMensagem === 'credenciais' ? 'Credenciais de Primeiro Acesso' :
      tipoMensagem === 'circular' ? 'Carta Circular Provincial' :
      tipoMensagem === 'convocacao' ? 'Convocação Oficial' : 'Comunicado da Secretaria';

    const confirmou = await confirmAction({
      title: `Disparo de ${rotuloTipo}`,
      badge: 'Secretaria Provincial · Envio em Lote',
      message: `Deseja realmente disparar os e-mails para ${selecionados.size} confrade(s) selecionado(s)?`,
      detail: `Assunto: "${assunto || rotuloTipo}". Os e-mails serão enviados via Resend a partir de secretaria@brm.org.br.`,
      confirmLabel: 'Iniciar Disparo',
      cancelLabel: 'Cancelar',
    });

    if (!confirmou) return;

    setDisparandoLote(true);
    abortBatchRef.current = false;

    const listaParaEnviar = religiosos.filter(r => selecionados.has(r.id));
    setProgressoLote({
      total: listaParaEnviar.length,
      atual: 0,
      sucessos: 0,
      falhas: 0,
      atualNome: '',
    });

    const logsIniciais: ItemLog[] = listaParaEnviar.map(r => ({
      id: r.id,
      nome: atribuirNomeReligioso(r.grau, r.nome_elenco || r.nome_religioso || r.nome_civil),
      email: (r.email_institucional || r.email_pessoal || '').trim(),
      status: 'pendente',
    }));
    setLogsLote(logsIniciais);

    let sucessosCount = 0;
    let falhasCount = 0;

    for (let i = 0; i < listaParaEnviar.length; i++) {
      if (abortBatchRef.current) {
        showToast.warning('O disparo em lote foi interrompido.');
        break;
      }

      const rel = listaParaEnviar[i];
      const nomeTratamento = atribuirNomeReligioso(rel.grau, rel.nome_elenco || rel.nome_religioso || rel.nome_civil);
      const email = (rel.email_institucional || rel.email_pessoal || '').trim();

      setProgressoLote(prev => ({
        ...prev,
        atual: i + 1,
        atualNome: nomeTratamento,
      }));

      setLogsLote(prev => prev.map(item => 
        item.id === rel.id ? { ...item, status: 'enviando' } : item
      ));

      if (!email || !email.includes('@')) {
        falhasCount++;
        setLogsLote(prev => prev.map(item => 
          item.id === rel.id ? { ...item, status: 'erro', mensagem: 'Sem e-mail cadastrado' } : item
        ));
        setProgressoLote(prev => ({ ...prev, falhas: falhasCount }));
        continue;
      }

      try {
        const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
          body: {
            modo: 'individual',
            religioso_id: rel.id,
            tipo_mensagem: tipoMensagem,
            assunto: assunto.trim() || undefined,
            titulo_cabecalho: tituloCabecalho.trim() || undefined,
            subtitulo_cabecalho: subtituloCabecalho.trim() || undefined,
            corpo_texto: corpoTexto.trim() || undefined,
            bloco_destaque: blocoDestaque.trim() || undefined,
            botao_texto: botaoTexto.trim() || undefined,
            botao_url: botaoUrl.trim() || undefined,
            assinatura_texto: assinaturaTexto.trim() || undefined,
            operador_nome: 'Secretaria Provincial',
          },
        });

        if (res.error) throw res.error;

        const data = res.data;
        if (data && data.enviados > 0) {
          sucessosCount++;
          const envioInfo = data.relatorio?.[0];
          setLogsLote(prev => prev.map(item => 
            item.id === rel.id ? { 
              ...item, 
              status: 'sucesso', 
              resendId: envioInfo?.resendId || 'OK',
              mensagem: 'Enviado com sucesso' 
            } : item
          ));
        } else {
          falhasCount++;
          const erroInfo = data.relatorio?.[0];
          setLogsLote(prev => prev.map(item => 
            item.id === rel.id ? { 
              ...item, 
              status: 'erro', 
              mensagem: erroInfo?.motivo || 'Falha no envio via Resend' 
            } : item
          ));
        }
      } catch (err: any) {
        falhasCount++;
        const msg = err?.message || String(err || '');
        const isNotFound = msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError') || msg.includes('NOT_FOUND') || msg.includes('404');

        setLogsLote(prev => prev.map(item => 
          item.id === rel.id ? { 
            ...item, 
            status: 'erro', 
            mensagem: isNotFound ? 'Edge Function não publicada no Supabase' : (err.message || 'Erro de conexão')
          } : item
        ));

        if (isNotFound) {
          setErroPublicacaoEdgeFunction(true);
          showToast.error('Disparo interrompido: a Edge Function "disparar-credenciais-religioso" não está implantada no Supabase.');
          break;
        }
      }

      setProgressoLote(prev => ({
        ...prev,
        sucessos: sucessosCount,
        falhas: falhasCount,
      }));

      await new Promise(r => setTimeout(r, 700));
    }

    setDisparandoLote(false);
    showToast.success(`Disparo finalizado: ${sucessosCount} enviado(s) com sucesso, ${falhasCount} falha(s).`);
    void carregarReligiosos();
    void carregarHistorico();
  };

  const handleCancelarDisparo = () => {
    abortBatchRef.current = true;
  };

  // Disparo individual avulso
  const handleDispararIndividual = async (rel: Religioso) => {
    const nomeTratamento = atribuirNomeReligioso(rel.grau, rel.nome_elenco || rel.nome_religioso || rel.nome_civil);
    const email = (rel.email_institucional || rel.email_pessoal || '').trim();

    if (!email || !email.includes('@')) {
      showToast.error(`O confrade ${nomeTratamento} não possui e-mail cadastrado.`);
      return;
    }

    const rotuloTipo = 
      tipoMensagem === 'credenciais' ? 'Credenciais de Acesso' :
      tipoMensagem === 'circular' ? 'Carta Circular' :
      tipoMensagem === 'convocacao' ? 'Convocação' : 'Comunicado';

    const confirmou = await confirmAction({
      title: `Envio Individual: ${rotuloTipo}`,
      badge: 'Secretaria Provincial · Envio Avulso',
      message: `Deseja enviar para ${nomeTratamento}?`,
      detail: `E-mail de destino: ${email}. Assunto: "${assunto || rotuloTipo}".`,
      confirmLabel: 'Enviar E-mail',
      cancelLabel: 'Cancelar',
    });

    if (!confirmou) return;

    try {
      showToast.info(`Enviando para ${email}...`);
      const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
        body: {
          modo: 'individual',
          religioso_id: rel.id,
          tipo_mensagem: tipoMensagem,
          assunto: assunto.trim() || undefined,
          titulo_cabecalho: tituloCabecalho.trim() || undefined,
          subtitulo_cabecalho: subtituloCabecalho.trim() || undefined,
          corpo_texto: corpoTexto.trim() || undefined,
          bloco_destaque: blocoDestaque.trim() || undefined,
          botao_texto: botaoTexto.trim() || undefined,
          botao_url: botaoUrl.trim() || undefined,
          assinatura_texto: assinaturaTexto.trim() || undefined,
          operador_nome: 'Secretaria Provincial',
        },
      });

      if (res.error) throw res.error;

      showToast.success(`E-mail enviado com sucesso para ${nomeTratamento}!`);
      void carregarReligiosos();
      void carregarHistorico();
    } catch (err: any) {
      console.error('Falha no envio avulso:', err);
      showToast.error(`Erro ao enviar: ${err.message || 'Falha na Edge Function'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 font-sans text-slate-800 dark:text-slate-100">
      
      {/* ===================================================================== */}
      {/* CABEÇALHO DA PÁGINA (DESIGN INSTITUCIONAL DEHONIANO) */}
      {/* ===================================================================== */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => navigate('/secretaria/elenco')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Elenco</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.18em] text-[#226380] dark:text-[#A3C3C7]">
              Secretaria Provincial · Comunicação Oficial
            </span>
          </div>

          <h1 className="font-cinzel text-2xl font-bold tracking-tight text-[#113240] dark:text-white sm:text-3xl pt-1">
            Comunicados & Disparo de E-mails
          </h1>
          <p className="max-w-3xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            Central de envio e homologação de comunicados oficiais, cartas circulares e credenciais do Portal para os confrades da Província Brasileira Meridional.
          </p>
        </div>

        {/* Botão de Atualizar Base */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => { void carregarReligiosos(); void carregarHistorico(); }}
            disabled={loading || disparandoLote}
            className="inline-flex items-center gap-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Barra de Indicadores Oficiais */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total do Elenco</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aptos (com e-mail)</p>
          <p className="mt-1 text-2xl font-bold text-[#113240] dark:text-[#A3C3C7] tabular-nums">{stats.aptos}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Selecionados</p>
          <p className="mt-1 text-2xl font-bold text-[#226380] dark:text-[#7bb5cc] tabular-nums">{selecionados.size}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sem E-mail</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{stats.semEmail}</p>
        </div>
      </section>

      {/* Navegação de Abas da Página */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setViewModo('elenco')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'elenco'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Destinatários do Elenco ({selecionados.size}/{religiosos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewModo('redigir')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'redigir'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Redigir Comunicado & Modelo</span>
        </button>

        <button
          type="button"
          onClick={() => setViewModo('teste')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'teste'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>3. Prévia & Teste de Homologação</span>
        </button>

        <button
          type="button"
          onClick={() => setViewModo('historico')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'historico'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>4. Histórico de Envios</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: DESTINATÁRIOS DO ELENCO */}
      {/* ===================================================================== */}
      {viewModo === 'elenco' && (
        <div className="space-y-4">
          
          {/* Painel de Progresso do Lote (quando ativo) */}
          {disparandoLote && (
            <div className="rounded-lg border border-[#226380]/40 bg-[#f0f6f9] dark:bg-[#11242d] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#113240] dark:text-[#A3C3C7]">
                  Disparando {progressoLote.atual} de {progressoLote.total} — {progressoLote.atualNome}
                </span>
                <button
                  type="button"
                  onClick={handleCancelarDisparo}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 cursor-pointer transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Interromper Disparo</span>
                </button>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#113240] dark:bg-[#226380] h-full transition-all duration-300"
                  style={{ width: `${(progressoLote.atual / (progressoLote.total || 1)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Sucessos: <strong className="text-emerald-700 dark:text-emerald-400">{progressoLote.sucessos}</strong></span>
                <span>Falhas: <strong className="text-rose-700 dark:text-rose-400">{progressoLote.falhas}</strong></span>
                <span>Restantes: <strong>{progressoLote.total - progressoLote.atual}</strong></span>
              </div>
            </div>
          )}

          {/* Barra de Filtros e Seleção */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nome do confrade, e-mail ou comunidade..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#226380]"
                />
              </div>
            </div>

            {/* Dropdown de Filtros por Grau e Comunidade */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={filtroGrau}
                onChange={e => setFiltroGrau(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#226380]"
              >
                <option value="todos">Todos os Graus</option>
                <option value="padres">Padres / Presbíteros</option>
                <option value="fratres">Fratres</option>
                <option value="irmaos">Irmãos</option>
                <option value="bispos">Bispos</option>
              </select>

              <select
                value={filtroComunidade}
                onChange={e => setFiltroComunidade(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#226380] max-w-[200px] truncate"
              >
                <option value="todas">Todas as Comunidades</option>
                {listaComunidades.map(com => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <button
                type="button"
                onClick={handleSelecionarTodos}
                className="text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer"
              >
                Selecionar Exibidos ({religiososFiltrados.length})
              </button>

              <button
                type="button"
                onClick={handleLimparSelecao}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Tabela do Elenco Provincial */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#10171B] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={religiososFiltrados.length > 0 && religiososFiltrados.every(r => selecionados.has(r.id))}
                        onChange={e => e.target.checked ? handleSelecionarTodos() : handleLimparSelecao()}
                        className="rounded border-slate-300 text-[#113240] focus:ring-[#226380]"
                      />
                    </th>
                    <th className="p-3">Confrade (Nome Canônico / Elenco)</th>
                    <th className="p-3">Grau</th>
                    <th className="p-3">Comunidade Atual</th>
                    <th className="p-3">E-mail Cadastrado</th>
                    <th className="p-3 text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {religiososFiltrados.map(rel => {
                    const isSelected = selecionados.has(rel.id);
                    const nomeTratamento = atribuirNomeReligioso(rel.grau, rel.nome_elenco || rel.nome_religioso || rel.nome_civil);
                    const email = (rel.email_institucional || rel.email_pessoal || '').trim();
                    const semEmail = !email || !email.includes('@');

                    return (
                      <tr 
                        key={rel.id} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-sky-50/40 dark:bg-[#14232c]' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disparandoLote}
                            onChange={() => handleToggleSelect(rel.id)}
                            className="rounded border-slate-300 text-[#113240] focus:ring-[#226380]"
                          />
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{nomeTratamento}</span>
                            {rel.credenciais_enviadas_em && (
                              <span 
                                title={`Credenciais enviadas em ${new Date(rel.credenciais_enviadas_em).toLocaleDateString('pt-BR')}`}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono"
                              >
                                <Check className="w-3 h-3" />
                                <span>Notificado</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{rel.grau || '—'}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{rel.comunidade_atual_nome || '—'}</td>
                        <td className="p-3">
                          {semEmail ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                              Sem e-mail cadastrado
                            </span>
                          ) : (
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] select-all">
                              {email}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            disabled={semEmail || disparandoLote}
                            onClick={() => void handleDispararIndividual(rel)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#226380]" />
                            <span>Enviar Agora</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {religiososFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum confrade corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Barra de Ação Inferior */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#10171B]">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white font-semibold">{selecionados.size}</strong> confrade(s) selecionado(s) para o disparo.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewModo('redigir')}
                  className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Configurar Mensagem
                </button>

                <button
                  type="button"
                  disabled={disparandoLote || selecionados.size === 0}
                  onClick={handleIniciarDisparoLote}
                  className="px-5 py-2 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar para Selecionados ({selecionados.size})</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: REDIGIR COMUNICADO & ESCOLHER MODELO */}
      {/* ===================================================================== */}
      {viewModo === 'redigir' && (
        <div className="max-w-4xl space-y-6">
          
          {/* Seletor de Modelo Institucional */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
                Selecione o Modelo Institucional
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Escolha o formato da comunicação. Cada modelo possui uma matriz de cabeçalho e assinatura apropriada para a Cúria Provincial.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => aplicarPresetModelo('credenciais')}
                className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                  tipoMensagem === 'credenciais'
                    ? 'border-[#113240] bg-slate-50 dark:bg-slate-800/80 ring-2 ring-[#113240]/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900 dark:text-white">1. Credenciais de Acesso</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Primeiro acesso ao Portal do Religioso com senha provisória automática.</div>
              </button>

              <button
                type="button"
                onClick={() => aplicarPresetModelo('comunicado')}
                className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                  tipoMensagem === 'comunicado'
                    ? 'border-[#113240] bg-slate-50 dark:bg-slate-800/80 ring-2 ring-[#113240]/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900 dark:text-white">2. Comunicado da Secretaria</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Avisos, prazos, orientações administrativas e canônicas aos confrades.</div>
              </button>

              <button
                type="button"
                onClick={() => aplicarPresetModelo('circular')}
                className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                  tipoMensagem === 'circular'
                    ? 'border-[#113240] bg-slate-50 dark:bg-slate-800/80 ring-2 ring-[#113240]/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900 dark:text-white">3. Carta Circular Provincial</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Atos de Governo, nomeações, transferências e cartas do Provincial.</div>
              </button>

              <button
                type="button"
                onClick={() => aplicarPresetModelo('convocacao')}
                className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                  tipoMensagem === 'convocacao'
                    ? 'border-[#113240] bg-slate-50 dark:bg-slate-800/80 ring-2 ring-[#113240]/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900 dark:text-white">4. Convocação Oficial</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Assembleias, Retiro Anual ou encontros com data, local e confirmação.</div>
              </button>
            </div>
          </div>

          {/* Editor de Conteúdo */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
              {tipoMensagem === 'credenciais' ? 'Modelo Homologado de Primeiro Acesso' : 'Parâmetros e Texto da Mensagem'}
            </h3>

            {tipoMensagem === 'credenciais' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-[#226380]/30 bg-[#f4f8fa] dark:bg-[#11242d] space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#113240] dark:text-[#A3C3C7]">
                    <ShieldCheck className="w-4 h-4 text-[#226380]" />
                    <span>Modelo Canônico Oficial Aprovado</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    O modelo de <strong>Primeiro Acesso ao Portal do Religioso</strong> utiliza a redação formal e padronizada da Província Brasileira Meridional, sem alterações no texto. Cada confrade recebe seus dados individuais de login e a senha provisória calculada automaticamente.
                  </p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div>• <strong>Assunto:</strong> Portal do Religioso: Suas credenciais de primeiro acesso - [Nome do Confrade]</div>
                    <div>• <strong>Cabeçalho:</strong> Brasão Dehoniano Colorido Oficial sobre fundo #113240</div>
                    <div>• <strong>Instruções:</strong> Passo a passo em 4 etapas numeradas para cadastro de senha definitiva</div>
                    <div>• <strong>Rodapé:</strong> Cúria Provincial em Corupá - SC e aviso canônico institucional</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href="/templates/preview-credenciais-exemplo.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#226380] hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visualizar Modelo Completo em Nova Janela</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setViewModo('teste')}
                    className="px-4 py-2 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Prévia Fiel & Testar Envio</span>
                  </button>
                </div>

                {/* Prévia Integrada do Modelo Oficial */}
                <div className="rounded-lg border border-slate-300 dark:border-slate-800 overflow-hidden bg-[#F3F6F8] mt-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Visualização Fiel do Modelo Oficial Aprovado
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Largura Canônica: 620px</span>
                  </div>
                  <iframe
                    title="Modelo Oficial de Credenciais"
                    src="/templates/preview-credenciais-exemplo.html"
                    className="w-full h-[640px] border-none bg-[#F3F6F8]"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assunto do E-mail <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={assunto}
                      onChange={e => setAssunto(e.target.value)}
                      placeholder="Ex: Carta Circular 01/2026 - Governo Provincial"
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subtítulo no Cabeçalho Timbrado
                    </label>
                    <input
                      type="text"
                      value={subtituloCabecalho}
                      onChange={e => setSubtituloCabecalho(e.target.value)}
                      placeholder="Ex: Carta Circular nº 01/2026"
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corpo da Mensagem (Parágrafos)
                  </label>
                  <textarea
                    rows={6}
                    value={corpoTexto}
                    onChange={e => setCorpoTexto(e.target.value)}
                    placeholder="Escreva a mensagem oficial aos confrades. Dê dois 'Enter' para criar novos parágrafos..."
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380] font-sans leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cada parágrafo será renderizado com espaçamento canônico e tipografia legível.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bloco de Destaque / Aviso Canônico (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={blocoDestaque}
                    onChange={e => setBlocoDestaque(e.target.value)}
                    placeholder="Texto em destaque com borda azul e fundo diferenciado (ex: datas limites, orientações de comparecimento)..."
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Botão de Ação - Texto (Opcional)
                    </label>
                    <input
                      type="text"
                      value={botaoTexto}
                      onChange={e => setBotaoTexto(e.target.value)}
                      placeholder="Ex: Acessar Documento no Portal"
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Botão de Ação - URL / Link (Opcional)
                    </label>
                    <input
                      type="url"
                      value={botaoUrl}
                      onChange={e => setBotaoUrl(e.target.value)}
                      placeholder="https://portal.brm.org.br/..."
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#226380]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assinatura Institucional
                  </label>
                  <input
                    type="text"
                    value={assinaturaTexto}
                    onChange={e => setAssinaturaTexto(e.target.value)}
                    placeholder="Ex: Secretaria Provincial ou Pe. Superior Provincial e Conselho"
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500">
                    Destinatários atuais selecionados: <strong>{selecionados.size}</strong> confrade(s).
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewModo('teste')}
                      className="px-4 py-2 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Prévia & Testar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: PRÉVIA AO VIVO & TESTE DE HOMOLOGAÇÃO */}
      {/* ===================================================================== */}
      {viewModo === 'teste' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna 1: Formulário de Envio de Teste */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
                  Disparo de Teste
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Envie uma mensagem real para a sua própria caixa de entrada para conferir a entrega e formatação no celular ou computador.
                </p>
              </div>

              <form onSubmit={handleEnviarTeste} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Teste 1 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seu.email@dominio.com"
                    value={emailTeste1}
                    onChange={e => setEmailTeste1(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Teste 2 <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="outro.email@dominio.com"
                    value={emailTeste2}
                    onChange={e => setEmailTeste2(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Simulado do Confrade
                  </label>
                  <input
                    type="text"
                    value={nomeTeste}
                    onChange={e => setNomeTeste(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviandoTeste}
                  className="w-full py-2.5 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {enviandoTeste ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando pelo Resend...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Disparar E-mail de Teste</span>
                    </>
                  )}
                </button>
              </form>

              {/* Resultado do Teste */}
              {resultadoTeste && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-md p-3.5 bg-slate-50 dark:bg-[#10171B] space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Retorno do Envio de Teste:
                  </div>
                  {resultadoTeste.itens.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        {it.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{it.email}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {it.ok ? `ID: ${it.id?.slice(0, 8)}...` : `Erro: ${it.error}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Alerta Institucional de Publicação da Edge Function */}
              {erroPublicacaoEdgeFunction && (
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/60 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Edge Function pendente de publicação no Supabase</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    A função <code className="font-mono font-semibold">disparar-credenciais-religioso</code> precisa ser publicada no seu projeto Supabase (<code>ukhxcwzifugxdkdhobsi</code>).
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-2 rounded font-mono text-[10px] select-all overflow-x-auto">
                    npx supabase functions deploy disparar-credenciais-religioso --project-ref ukhxcwzifugxdkdhobsi --no-verify-jwt
                  </div>
                </div>
              )}
            </div>

            {/* Ação rápida para envio em lote */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Pronto para disparar aos confrades?</span>
                <span className="font-bold text-[#113240] dark:text-[#A3C3C7]">{selecionados.size} selecionado(s)</span>
              </div>
              <button
                type="button"
                disabled={disparandoLote || selecionados.size === 0}
                onClick={handleIniciarDisparoLote}
                className="w-full py-2.5 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar aos {selecionados.size} Confrades Selecionados</span>
              </button>
            </div>
          </div>

          {/* Coluna 2: Prévia Visual ao Vivo */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                {tipoMensagem === 'credenciais' ? 'Modelo Oficial Aprovado de Primeiro Acesso:' : 'Prévia Fiel do Comunicado:'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Largura canônica: 620px</span>
            </div>

            {tipoMensagem === 'credenciais' ? (
              <div className="rounded-lg border border-slate-300 dark:border-slate-800 overflow-hidden bg-[#F3F6F8]">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    E-mail Timbrado com Credenciais (Renderização Real)
                  </span>
                  <a
                    href="/templates/preview-credenciais-exemplo.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#226380] dark:text-[#A3C3C7] hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir em Nova Janela</span>
                  </a>
                </div>
                <iframe
                  title="Prévia do E-mail Oficial de Credenciais"
                  srcDoc={gerarHtmlCredenciaisPreview(nomeTeste, emailTeste1, senhaTeste)}
                  className="w-full h-[720px] border-none bg-[#F3F6F8]"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-300 dark:border-slate-800 overflow-hidden bg-[#F3F6F8] p-4 flex justify-center">
                <div className="w-full max-w-[580px] bg-white border border-[#dce5e8] rounded-xl overflow-hidden shadow-xs text-[#17333d]">
                  
                  {/* Cabeçalho Timbrado */}
                  <div className="bg-[#113240] px-6 py-8 text-center border-b-4 border-[#226380]">
                    <img
                      src="https://sistema.brm.org.br/brasao-colorido-dehoniano.png"
                      alt="Brasão Dehoniano"
                      className="h-20 w-auto mx-auto mb-3 object-contain"
                    />
                    <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#8bb6c6]">
                      Província Brasileira Meridional · SCJ
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight mt-1">
                      {tituloCabecalho || 'Secretaria Provincial'}
                    </div>
                    <div className="text-xs text-[#c0d6df] mt-0.5">
                      {subtituloCabecalho || 'Comunicado Oficial'}
                    </div>
                  </div>

                  {/* Corpo */}
                  <div className="p-6 space-y-4 text-xs text-[#374f59] leading-relaxed">
                    <p className="font-bold text-sm text-[#113240]">
                      Prezado {nomeTeste || 'Pe. Confrade, SCJ'},
                    </p>

                    <div className="whitespace-pre-line space-y-2">
                      {corpoTexto || 'Escreva o corpo da mensagem na aba "Redigir Comunicado" para visualizá-lo aqui.'}
                    </div>

                    {blocoDestaque && (
                      <div className="p-4 rounded border border-[#d5e2e6] border-l-4 border-l-[#226380] bg-[#f7fafb] whitespace-pre-line text-[#17333d]">
                        {blocoDestaque}
                      </div>
                    )}

                    {botaoTexto && (
                      <div className="text-center py-2">
                        <span className="inline-block px-6 py-2.5 rounded bg-[#113240] text-white font-semibold text-xs">
                          {botaoTexto}
                        </span>
                      </div>
                    )}

                    {/* Assinatura */}
                    <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                      <div className="italic font-semibold text-slate-700 dark:text-slate-300">In corde Iesu.</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{assinaturaTexto || 'Secretaria Provincial'}</div>
                      <div>Província Brasileira Meridional · SCJ</div>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="bg-[#f7fafb] p-4 text-center border-t border-[#e7eff2] text-[10px] text-slate-500 leading-relaxed">
                    <strong>Província Brasileira Meridional</strong> · Congregação dos Sacerdotes do Sagrado Coração de Jesus<br />
                    Cúria Provincial · Rua Padre Gabriel Lux, 900 – Caixa Postal 21 · Corupá - SC · CEP 89278-000
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 4: HISTÓRICO DE ENVIOS & AUDITORIA CANÔNICA */}
      {/* ===================================================================== */}
      {viewModo === 'historico' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-cinzel">
                Auditoria de Disparos da Cúria
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Registro cronológico oficial de todas as transmissões de e-mail efetuadas pela Secretaria Provincial.
              </p>
            </div>

            <button
              type="button"
              onClick={carregarHistorico}
              disabled={carregandoHistorico}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregandoHistorico ? 'animate-spin' : ''}`} />
              <span>Atualizar Histórico</span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#10171B] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Assunto da Mensagem</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3 text-center">Destinatários</th>
                    <th className="p-3 text-center">Sucessos</th>
                    <th className="p-3 text-center">Falhas</th>
                    <th className="p-3 text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {historico.map(reg => {
                    const isOpen = historicoItemAberto === reg.id;
                    const rotuloTipo = 
                      reg.tipo_mensagem === 'credenciais' ? 'Credenciais' :
                      reg.tipo_mensagem === 'circular' ? 'Carta Circular' :
                      reg.tipo_mensagem === 'convocacao' ? 'Convocação' : 'Comunicado';

                    return (
                      <React.Fragment key={reg.id}>
                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {new Date(reg.criado_em).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {rotuloTipo}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                            {reg.assunto}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {reg.operador_nome}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                            {reg.total_destinatarios}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            {reg.total_sucessos}
                          </td>
                          <td className="p-3 text-center font-bold text-rose-700 dark:text-rose-400">
                            {reg.total_falhas}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setHistoricoItemAberto(isOpen ? null : reg.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#226380] hover:underline cursor-pointer"
                            >
                              <span>{isOpen ? 'Ocultar' : 'Ver Lista'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>

                        {/* Detalhes expansíveis do envio */}
                        {isOpen && reg.relatorio_envio && (
                          <tr className="bg-slate-50/70 dark:bg-[#10171B]">
                            <td colSpan={8} className="p-4 space-y-2">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Relatório Nominal de Confrades ({reg.relatorio_envio.length} registros):
                              </div>
                              <div className="max-h-48 overflow-y-auto rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-2 space-y-1 text-[11px] font-mono">
                                {reg.relatorio_envio.map((it: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between py-1 px-2 border-b border-slate-100 dark:border-slate-800/40 last:border-none">
                                    <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">{it.nome}</span>
                                    <span className="text-slate-500">{it.email || '—'}</span>
                                    <span className={it.status === 'enviado' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                      {it.status === 'enviado' ? `OK (${it.resendId?.slice(0, 8)}...)` : `FALHA (${it.motivo})`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {carregandoHistorico ? 'Carregando histórico...' : 'Nenhum histórico de disparo registrado até o momento.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DispararCredenciaisPage;
