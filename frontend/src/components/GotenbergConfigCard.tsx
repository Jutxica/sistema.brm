import React, { useState, useEffect } from 'react';
import { 
  Server, RefreshCw, Loader2, Download, CheckCircle2, 
  AlertCircle, Sparkles, ExternalLink, FileText, X, Check, BookOpen, User 
} from 'lucide-react';
import { gotenbergService } from '../services/gotenbergService';
import { showToast } from '../hooks/useFeedback';
import { supabase } from '../lib/supabaseClient';

type TipoDocumentoEmissao = 'decreto' | 'ficha' | 'portaria' | 'celebret' | 'votos' | 'circular';

export const GotenbergConfigCard: React.FC = () => {
  const [url, setUrl] = useState(() => gotenbergService.obterUrlBase());
  const [testando, setTestando] = useState(false);
  const [status, setStatus] = useState<{ online: boolean; mensagem: string } | null>(null);

  // Estados do Modal de Emissão
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoDoc, setTipoDoc] = useState<TipoDocumentoEmissao>('decreto');
  const [gerando, setGerando] = useState(false);
  const [religiososLista, setReligiososLista] = useState<Array<{ id: string; nome_civil: string; nome_religioso?: string; grau?: string; numero_cadastro?: number }>>([]);
  const [religiosoSelecionadoId, setReligiosoSelecionadoId] = useState<string>('');

  // Carrega lista de religiosos ao abrir o modal
  useEffect(() => {
    if (modalAberto && religiososLista.length === 0) {
      void supabase
        .from('religiosos')
        .select('id, nome_civil, nome_religioso, grau, numero_cadastro')
        .order('nome_civil', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setReligiososLista(data);
          }
        });
    }
  }, [modalAberto, religiososLista.length]);

  // Campos do Formulário do Documento
  const [numeroDoc, setNumeroDoc] = useState('DEC-BRM-014/2026');
  const [assuntoDoc, setAssuntoDoc] = useState('Provisão Canônica de Pároco e Reitor');
  const [religiosoNome, setReligiosoNome] = useState('Pe. João Maria dehoniano, scj');
  const [oficioReligioso, setOficioReligioso] = useState('Pároco e Reitor');
  const [comunidadeDestino, setComunidadeDestino] = useState('Paróquia São Luiz Gonzaga');
  const [cidadeUf, setCidadeUf] = useState('Brusque / SC');
  const [textoCorpo, setTextoCorpo] = useState(
    'O presbítero empossado exercerá seu ministério pastoral e sacramental em conformidade com as constituições dehonianas e normas canônicas vigentes, promovendo o cuidado aos fiéis e o bem da Igreja.'
  );

  const handleSalvarUrl = (novaUrl: string) => {
    setUrl(novaUrl);
    gotenbergService.definirUrlBase(novaUrl);
  };

  const handleTestar = async () => {
    setTestando(true);
    try {
      const res = await gotenbergService.testarConexao();
      setStatus(res);
      if (res.online) {
        showToast.success('Servidor Gotenberg conectado com sucesso!', 'Gotenberg Online');
      } else {
        showToast.warning(res.mensagem, 'Gotenberg Offline');
      }
    } finally {
      setTestando(false);
    }
  };

  const handleTrocarTipo = (novoTipo: TipoDocumentoEmissao) => {
    setTipoDoc(novoTipo);
    if (novoTipo === 'decreto') {
      setNumeroDoc('DEC-BRM-014/2026');
      setAssuntoDoc('Provisão Canônica de Pároco e Reitor');
      setOficioReligioso('Pároco e Reitor');
    } else if (novoTipo === 'ficha') {
      setNumeroDoc('FICH-BRM-045/2026');
      setAssuntoDoc('Ficha Cadastral Canônica com Trajetória e Histórico de Comunidades');
      setOficioReligioso('Pároco e Reitor');
      setTextoCorpo('Dossiê canônico contendo trajetória completa de ofícios, paróquias onde trabalhou e formação religiosa.');
    } else if (novoTipo === 'portaria') {
      setNumeroDoc('PORT-BRM-008/2026');
      setAssuntoDoc('Constituição da Comissão Provincial de Pastoral Vocacional');
      setTextoCorpo('Fica instituída a Comissão Preparatória para o Ano Vocacional Dehoniano da Província BRM, com mandato até dezembro de 2027.');
    } else if (novoTipo === 'celebret') {
      setNumeroDoc('CEL-BRM-2026/045');
      setAssuntoDoc('Declaração Canônica de Uso de Ordens (Celebret)');
      setTextoCorpo('Certifica-se a idoneidade e o pleno uso de ordens sagradas para viagens apostólicas e celebrações litúrgicas.');
    } else if (novoTipo === 'votos') {
      setNumeroDoc('VOT-BRM-2026/012');
      setAssuntoDoc('Certidão Canônica de Profissão de Votos Perpétuos');
      setTextoCorpo('Assento lavrado no Livro III de Votos Perpétuos da Província BRM.');
    } else if (novoTipo === 'circular') {
      setNumeroDoc('CIRC-BRM-005/2026');
      setAssuntoDoc('Mensagem Pastoral do Padre Provincial para a Páscoa da Ressurreição');
      setTextoCorpo('Caríssimos confrades, que a vitória do Coração Ressuscitado de Cristo renove nossas comunidades e anime nossa entrega apostólica neste tempo jubilar.');
    }
  };

  const handleSelecionarReligiosoFicha = (religiosoId: string) => {
    setReligiosoSelecionadoId(religiosoId);
    const r = religiososLista.find(item => item.id === religiosoId);
    if (r) {
      setReligiosoNome(r.nome_religioso || r.nome_civil);
      if (r.numero_cadastro) {
        setNumeroDoc(`FICH-BRM-${String(r.numero_cadastro).padStart(4, '0')}/2026`);
      }
    }
  };

  const handleEmitirDocumento = async () => {
    setGerando(true);
    const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    try {
      let blob: Blob;
      let nomeArquivo = `Documento_${numeroDoc.replace(/\//g, '-')}.pdf`;

      if (tipoDoc === 'decreto') {
        blob = await gotenbergService.gerarDecretoPdf({
          numeroDecreto: numeroDoc,
          ano: 2026,
          assunto: assuntoDoc,
          religiosoNome,
          religiosoOficio: oficioReligioso,
          destinoComunidade: comunidadeDestino,
          cidadeUf,
          textoProvisao: textoCorpo,
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj',
          secretarioNome: 'Pe. Secretário Provincial, scj'
        });
      } else if (tipoDoc === 'ficha') {
        if (religiosoSelecionadoId) {
          // Busca dados reais do religioso no Supabase
          const [
            { data: relData },
            { data: desigData },
            { data: histData },
            { data: missoesData },
            { data: votosData },
            { data: ordensData },
            { data: sacraData },
            { data: acadData },
            { data: famData },
            { data: saudeData },
            { data: endData },
            { data: idiomasData },
          ] = await Promise.all([
            supabase.from('religiosos').select('*').eq('id', religiosoSelecionadoId).maybeSingle(),
            supabase.from('religiosos_designacoes').select('*, comunidades(nome), religiosos_obras_referencia(nome)').eq('religioso_id', religiosoSelecionadoId),
            supabase.from('religiosos_historico_comunidades').select('*').eq('religioso_id', religiosoSelecionadoId).order('periodo_inicio', { ascending: true }),
            supabase.from('religiosos_missoes_servicos').select('*').eq('religioso_id', religiosoSelecionadoId).order('created_at', { ascending: true }),
            supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', religiosoSelecionadoId).order('data', { ascending: true }),
            supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', religiosoSelecionadoId).order('data', { ascending: true }),
            supabase.from('religiosos_sacramentos').select('*').eq('religioso_id', religiosoSelecionadoId).order('data', { ascending: true }),
            supabase.from('religiosos_formacao_academica').select('*').eq('religioso_id', religiosoSelecionadoId).order('created_at', { ascending: true }),
            supabase.from('religiosos_familiares').select('*').eq('religioso_id', religiosoSelecionadoId),
            supabase.from('religiosos_saude').select('*').eq('religioso_id', religiosoSelecionadoId).limit(1).maybeSingle(),
            supabase.from('religiosos_enderecos_contatos').select('*').eq('religioso_id', religiosoSelecionadoId).limit(1).maybeSingle(),
            supabase.from('religiosos_idiomas').select('*').eq('religioso_id', religiosoSelecionadoId),
          ]);

          const trabalhos: Array<{
            periodo: string;
            instituicao: string;
            funcao: string;
            local?: string;
            observacoes?: string;
          }> = [];

          (desigData || []).forEach(d => {
            const nomeInst = d.comunidades?.nome || d.religiosos_obras_referencia?.nome || 'Comunidade Provincial';
            const ano = d.ano_referencia || (d.vigencia_inicio ? new Date(d.vigencia_inicio).getFullYear() : '');
            const fim = d.vigencia_fim ? new Date(d.vigencia_fim).getFullYear() : 'Atual';
            const periodoStr = ano ? (ano === fim ? String(ano) : `${ano} - ${fim}`) : 'Vigente';
            trabalhos.push({
              periodo: periodoStr,
              instituicao: nomeInst,
              funcao: d.funcao || d.tipo_vinculo || 'Membro da Comunidade',
              local: 'Província BRM',
              observacoes: d.tipo_vinculo ? `Vínculo: ${d.tipo_vinculo}` : undefined
            });
          });

          (histData || []).forEach(h => {
            const pIni = h.periodo_inicio ? new Date(h.periodo_inicio).getFullYear() : '';
            const pFim = h.periodo_fim ? new Date(h.periodo_fim).getFullYear() : '';
            const periodoStr = pIni && pFim ? (pIni === pFim ? String(pIni) : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Atual` : '—');
            trabalhos.push({
              periodo: periodoStr,
              instituicao: h.instituicao || 'Instituição SCJ',
              funcao: h.funcao || 'Atuação Pastoral',
              local: h.local || undefined,
              observacoes: h.observacoes || undefined
            });
          });

          if (trabalhos.length === 0 && relData?.comunidade_atual_nome) {
            trabalhos.push({
              periodo: 'Atual',
              instituicao: relData.comunidade_atual_nome,
              funcao: relData.grau || 'Confrade',
              local: 'Província BRM'
            });
          }

          const bat = (sacraData || []).find(s => (s.tipo || '').toLowerCase().includes('batis'));
          const primV = (votosData || []).find(v => (v.tipo || '').toLowerCase().includes('primeir') || (v.tipo || '').toLowerCase().includes('tempor'));
          const perpV = (votosData || []).find(v => (v.tipo || '').toLowerCase().includes('perp'));
          const diac = (ordensData || []).find(o => (o.tipo || '').toLowerCase().includes('diacon'));
          const presb = (ordensData || []).find(o => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));
          const pai = (famData || []).find(f => (f.tipo || f.parentesco || '').toLowerCase().includes('pai'))?.nome;
          const mae = (famData || []).find(f => (f.tipo || f.parentesco || '').toLowerCase().includes('mãe') || (f.tipo || f.parentesco || '').toLowerCase().includes('mae'))?.nome;

          blob = await gotenbergService.gerarFichaReligiosoPdf({
            nomeCivil: relData?.nome_civil || religiosoNome,
            nomeReligioso: relData?.nome_religioso || undefined,
            grau: relData?.grau || 'Padre',
            numeroCadastro: relData?.numero_cadastro || undefined,
            statusCadastro: relData?.status_cadastro || 'Aprovado',
            dataNascimento: relData?.data_nascimento || undefined,
            naturalidade: [relData?.municipio_nascimento, relData?.estado_nascimento].filter(Boolean).join(' - ') || undefined,
            nacionalidade: relData?.nacionalidade || 'Brasileira',
            cpf: relData?.cpf || undefined,
            rg: relData?.rg || undefined,
            rgOrgao: relData?.rg_orgao_expedidor || undefined,
            tituloEleitor: relData?.titulo_eleitor || undefined,
            pis: relData?.pis || undefined,
            cnh: relData?.cnh || undefined,
            filiacaoPai: pai,
            filiacaoMae: mae,
            comunidadeAtualNome: relData?.comunidade_atual_nome || undefined,
            oficioAtual: desigData?.[0]?.funcao || oficioReligioso,
            telefoneCelular: relData?.telefone_celular || undefined,
            whatsapp: relData?.whatsapp || undefined,
            emailInstitucional: relData?.email_institucional || undefined,
            emailPessoal: relData?.email_pessoal || undefined,
            tipoSanguineo: saudeData?.tipo_sanguineo ? `${saudeData.tipo_sanguineo} ${saudeData.fator_rh || ''}` : undefined,
            planoSaude: saudeData?.plano_saude || undefined,
            dataBatismo: bat?.data,
            paroquiaBatismo: bat?.paroquia,
            dataPrimeirosVotos: primV?.data,
            localPrimeirosVotos: primV?.local || primV?.cidade,
            dataVotosPerpetuos: perpV?.data,
            localVotosPerpetuos: perpV?.local || perpV?.cidade,
            dataDiaconato: diac?.data,
            localDiaconato: diac?.local,
            dataPresbiterato: presb?.data,
            localPresbiterato: presb?.local,
            bispoOrdenante: presb?.bispo_ordenante || diac?.bispo_ordenante,
            historicoTrabalhos: trabalhos,
            missoesServicos: (missoesData || []).map(m => ({ tipo: m.tipo, instituicao: m.instituicao, funcao: m.funcao, periodo: m.periodo, local: m.local })),
            formacoesAcademicas: (acadData || []).map(a => ({ curso: a.categoria || 'Curso', instituicao: a.instituicao || '', anoOuPeriodo: a.periodo })),
            idiomas: (idiomasData || []).map(i => `${i.idioma} (${i.nivel || 'Fluente'})`),
            dataEmissao: dataHoje
          });
        } else {
          // Modelo Demonstrativo com Trajetória Rica
          blob = await gotenbergService.gerarFichaReligiosoPdf({
            nomeCivil: 'Carlos Eduardo da Silva',
            nomeReligioso: 'Pe. Carlos Eduardo, SCJ',
            grau: 'Padre',
            numeroCadastro: '0045',
            statusCadastro: 'Aprovado',
            dataNascimento: '15/06/1984',
            naturalidade: 'Brusque / SC',
            nacionalidade: 'Brasileira',
            cpf: '123.456.789-00',
            rg: '4.567.890 (SSP/SC)',
            tituloEleitor: '987654321098',
            pis: '123.45678.90-1',
            cnh: '01234567890 (B)',
            filiacaoPai: 'Antônio da Silva',
            filiacaoMae: 'Maria Aparecida da Silva',
            comunidadeAtualNome: comunidadeDestino,
            oficioAtual: oficioReligioso,
            enderecoResidencial: 'Rua Padre Gabriel Lux, 900 - Corupá/SC | CEP 89278-000',
            telefoneCelular: '(47) 99876-5432',
            whatsapp: '(47) 99876-5432',
            emailInstitucional: 'pe.carlos@brm.org.br',
            emailPessoal: 'carlos.scj@gmail.com',
            tipoSanguineo: 'O+',
            planoSaude: 'Unimed Saúde',
            contatoEmergencia: 'Maria Aparecida (Mãe) - (47) 98888-1122',
            dataBatismo: '12/08/1984',
            paroquiaBatismo: 'Paróquia São Luiz Gonzaga - Brusque/SC',
            dataIngresso: '2004',
            dataPrimeirosVotos: '02/02/2006',
            localPrimeirosVotos: 'Jaraguá do Sul / SC',
            dataVotosPerpetuos: '02/02/2010',
            localVotosPerpetuos: 'Corupá / SC',
            dataDiaconato: '19/06/2011',
            localDiaconato: 'Taubaté / SP',
            dataPresbiterato: '10/12/2011',
            localPresbiterato: 'Santuário Sagrado Coração de Jesus - Joinville/SC',
            bispoOrdenante: 'Dom Wilson Tadeu Jönck, SCJ',
            historicoTrabalhos: [
              {
                periodo: '2012 - 2015',
                instituicao: 'Paróquia São Luiz Gonzaga',
                funcao: 'Vigário Paroquial e Pastoral Juvenil',
                local: 'Brusque / SC',
                observacoes: 'Acompanhamento do setor juventude e catequese.'
              },
              {
                periodo: '2015 - 2019',
                instituicao: 'Seminário São José',
                funcao: 'Reitor e Formador dos Seminaristas Menores',
                local: 'Rio Negrinho / SC',
                observacoes: 'Direção pedagógica e acompanhamento vocacional.'
              },
              {
                periodo: '2019 - 2023',
                instituicao: 'Santuário Sagrado Coração de Jesus',
                funcao: 'Pároco e Reitor do Santuário',
                local: 'Joinville / SC',
                observacoes: 'Coordenação pastoral e atendimento ao confessionário.'
              },
              {
                periodo: '2023 - Atual',
                instituicao: 'Sede Provincial BRM',
                funcao: 'Ecônomo Adjunto e Membro do Conselho Provincial',
                local: 'Corupá / SC',
                observacoes: 'Governo Provincial e administração patrimonial.'
              }
            ],
            missoesServicos: [
              {
                tipo: 'Comissão Provincial',
                instituicao: 'Comissão de Formação Inicial Dehoniana',
                funcao: 'Coordenador',
                periodo: '2017 - 2021',
                local: 'Província BRM'
              },
              {
                tipo: 'Assessoria Canônica',
                instituicao: 'Tribunal Eclesiástico Interdiocesano',
                funcao: 'Assessor Convidado',
                periodo: '2022 - Atual',
                local: 'Joinville / SC'
              }
            ],
            formacoesAcademicas: [
              {
                curso: 'Bacharelado em Filosofia',
                instituicao: 'Faculdade Dehoniana - Taubaté/SP',
                anoOuPeriodo: '2004 - 2007'
              },
              {
                curso: 'Bacharelado em Teologia',
                instituicao: 'Faculdade Dehoniana - Taubaté/SP',
                anoOuPeriodo: '2008 - 2011'
              },
              {
                curso: 'Pós-graduação em Espiritualidade Dehoniana',
                instituicao: 'Centro de Estudos Dehonianos - Roma',
                anoOuPeriodo: '2016'
              }
            ],
            idiomas: ['Português (nativo)', 'Italiano (avançado)', 'Espanhol (intermediário)'],
            dataEmissao: dataHoje
          });
        }
      } else if (tipoDoc === 'portaria') {
        blob = await gotenbergService.gerarPortariaPdf({
          numeroPortaria: numeroDoc,
          assunto: assuntoDoc,
          destinatarios: religiosoNome,
          finalidade: comunidadeDestino,
          textoPortaria: textoCorpo,
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj',
          secretarioNome: 'Pe. Secretário Provincial, scj'
        });
      } else if (tipoDoc === 'celebret') {
        blob = await gotenbergService.gerarCelebretPdf({
          numeroCertidao: numeroDoc,
          religiosoNome,
          grauMinisterial: 'Presbítero',
          dataOrdenacao: '12 de dezembro de 2018',
          bispoOrdenante: 'Dom Murilo Sebastião Ramos Krieger, scj',
          validadeAte: '1 ano após a data de emissão',
          observacoes: 'Nada consta contra o exercício de suas ordens sacras.',
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj'
        });
      } else if (tipoDoc === 'votos') {
        blob = await gotenbergService.gerarCertidaoVotosPdf({
          numeroRegistro: numeroDoc,
          religiosoNome,
          tipoVotos: 'Perpétuos',
          dataProfissao: '02 de fevereiro de 2022',
          localProfissao: 'Igreja Matriz São Luiz Gonzaga - Brusque/SC',
          superiorRecebedor: 'Pe. Superior Provincial, scj',
          livroRegistro: '04',
          folhaRegistro: '128',
          termoRegistro: '254',
          dataEmissao: dataHoje,
          secretarioNome: 'Pe. Secretário Provincial, scj'
        });
      } else {
        blob = await gotenbergService.gerarCircularPdf({
          numeroCircular: numeroDoc,
          assunto: assuntoDoc,
          saudacao: 'Caríssimos Confrades, Paz e Bem no Coração de Jesus!',
          corpoTexto: `<p>${textoCorpo}</p>`,
          dataEmissao: dataHoje,
          provincialNome: 'Pe. Superior Provincial, scj'
        });
      }

      gotenbergService.baixarBlob(blob, nomeArquivo);
      showToast.success(`Documento ${numeroDoc} emitido com sucesso em padrão PDF/A!`, 'Emissão Concluída');
      setModalAberto(false);
    } catch (err: any) {
      showToast.error(`Erro ao gerar PDF: ${err?.message || 'Verifique a conexão com o Gotenberg.'}`, 'Erro Gotenberg');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#226380] dark:text-[#A3C3C7]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-cinzel">
              Central de Emissão de Documentos Canônicos (Gotenberg / Easypanel)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emissão oficial de Decretos, Portarias, Celebret (Idoneidade), Certidões de Votos e Circulares no Papel Timbrado BRM.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#226380] hover:bg-[#113240] text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Emitir Documento Oficial</span>
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 font-mono mb-1">
            URL do Serviço Gotenberg no Easypanel:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => handleSalvarUrl(e.target.value)}
              placeholder="https://sitebrm-gotenberg.ryk9yi.easypanel.host"
              className="flex-1 px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-[#226380]"
            />
            <button
              type="button"
              onClick={handleTestar}
              disabled={testando}
              className="px-3.5 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {testando ? <Loader2 className="w-3 h-3 animate-spin text-[#226380]" /> : <RefreshCw className="w-3 h-3" />}
              <span>Testar Conexão</span>
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`p-3 rounded-[6px] border flex items-center gap-2.5 font-mono text-xs ${
              status.online
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
            }`}
          >
            {status.online ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{status.mensagem}</span>
          </div>
        )}
      </div>

      {/* Modal Emissor de Documentos Canônicos */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[20px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 shadow-2xl">
            
            {/* Topo do Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#226380] dark:text-[#A3C3C7]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-cinzel leading-tight">
                    Emissão de Documento Oficial Canônico
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Renderização direta com Papel Timbrado Oficial via Gotenberg
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Seletor de Tipo de Documento */}
              <div>
                <label className="block text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 mb-2">
                  Selecione o Tipo de Documento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {([
                    ['decreto', 'Decreto'],
                    ['ficha', 'Ficha Confrade'],
                    ['portaria', 'Portaria'],
                    ['celebret', 'Celebret'],
                    ['votos', 'Votos SCJ'],
                    ['circular', 'Circular']
                  ] as const).map(([tipo, label]) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleTrocarTipo(tipo)}
                      className={`py-2 px-2.5 rounded-[6px] font-mono text-xs font-semibold border transition-all cursor-pointer text-center ${
                        tipoDoc === tipo
                          ? 'border-[#226380] bg-[#226380] text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {tipoDoc === 'ficha' && (
                  <div className="sm:col-span-2 p-3 rounded-lg border border-[#226380]/30 bg-[#226380]/5 dark:bg-[#226380]/10">
                    <label className="block text-[11px] font-mono font-bold text-[#113240] dark:text-[#A3C3C7] mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Selecionar Religioso Cadastrado no Sistema:</span>
                    </label>
                    <select
                      value={religiosoSelecionadoId}
                      onChange={(e) => handleSelecionarReligiosoFicha(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Modelo Demonstrativo Completo com Trajetória Modelo (Pe. Carlos Eduardo, SCJ) --</option>
                      {religiososLista.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nome_religioso ? `${r.nome_religioso} (${r.nome_civil})` : r.nome_civil} {r.grau ? `• ${r.grau}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      {religiosoSelecionadoId
                        ? 'Os dados do religioso, histórico de comunidades onde trabalhou e ofícios canônicos serão carregados do banco de dados.'
                        : 'Será gerado um dossiê modelo canônico de demonstração com paróquias anteriores, ofícios exercidos e brasão oficial BRM.'}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Número do Registro / Protocolo:
                  </label>
                  <input
                    type="text"
                    value={numeroDoc}
                    onChange={(e) => setNumeroDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Nome do Confrade / Religioso:
                  </label>
                  <input
                    type="text"
                    value={religiosoNome}
                    onChange={(e) => setReligiosoNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Assunto / Ementa do Documento:
                  </label>
                  <input
                    type="text"
                    value={assuntoDoc}
                    onChange={(e) => setAssuntoDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                {tipoDoc === 'decreto' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                        Ofício Canônico Designado:
                      </label>
                      <input
                        type="text"
                        value={oficioReligioso}
                        onChange={(e) => setOficioReligioso(e.target.value)}
                        className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                        Comunidade / Cidade / UF:
                      </label>
                      <input
                        type="text"
                        value={`${comunidadeDestino} • ${cidadeUf}`}
                        onChange={(e) => setComunidadeDestino(e.target.value)}
                        className="w-full px-3 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Texto / Disposições Canônicas:
                  </label>
                  <textarea
                    rows={4}
                    value={textoCorpo}
                    onChange={(e) => setTextoCorpo(e.target.value)}
                    className="w-full p-3 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[11px] font-mono text-slate-500">
                Padrão Arquivístico ISO PDF/A-1b • A4
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEmitirDocumento}
                  disabled={gerando}
                  className="px-5 py-2 rounded-[6px] bg-[#113240] hover:bg-[#226380] text-white text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-60"
                >
                  {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{gerando ? 'Gerando no Gotenberg...' : 'Gerar e Baixar PDF'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
