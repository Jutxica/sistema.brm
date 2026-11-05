import React, { useState, useEffect, useMemo } from 'react';
import { 
  Share2, 
  Check, 
  Download,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../hooks/useFeedback';
import { PapelTimbradoBRM, type OrientacaoDocumento } from '../../components/PapelTimbradoBRM';
import { gotenbergService } from '../../services/gotenbergService';
import { obterFotoReligiosoBase64 } from '../../services/religiosoFotoService';
import { atribuirNomeReligioso, formatarComunidadeReligiosa, padronizarSufixoSCJ } from '../../lib/religiosoNome';
import { extrairAno } from '../../utils/dateUtils';

interface FichaCanonicaPDFProps {
  religiosoId?: string;
  onBack?: () => void;
}

export const FichaCanonicaPDF: React.FC<FichaCanonicaPDFProps> = ({ 
  religiosoId, 
  onBack 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  const [orientacao, setOrientacao] = useState<OrientacaoDocumento>('vertical');
  const [exportandoGotenberg, setExportandoGotenberg] = useState(false);
  const isE2E = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true';

  useEffect(() => {
    const carregarDadosFicha = async () => {
      setLoading(true);
      try {
        if (isE2E && !religiosoId) {
          setData({
            nome_civil: 'Carlos Eduardo da Silva',
            nome_religioso: 'Pe. Carlos Eduardo, SCJ',
            grau: 'Padre',
            status_cadastro: 'Aprovado',
            status: 'Ativo',
            data_nascimento: '1984-06-15',
            municipio_nascimento: 'Brusque',
            estado_nascimento: 'SC',
            pais_nascimento: 'Brasil',
            nacionalidade: 'Brasileira',
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            rg_orgao_expedidor: 'SSP/SC',
            titulo_eleitor: '987654321098',
            pis: '123.45678.90-1',
            cnh: '01234567890',
            cnh_categoria: 'B',
            comunidade_atual_nome: 'Sede Provincial – Seminário Sagrado Coração de Jesus, Corupá/SC',
            email_institucional: 'pe.carlos@brm.org.br',
            email_pessoal: 'carlos.scj@gmail.com',
            telefone_celular: '(41) 99876-5432',
            whatsapp: '(41) 99876-5432',
            data_ingresso: '2004-02-10',
            data_primeiros_votos: '2006-02-02',
            data_votos_perpetuos: '2010-02-02',
            data_diaconato: '2011-06-19',
            data_presbiterato: '2011-12-10',
            bispo_ordenante: 'Dom Wilson Tadeu Jönck, SCJ',
            local_ordenacao: 'Santuário Sagrado Coração de Jesus, Joinville/SC',
            formacoes: [
              { curso: 'Bacharelado em Filosofia', instituicao: 'Faculdade Dehoniana', ano: '2007' },
              { curso: 'Bacharelado em Teologia', instituicao: 'Faculdade Dehoniana', ano: '2011' },
              { curso: 'Pós-graduação em Espiritualidade Dehoniana', instituicao: 'Centro Dehoniano', ano: '2016' }
            ],
            familiares: [
              { tipo: 'Pai', nome: 'Antônio da Silva', estado_civil: 'Casado' },
              { tipo: 'Mãe', nome: 'Maria Aparecida da Silva', estado_civil: 'Casada' }
            ]
          });
          setLoading(false);
          return;
        }

        let targetId = religiosoId || user?.religiosoId;

        if (!targetId && user?.id) {
          const { data: rel, error } = await supabase
            .from('religiosos')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (error) throw error;
          if (rel) targetId = rel.id;
        }

        if (targetId) {
          let query = supabase.from('religiosos').select('*').eq('id', targetId);
          if (!religiosoId && user?.id) {
            query = query.eq('auth_user_id', user.id);
          }
          const { data: relRecord, error } = await query.maybeSingle();
          if (error) throw error;
          if (!relRecord) {
            setData(null);
            setLoading(false);
            return;
          }

          // Buscar dados canônicos e documentais em paralelo
          const [
            { data: votos },
            { data: ordens },
            { data: formacaoReligiosa },
            { data: formacoes },
            { data: familiares },
            { data: designacoes },
            { data: historicoComunidades },
            { data: missoesServicos },
            { data: documentosAntigos },
            { data: documentosArquivo },
            { data: origemVocacional },
            { data: idiomasData },
            { data: saudeData },
            { data: sacramentosData },
            { data: enderecoData }
          ] = await Promise.all([
            supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', targetId).order('data', { ascending: true }),
            supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', targetId).order('data', { ascending: true }),
            supabase.from('religiosos_formacao_religiosa').select('*').eq('religioso_id', targetId).order('data_ingresso', { ascending: true }),
            supabase.from('religiosos_formacao_academica').select('*').eq('religioso_id', targetId).order('created_at', { ascending: true }),
            supabase.from('religiosos_familiares').select('*').eq('religioso_id', targetId),
            supabase.from('religiosos_designacoes').select('*, comunidades(nome, cidade, estado), religiosos_obras_referencia(nome, cidade, localidade)').eq('religioso_id', targetId).order('vigencia_inicio', { ascending: false }),
            supabase.from('religiosos_historico_comunidades').select('*').eq('religioso_id', targetId).order('periodo_inicio', { ascending: true }),
            supabase.from('religiosos_missoes_servicos').select('*').eq('religioso_id', targetId).order('created_at', { ascending: true }),
            supabase.from('religiosos_documentos').select('id,categoria,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,data_cadastro,status').eq('religioso_id', targetId).order('data_cadastro', { ascending: false }),
            supabase.from('secretaria_dossie_documentos').select('id,categoria,titulo,nome_arquivo,caminho_storage,mime_type,tamanho_bytes,criado_em').eq('religioso_id', targetId).order('criado_em', { ascending: false }),
            supabase.from('religiosos_origem_vocacional').select('*').eq('religioso_id', targetId).limit(1).maybeSingle(),
            supabase.from('religiosos_idiomas').select('*').eq('religioso_id', targetId),
            supabase.from('religiosos_saude').select('*').eq('religioso_id', targetId).limit(1).maybeSingle(),
            supabase.from('religiosos_sacramentos').select('*').eq('religioso_id', targetId).order('data', { ascending: true }),
            supabase.from('religiosos_enderecos_contatos').select('*').eq('religioso_id', targetId).limit(1).maybeSingle()
          ]);

          // Obter foto assinada se foto_path existir
          let resolvedFotoUrl = relRecord.foto_url || null;
          if (relRecord.foto_path) {
            try {
              const { data: signedData } = await supabase.storage
                .from('religiosos-perfil')
                .createSignedUrl(relRecord.foto_path, 3600);
              if (signedData?.signedUrl) {
                resolvedFotoUrl = signedData.signedUrl;
              }
            } catch (storageErr) {
              console.warn('Não foi possível obter URL assinada da foto:', storageErr);
            }
          }

          // Derivar marcos canônicos a partir das listas reais do banco
          const postulantado = formacaoReligiosa?.find((f: any) => (f.etapa || '').toLowerCase().includes('postulan'));
          const noviciado = formacaoReligiosa?.find((f: any) => (f.etapa || '').toLowerCase().includes('novici'));
          const primVotos = votos?.find((v: any) => (v.tipo || '').toLowerCase().includes('primeir'));
          const perpVotos = votos?.find((v: any) => (v.tipo || '').toLowerCase().includes('perp'));
          const diaconato = ordens?.find((o: any) => (o.tipo || '').toLowerCase().includes('diacon'));
          const presbiterato = ordens?.find((o: any) => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));
          const batismoItem = sacramentosData?.find((s: any) => (s.tipo || '').toLowerCase().includes('batis')) || null;

          const docList = [
            ...(documentosAntigos || []).map(d => ({
              ...d,
              data: d.data_cadastro,
              origem: 'religiosos_documentos'
            })),
            ...(documentosArquivo || []).map(d => ({
              ...d,
              data: d.criado_em,
              origem: 'secretaria_dossie_documentos'
            }))
          ];

          setData({
            ...relRecord,
            foto_url: resolvedFotoUrl,
            data_ingresso: relRecord.data_ingresso || postulantado?.data_ingresso || noviciado?.data_ingresso || '',
            data_primeiros_votos: relRecord.data_primeiros_votos || primVotos?.data || '',
            data_votos_perpetuos: relRecord.data_votos_perpetuos || perpVotos?.data || '',
            data_diaconato: relRecord.data_diaconato || diaconato?.data || '',
            data_presbiterato: relRecord.data_presbiterato || presbiterato?.data || '',
            bispo_ordenante: relRecord.bispo_ordenante || presbiterato?.bispo_ordenante || diaconato?.bispo_ordenante || '',
            local_ordenacao: relRecord.local_ordenacao || presbiterato?.local || diaconato?.local || '',
            votosList: votos || [],
            ordensList: ordens || [],
            formacaoReligiosa: formacaoReligiosa || [],
            formacoes: formacoes || [],
            familiares: familiares || [],
            designacoes: designacoes || [],
            historicoComunidades: historicoComunidades || [],
            missoesServicos: missoesServicos || [],
            documentosCadastrados: docList,
            origemVocacional: origemVocacional || null,
            idiomas: (idiomasData || []).map(i => `${i.idioma} (${i.nivel || i.fala || 'Fluente'})`),
            saude: saudeData || null,
            sacramentosList: sacramentosData || [],
            batismo: batismoItem,
            endereco: enderecoData || null
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados da ficha canônica:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosFicha();
  }, [religiosoId, user, isE2E]);

  const handleExportarGotenberg = async () => {
    if (!data) return;
    setExportandoGotenberg(true);
    try {
      const trabalhos: Array<{
        periodo: string;
        comunidade?: string;
        obra?: string;
        faseGrau?: string;
        funcao: string;
        local?: string;
        observacoes?: string;
        ordenacaoAno?: number;
      }> = [];

      // A. Separa etapas de Formação Inicial (cards) vs Trajetória de Trabalhos (a partir do Tirocínio)
      const etapasIniciaisParaPdf: Array<{
        etapa: string;
        periodo?: string;
        instituicao?: string;
        cidade?: string;
        local?: string;
        formador?: string;
        observacoes?: string;
        isFaseAtual?: boolean;
        anoTeologia?: number;
      }> = [];

      const grauNorm = (data.grau || '').toLowerCase();
      const isFraterOuDiacono = grauNorm.includes('frater') || grauNorm.includes('diác') || grauNorm.includes('diac');
      const anoAtual = new Date().getFullYear();

      (data.formacaoReligiosa || []).forEach((f: any) => {
        const pIni = f.data_ingresso ? extrairAno(f.data_ingresso) : '';
        const pFim = f.data_conclusao ? extrairAno(f.data_conclusao) : '';
        const etapaNome = f.etapa || 'Formação Inicial';
        const isTirocinio = etapaNome.toLowerCase().includes('tirocín') || etapaNome.toLowerCase().includes('tirocin');
        const isConfiguracao = etapaNome.toLowerCase().includes('configur');
        const isConventinho = (f.instituicao || f.local || '').toLowerCase().includes('conventinho') ||
                              (f.cidade || '').toLowerCase().includes('taubat') ||
                              (data.comunidade_atual_nome || '').toLowerCase().includes('conventinho');

        const anoIniNum = pIni && !Number.isNaN(Number(pIni)) ? Number(pIni) : anoAtual;
        const anoNum = anoIniNum;

        const isConfiguracaoAtiva = isFraterOuDiacono && (
          data.etapa_formativa_atual === 'Configuração (Teologia)' ||
          ((isConfiguracao || isConventinho) && (!pFim || Number(pFim) >= anoAtual))
        );

        let periodoStr: string;
        let anoTeologia: number | undefined;

        if (isConfiguracaoAtiva) {
          anoTeologia = data.ano_configuracao ? Number(data.ano_configuracao) : Math.max(1, Math.min(4, anoAtual - anoIniNum + 1));
          periodoStr = `${anoIniNum} - Fase Atual (${anoTeologia}º Ano)`;
        } else if (pIni && pFim) {
          periodoStr = pIni === pFim ? pIni : `${pIni} - ${pFim}`;
        } else if (pIni) {
          periodoStr = `${pIni} - Concluído`;
        } else {
          periodoStr = 'Período Formativo';
        }

        if (isTirocinio) {
          trabalhos.push({
            periodo: periodoStr,
            comunidade: f.instituicao || f.local || 'Comunidade do Tirocínio',
            obra: f.instituicao || 'Tirocínio',
            faseGrau: 'Tirocínio',
            funcao: 'Tirocinante',
            local: [f.cidade, f.local].filter(Boolean).join(' • ') || 'Província BRM',
            observacoes: [f.formador ? `Superior da Comunidade: ${f.formador}` : (f.superior ? `Superior da Comunidade: ${f.superior}` : null), f.observacoes].filter(Boolean).join(' • ') || undefined,
            ordenacaoAno: anoNum
          });
        } else {
          etapasIniciaisParaPdf.push({
            etapa: etapaNome,
            periodo: periodoStr,
            instituicao: f.instituicao || f.local || 'Casa de Formação SCJ',
            cidade: f.cidade || f.local || undefined,
            local: f.local || undefined,
            formador: f.formador || undefined,
            observacoes: f.observacoes || undefined,
            isFaseAtual: isConfiguracaoAtiva,
            anoTeologia: anoTeologia,
          });
        }
      });

      // B. Inclui histórico de comunidades
      (data.historicoComunidades || []).forEach((h: any) => {
        const pIni = h.periodo_inicio ? extrairAno(h.periodo_inicio) : '';
        const pFim = h.periodo_fim ? extrairAno(h.periodo_fim) : '';
        const periodoStr = pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Atual` : '—');
        const anoNum = pIni && !Number.isNaN(Number(pIni)) ? Number(pIni) : 2010;

        trabalhos.push({
          periodo: periodoStr,
          comunidade: h.instituicao || 'Comunidade SCJ',
          obra: h.instituicao || 'Paróquia / Obra',
          faseGrau: data.grau || 'Religioso SCJ',
          funcao: h.funcao || 'Atuação Pastoral',
          local: h.local || undefined,
          observacoes: h.observacoes || undefined,
          ordenacaoAno: anoNum
        });
      });

      // C. Inclui designações canônicas
      (data.designacoes || []).forEach((d: any) => {
        const comNome = formatarComunidadeReligiosa(d.comunidades?.nome) || 'Comunidade Provincial';
        const obraNome = d.religiosos_obras_referencia?.nome || 'Atuação Pastoral';
        const ano = d.ano_referencia || (d.vigencia_inicio ? extrairAno(d.vigencia_inicio) : '');
        const fim = d.vigencia_fim ? extrairAno(d.vigencia_fim) : 'Atual';
        const periodoStr = ano ? (ano === fim ? String(ano) : `${ano} - ${fim}`) : 'Vigente';
        const localidade = [d.comunidades?.cidade, d.religiosos_obras_referencia?.cidade].filter(Boolean)[0] || 'Província BRM';
        const anoNum = ano && !Number.isNaN(Number(ano)) ? Number(ano) : 2026;

        trabalhos.push({
          periodo: periodoStr,
          comunidade: comNome,
          obra: obraNome,
          faseGrau: data.grau || 'Religioso',
          funcao: d.funcao || d.tipo_vinculo || 'Membro da Comunidade',
          local: localidade,
          observacoes: [d.tipo_vinculo ? `Vínculo: ${d.tipo_vinculo}` : null, d.observacoes].filter(Boolean).join(' • ') || undefined,
          ordenacaoAno: anoNum
        });
      });

      // D. Se não houver atual explícito
      const temAtual = trabalhos.some(t => t.periodo.includes('Atual') || t.periodo.includes('Vigente'));
      if (!temAtual && (data.comunidade_atual_nome || data.obra_atual_nome)) {
        trabalhos.push({
          periodo: 'Atual',
          comunidade: formatarComunidadeReligiosa(data.comunidade_atual_nome) || 'Comunidade Provincial',
          obra: data.obra_atual_nome || 'Residência Canônica',
          faseGrau: data.etapa_formativa_atual === 'Tirocínio' ? 'Tirocínio' : (data.grau || 'Confrade'),
          funcao: data.etapa_formativa_atual === 'Tirocínio' ? 'Tirocinante' : (data.designacoes?.[0]?.funcao || 'Membro Ativo'),
          local: 'Província BRM',
          ordenacaoAno: 9999
        });
      }

      // Ordena cronologicamente
      trabalhos.sort((a, b) => (a.ordenacaoAno || 0) - (b.ordenacaoAno || 0));

      const documentosParaPdf = (data.documentosCadastrados || [])
        .filter((d: any) => d.status !== 'Excluido')
        .map((d: any) => ({
          categoria: d.categoria || 'Documento Geral',
          nomeArquivo: d.nome_arquivo || d.titulo || 'Registro Digital',
          data: d.data ? formatarData(d.data) : undefined,
          status: d.status || 'Arquivo Digital Provincial'
        }));

      const lemasParaPdf: Array<{ fase: string; texto: string; destacado?: boolean }> = (data.lemas || []).map((l: any) => ({
        fase: l.fase,
        texto: l.texto,
        destacado: l.destacado
      }));
      if (lemasParaPdf.length === 0 && (data.lema_destacado || data.lema)) {
        lemasParaPdf.push({
          fase: (data.lema_destacado_fase as string) || 'Lema Canônico',
          texto: String(data.lema_destacado || data.lema).replace(/^[“"']|[”"']$/g, '').trim(),
          destacado: true
        });
      }

      const origemVocacionalParaPdf = {
        paroquiaOrigem: data.origemVocacional?.paroquia_origem || data.batismo?.paroquia || undefined,
        cidade: [data.origemVocacional?.cidade_origem, data.origemVocacional?.estado_origem].filter(Boolean).join(' / ') || undefined,
        diocese: data.origemVocacional?.diocese_origem || undefined,
        promotorVocacional: data.origemVocacional?.promotor_vocacional || undefined
      };

      const primVotos = (data.votosList || []).find((v: any) => (v.tipo || '').toLowerCase().includes('primeir'));
      const perpVotos = (data.votosList || []).find((v: any) => (v.tipo || '').toLowerCase().includes('perp'));
      const diaconato = (data.ordensList || []).find((o: any) => (o.tipo || '').toLowerCase().includes('diacon'));
      const presbiterato = (data.ordensList || []).find((o: any) => (o.tipo || '').toLowerCase().includes('presb') || (o.tipo || '').toLowerCase().includes('sacerd'));

      const fotoBase64 = await obterFotoReligiosoBase64(data);

      const blob = await gotenbergService.gerarFichaReligiosoPdf({
        nomeCivil: data.nome_civil,
        nomeReligioso: atribuirNomeReligioso(data.grau, data.nome_civil) || padronizarSufixoSCJ(data.nome_religioso) || undefined,
        grau: data.grau || 'Padre',
        numeroCadastro: data.numero_cadastro || undefined,
        statusCadastro: data.status_cadastro || 'Aprovado',
        dataNascimento: formatarData(data.data_nascimento),
        naturalidade: naturalidadeTexto,
        nacionalidade: data.nacionalidade || 'Brasileira',
        cpf: formatCpfMask(data.cpf),
        rg: data.rg || undefined,
        rgOrgao: data.rg_orgao_expedidor || undefined,
        tituloEleitor: data.titulo_eleitor || undefined,
        pis: data.pis || undefined,
        cnh: data.cnh || undefined,
        cnhCategoria: data.cnh_categoria || undefined,
        filiacaoPai: pai || undefined,
        filiacaoMae: mae || undefined,
        fotoUrl: fotoBase64 || data.foto_url || undefined,
        lemaPrincipal: data.lema_destacado || data.lema || undefined,
        lemaPrincipalFase: data.lema_destacado_fase || undefined,
        lemasVocacionais: lemasParaPdf,
        origemVocacional: origemVocacionalParaPdf,
        documentosCadastrados: documentosParaPdf,

        comunidadeAtualNome: formatarComunidadeReligiosa(data.comunidade_atual_nome) || undefined,
        obraAtualNome: data.obra_atual_nome || undefined,
        oficioAtual: data.designacoes?.[0]?.funcao || undefined,
        telefoneCelular: data.telefone_celular || undefined,
        whatsapp: data.whatsapp || undefined,
        emailInstitucional: data.email_institucional || undefined,
        emailPessoal: data.email_pessoal || undefined,
        tipoSanguineo: data.saude?.tipo_sanguineo ? `${data.saude.tipo_sanguineo} ${data.saude.fator_rh || ''}` : undefined,
        planoSaude: data.saude?.plano_saude || undefined,

        dataBatismo: data.batismo?.data ? formatarData(data.batismo.data) : undefined,
        paroquiaBatismo: data.batismo?.paroquia || undefined,
        dataPrimeirosVotos: formatarData(data.data_primeiros_votos),
        localPrimeirosVotos: primVotos?.local || primVotos?.cidade || undefined,
        dataVotosPerpetuos: formatarData(data.data_votos_perpetuos),
        localVotosPerpetuos: perpVotos?.local || perpVotos?.cidade || undefined,
        dataDiaconato: formatarData(data.data_diaconato),
        localDiaconato: diaconato?.local || undefined,
        dataPresbiterato: formatarData(data.data_presbiterato),
        localPresbiterato: data.local_ordenacao || presbiterato?.local || undefined,
        bispoOrdenante: data.bispo_ordenante || undefined,

        etapasFormacaoInicial: etapasIniciaisParaPdf,
        historicoTrabalhos: trabalhos,
        missoesServicos: (data.missoesServicos || []).map((m: any) => ({ tipo: m.tipo, instituicao: m.instituicao, funcao: m.funcao, periodo: m.periodo, local: m.local })),
        formacoesAcademicas: (data.formacoes || []).map((f: any) => ({ curso: f.curso || f.categoria || '', instituicao: f.instituicao || '', anoOuPeriodo: f.ano || f.periodo })),
        idiomas: data.idiomas || [],
        dataEmissao: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      });

      const nomeLimpo = (data.nome_religioso || data.nome_civil).replace(/[^a-zA-Z0-9]/g, '_');
      gotenbergService.baixarBlob(blob, `Ficha_Canonica_${nomeLimpo}.pdf`);
      showToast.success('Ficha Canônica com Trajetória e Brasão gerada com sucesso!', 'Gotenberg PDF');
    } catch (err: any) {
      showToast.error(`Erro ao gerar PDF: ${err.message || 'Verifique o serviço Gotenberg.'}`, 'Erro Gotenberg');
    } finally {
      setExportandoGotenberg(false);
    }
  };

  const handleShare = async () => {
    const nome = data?.nome_religioso || data?.nome_civil || 'Ficha do Religioso';
    const textoCompartilhar = `Ficha Cadastral Canônica - Província Brasileira Meridional (SCJ)\nReligioso: ${nome}\nComunidade: ${data?.comunidade_atual_nome || 'Província BRM'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha Canônica - ${nome}`,
          text: textoCompartilhar,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Ignora cancelamento
      }
    }

    try {
      await navigator.clipboard.writeText(`${textoCompartilhar}\nLink: ${window.location.href}`);
      setCopiado(true);
      showToast.success('Link copiado para a área de transferência.');
      setTimeout(() => setCopiado(false), 3000);
    } catch (e) {
      showToast.info('Link copiado para a área de transferência.');
    }
  };

  const formatarData = (d?: string) => {
    if (!d) return '—';
    try {
      const parts = d.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return d;
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-16">
        <div className="w-8 h-8 rounded-full border-2 border-[#226380]/20 border-t-[#226380] animate-spin" />
        <span className="text-[12px] font-medium text-[#707070] dark:text-[#86868b] mt-3">
          Gerando Ficha Canônica Oficial...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[6px] border border-[#d6d6d6] bg-white p-8 text-center">
        <p className="text-sm text-[#707070]">Não foi encontrada uma ficha vinculada à sua conta.</p>
        {onBack && (
          <button type="button" onClick={onBack} className="mt-4 text-sm font-medium text-[#226380] hover:underline">
            Voltar ao portal
          </button>
        )}
      </div>
    );
  }

  const formatCpfMask = (cpf?: string | null) => {
    if (!cpf) return '—';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const naturalidadeTexto = [data?.municipio_nascimento, data?.estado_nascimento].filter(Boolean).join(' - ') || '—';
  const pai = data?.familiares?.find((f: any) => (f.parentesco || f.tipo || '').toLowerCase().includes('pai'))?.nome;
  const mae = data?.familiares?.find((f: any) => (f.parentesco || f.tipo || '').toLowerCase().includes('mãe') || (f.parentesco || f.tipo || '').toLowerCase().includes('mae'))?.nome;
  const paisTexto = [pai, mae].filter(Boolean).join(' e ') || '—';

  const anoIngresso = extrairAno(data?.data_ingresso);
  const batismo = data?.batismo || data?.sacramentosList?.find((s: any) => (s.tipo || '').toLowerCase().includes('batis')) || null;

  const { etapasFormacaoInicial, etapasTirocinio } = useMemo(() => {
    const iniciais: any[] = [];
    const tirocinio: any[] = [];
    (data?.formacaoReligiosa || []).forEach((f: any) => {
      const etapaNome = f.etapa || '';
      if (etapaNome.toLowerCase().includes('tirocín') || etapaNome.toLowerCase().includes('tirocin')) {
        tirocinio.push(f);
      } else {
        iniciais.push(f);
      }
    });
    return { etapasFormacaoInicial: iniciais, etapasTirocinio: tirocinio };
  }, [data?.formacaoReligiosa]);

  return (
    <div className="w-full">
      <PapelTimbradoBRM
        orientacao={orientacao}
        permitirTrocaOrientacao={true}
        orgaoEmissor="Arquivo Provincial · Chancelaria"
        protocolo={data?.numero_cadastro ? String(data.numero_cadastro).padStart(4, '0') : (data?.id ? data.id.slice(0, 8).toUpperCase() : 'BRM-2026')}
        dataEmissao={new Date().toLocaleDateString('pt-BR')}
        subtituloDocumento="Arquivo Provincial · Chancelaria"
        tituloDocumento="FICHA CANÔNICA CADASTRAL OFICIAL"
        onVoltar={onBack}
        rodapeComplementar={
          <div className="flex justify-between text-[6.5pt] font-mono text-slate-500 print:text-slate-600">
            <span>Emitido eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · sistema.brm.org.br</span>
            <span>Documento canônico reservado · Protegido pela LGPD</span>
          </div>
        }
        acoesExtras={
          <>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#226380]" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportarGotenberg}
              disabled={exportandoGotenberg}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Emitir Ficha Oficial Canônica em PDF com Brasão Dehoniano"
            >
              {exportandoGotenberg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#226380]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#226380]" />
              )}
              <span>Exportar PDF Oficial</span>
            </button>
          </>
        }
      >

        {/* Identificação do Religioso */}
        <div className="flex items-end justify-between border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-4">
            {data?.foto_url && (
              <img
                src={data.foto_url}
                alt="Foto"
                className="w-14 h-16 object-cover border border-slate-300 rounded-[2px]"
              />
            )}
            <div>
              <p className="font-mono text-[7.5pt] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                Ficha Cadastral Canônica
              </p>
              <h2 className="text-[17pt] font-serif font-bold text-slate-900 mt-0.5">
                {atribuirNomeReligioso(data?.grau, data?.nome_civil) || data?.nome_religioso || data?.nome_civil}
              </h2>
              {data?.lema_destacado && (
                <p className="text-[9pt] font-serif italic text-[#226380] mt-0.5 font-medium">
                  {data.lema_destacado}
                  {data.lema_destacado_fase && (
                    <span className="not-italic text-[7pt] font-sans font-semibold text-slate-500 ml-1.5 uppercase tracking-wide">
                      ({data.lema_destacado_fase})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 border border-slate-900 px-2.5 py-0.5 text-[8pt] font-mono font-semibold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <span>Cadastro {data?.status_cadastro || data?.status || 'Aprovado'}</span>
          </div>
        </div>

        {/* Faixa de Indicadores Rápidos */}
        <div className="grid grid-cols-4 border border-slate-200 bg-white text-center mb-4">
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Grau</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{data?.grau || 'Padre'}</p>
          </div>
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Ingresso</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{anoIngresso}</p>
          </div>
          <div className="p-2 border-r border-slate-200">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Votos Perpétuos</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_votos_perpetuos)}</p>
          </div>
          <div className="p-2">
            <p className="text-[6.5pt] font-mono uppercase tracking-wider text-slate-500">Ordenação</p>
            <p className="text-[9.5pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_presbiterato || data?.data_diaconato)}</p>
          </div>
        </div>

        {/* Bloco 1: Ficha Geral & Registro Civil */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            01. Ficha Geral & Registro Civil
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[8.5pt]">
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Civil</p>
              <p className="font-medium text-slate-900">{data?.nome_civil || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nome Religioso</p>
              <p className="font-medium text-slate-900">{atribuirNomeReligioso(data?.grau, data?.nome_civil) || padronizarSufixoSCJ(data?.nome_religioso) || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Data de Nascimento</p>
              <p className="font-medium text-slate-900">{formatarData(data?.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">CPF</p>
              <p className="font-mono font-medium text-slate-900">{formatCpfMask(data?.cpf)}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">RG / Órgão Expedidor</p>
              <p className="font-medium text-slate-900">{data?.rg ? `${data.rg} (${data?.rg_orgao_expedidor || 'SSP'})` : '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Naturalidade</p>
              <p className="font-medium text-slate-900">{naturalidadeTexto}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Nacionalidade</p>
              <p className="font-medium text-slate-900">{data?.nacionalidade || 'Brasileira'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Título de Eleitor / PIS</p>
              <p className="font-mono font-medium text-slate-900">{[data?.titulo_eleitor, data?.pis].filter(Boolean).join(' · ') || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">E-mail Institucional</p>
              <p className="font-medium text-slate-900">{data?.email_institucional || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Celular / WhatsApp</p>
              <p className="font-medium text-slate-900">{data?.whatsapp || data?.telefone_celular || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Filiação</p>
              <p className="font-medium text-slate-900">{paisTexto}</p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Vínculo Provincial & Residência */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            02. Vínculo Provincial & Residência
          </p>
          <div className="grid grid-cols-4 gap-x-4 text-[8.5pt]">
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Comunidade Atual</p>
              <p className="font-medium text-slate-900">{formatarComunidadeReligiosa(data?.comunidade_atual_nome) || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Obra / Residência</p>
              <p className="font-medium text-slate-900">{data?.obra_atual_nome || '—'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Status Canônico</p>
              <p className="font-medium text-slate-900">{data?.status || 'Ativo'}</p>
            </div>
            <div>
              <p className="text-[6.5pt] font-mono uppercase text-slate-500">Bispo Ordenante</p>
              <p className="font-medium text-slate-900">{data?.bispo_ordenante || '—'}</p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Trajetória Canônica (Linha do Tempo Visual) */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            03. Trajetória Canônica
          </p>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Batismo</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{batismo?.data ? formatarData(batismo.data) : '—'}</p>
              {batismo?.paroquia && <p className="text-[6.5pt] text-slate-500 truncate">{batismo.paroquia}</p>}
            </div>
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Primeira Profissão</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_primeiros_votos)}</p>
            </div>
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Profissão Perpétua</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_votos_perpetuos)}</p>
            </div>
            <div className="border border-slate-200 p-2 bg-white">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-800 mb-1" />
              <p className="text-[6.5pt] font-mono uppercase font-bold text-slate-600">Ordenação</p>
              <p className="text-[8pt] font-medium text-slate-900 mt-0.5">{formatarData(data?.data_presbiterato || data?.data_diaconato)}</p>
              {data?.local_ordenacao && <p className="text-[6.5pt] text-slate-500 truncate">{data.local_ordenacao}</p>}
            </div>
          </div>
        </div>

        {/* Bloco 04: Formação Inicial (Trajetória Formativa Vocacional em Cartões) */}
        {etapasFormacaoInicial.length > 0 && (
          <div className="mb-4">
            <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
              04. Formação Inicial (Trajetória Formativa Vocacional)
            </p>
            <div className={`grid grid-cols-${Math.min(etapasFormacaoInicial.length, 5)} gap-2 text-center pt-1`}>
              {etapasFormacaoInicial.map((f: any, idx: number) => {
                const pIni = f.data_ingresso ? extrairAno(f.data_ingresso) : '';
                const pFim = f.data_conclusao ? extrairAno(f.data_conclusao) : '';
                const etapaNome = f.etapa || 'Etapa';
                const isConfiguracao = etapaNome.toLowerCase().includes('configur');
                const isConventinho = (f.instituicao || f.local || '').toLowerCase().includes('conventinho') ||
                                      (f.cidade || '').toLowerCase().includes('taubat') ||
                                      (data?.comunidade_atual_nome || '').toLowerCase().includes('conventinho');
                const grauNorm = (data?.grau || '').toLowerCase();
                const isFraterOuDiacono = grauNorm.includes('frater') || grauNorm.includes('diác') || grauNorm.includes('diac');
                const anoAtual = new Date().getFullYear();
                const anoIniNum = pIni && !Number.isNaN(Number(pIni)) ? Number(pIni) : anoAtual;
                const isConventinhoAtivo = isFraterOuDiacono && (isConfiguracao || isConventinho) && (!pFim || Number(pFim) >= anoAtual);
                const anoTeologia = isConventinhoAtivo ? Math.max(1, Math.min(4, anoAtual - anoIniNum + 1)) : undefined;

                const periodoStr = isConventinhoAtivo
                  ? `${anoIniNum} - Fase Atual (${anoTeologia}º Ano)`
                  : (pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Concluído` : 'Formativo'));

                return (
                  <div key={`form-portal-card-${idx}`} className={`border p-2 flex flex-col justify-between ${isConventinhoAtivo ? 'border-sky-400 bg-sky-50/40' : 'border-slate-200 bg-white'}`}>
                    <div>
                      <span className={`inline-block px-1 py-0.5 font-mono text-[6pt] font-bold uppercase rounded mb-0.5 ${isConventinhoAtivo ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'bg-sky-50 text-sky-800 border border-sky-200'}`}>
                        {f.etapa || 'Etapa'} {isConventinhoAtivo ? '• Fase Atual' : ''}
                      </span>
                      <p className={`text-[8pt] font-bold mt-0.5 ${isConventinhoAtivo ? 'text-sky-900' : 'text-slate-900'}`}>{periodoStr}</p>
                      <p className="text-[7pt] font-semibold text-slate-800 line-clamp-1">{f.instituicao || f.local || 'Casa Formativa'}</p>
                      {anoTeologia && <p className="text-[6.5pt] font-bold text-sky-700 mt-0.5">{anoTeologia}º Ano de Teologia</p>}
                    </div>
                    <div className="mt-1 border-t border-slate-100 pt-0.5 text-[6.5pt] text-slate-500">
                      <p className="truncate">{f.cidade || '—'}</p>
                      {f.formador && <p className="italic text-slate-600 truncate">Formador: {f.formador}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bloco 05: Trajetória de Comunidades e Trabalhos */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            05. Trajetória de Comunidades e Trabalhos (Obras, Comunidades e Ofícios a partir do Tirocínio)
          </p>
          <div className="space-y-1 text-[8pt]">
            {(etapasTirocinio.length > 0) || (data?.historicoComunidades && data.historicoComunidades.length > 0) || (data?.designacoes && data.designacoes.length > 0) ? (
              <table className="w-full border-collapse text-[7.5pt]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[6.8pt] uppercase text-left">
                    <th className="py-1 w-24">Período</th>
                    <th className="py-1">Comunidade</th>
                    <th className="py-1">Obra / Atividade</th>
                    <th className="py-1">Fase / Grau</th>
                    <th className="py-1">Ofício / Função</th>
                    <th className="py-1">Localidade & Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {etapasTirocinio.map((f: any, idx: number) => {
                    const pIni = f.data_ingresso ? extrairAno(f.data_ingresso) : '';
                    const pFim = f.data_conclusao ? extrairAno(f.data_conclusao) : '';
                    const periodoStr = pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Concluído` : 'Formativo');
                    return (
                      <tr key={`tiroc-portal-${idx}`} className="py-1">
                        <td className="font-mono text-slate-500 py-1">{periodoStr}</td>
                        <td className="font-semibold text-slate-900 py-1">{f.instituicao || f.local || 'Comunidade do Tirocínio'}</td>
                        <td className="text-slate-700 py-1">{f.instituicao || 'Tirocínio Pastoral'}</td>
                        <td className="py-1">
                          <span className="font-mono text-[6.5pt] bg-sky-50 text-sky-800 border border-sky-200 px-1 py-0.2 rounded">
                            Tirocínio
                          </span>
                        </td>
                        <td className="text-[#226380] font-medium py-1">Tirocinante / Pastoral</td>
                        <td className="text-slate-600 py-1">{[f.cidade, f.formador ? `Superior da Comunidade: ${f.formador}` : (f.superior ? `Superior da Comunidade: ${f.superior}` : null)].filter(Boolean).join(' • ') || 'Província BRM'}</td>
                      </tr>
                    );
                  })}
                  {(data.historicoComunidades || []).map((h: any, idx: number) => {
                    const pIni = h.periodo_inicio ? extrairAno(h.periodo_inicio) : '';
                    const pFim = h.periodo_fim ? extrairAno(h.periodo_fim) : '';
                    const periodoStr = pIni && pFim ? (pIni === pFim ? pIni : `${pIni} - ${pFim}`) : (pIni ? `${pIni} - Atual` : '—');
                    return (
                      <tr key={`hist-${idx}`} className="py-1">
                        <td className="font-mono text-slate-500 py-1">{periodoStr}</td>
                        <td className="font-semibold text-slate-900 py-1">{h.instituicao}</td>
                        <td className="text-slate-700 py-1">{h.instituicao}</td>
                        <td className="py-1">
                          <span className="font-mono text-[6.5pt] bg-slate-50 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                            {data.grau || 'Religioso'}
                          </span>
                        </td>
                        <td className="text-[#226380] font-medium py-1">{h.funcao || 'Atuação Pastoral'}</td>
                        <td className="text-slate-600 py-1">{[h.cidade || h.local, h.observacoes].filter(Boolean).join(' • ') || '—'}</td>
                      </tr>
                    );
                  })}
                  {(data.designacoes || []).map((d: any, idx: number) => {
                    const pInicio = d.vigencia_inicio ? extrairAno(d.vigencia_inicio) : d.ano_referencia;
                    const pFim = d.vigencia_fim ? extrairAno(d.vigencia_fim) : 'Atual';
                    const localidade = [d.comunidades?.cidade, d.religiosos_obras_referencia?.cidade].filter(Boolean)[0] || 'Província BRM';
                    return (
                      <tr key={`desig-${idx}`} className="py-1">
                        <td className="font-mono text-slate-500 py-1">{pInicio ? (pInicio === pFim ? String(pInicio) : `${pInicio} - ${pFim}`) : (d.ano_referencia || 'Vigente')}</td>
                        <td className="font-semibold text-slate-900 py-1">{formatarComunidadeReligiosa(d.comunidades?.nome) || 'Comunidade Provincial'}</td>
                        <td className="text-slate-700 py-1">{d.religiosos_obras_referencia?.nome || 'Atuação Pastoral / Paróquia'}</td>
                        <td className="py-1">
                          <span className="font-mono text-[6.5pt] bg-slate-50 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                            {data.grau || 'Consagrado'}
                          </span>
                        </td>
                        <td className="text-[#226380] font-medium py-1">{d.funcao || d.tipo_vinculo || 'Membro'}</td>
                        <td className="text-slate-600 py-1">{[localidade, d.numero_decreto ? `Dec. ${d.numero_decreto}` : null].filter(Boolean).join(' • ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic py-2 text-center text-[7pt]">
                Religioso em etapa formativa inicial. As designações de comunidades e trabalhos têm início a partir do Tirocínio.
              </p>
            )}
          </div>
        </div>

        {/* Bloco 06: Formação Acadêmica & Graus Obtidos */}
        <div className="mb-4">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            06. Formação Acadêmica & Graus Obtidos
          </p>
          <div className="space-y-1 text-[8pt]">
            {data?.formacoes && data.formacoes.length > 0 ? (
              data.formacoes.map((f: any, idx: number) => {
                const titulo = f.curso || f.categoria || 'Formação Acadêmica';
                const inst = f.instituicao || 'Instituição';
                const anoPeriodo = f.periodo || f.ano || '';
                return (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-900">{titulo}</span>
                    <span className="text-slate-600">{inst}{anoPeriodo ? ` (${anoPeriodo})` : ''}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 italic py-1">Filosofia e Teologia — Província Brasileira Meridional</p>
            )}
          </div>
        </div>

        {/* Bloco 07: Documentação Cadastrada & Arquivo Digital */}
        <div className="mb-6">
          <p className="text-[7.5pt] font-mono uppercase tracking-[0.14em] font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">
            07. Documentação Cadastrada & Arquivo Digital Provincial
          </p>
          <div className="space-y-1 text-[7.5pt]">
            {data?.documentosCadastrados && data.documentosCadastrados.length > 0 ? (
              <table className="w-full border-collapse text-[7.5pt]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[6.8pt] uppercase text-left">
                    <th className="py-1">Categoria</th>
                    <th className="py-1">Arquivo Digital</th>
                    <th className="py-1 w-24 text-center">Data Registro</th>
                    <th className="py-1 w-28 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.documentosCadastrados.map((d: any, idx: number) => (
                    <tr key={`doc-${idx}`} className="py-0.5">
                      <td className="font-semibold text-slate-900 py-0.5">{d.categoria || 'Geral'}</td>
                      <td className="font-mono text-slate-600 py-0.5 truncate max-w-xs">{d.nome_arquivo || d.titulo || 'Registro Digital'}</td>
                      <td className="font-mono text-slate-500 py-0.5 text-center">{d.data ? formatarData(d.data) : '—'}</td>
                      <td className="text-center py-0.5">
                        <span className="font-mono text-[6.5pt] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 py-0.2 rounded">
                          {d.status || 'Arquivo Provincial'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic py-1">Documentos civis e canônicos originais arquivados na pasta física da Chancelaria Provincial.</p>
            )}
          </div>
        </div>

        {/* Assinaturas Institucionais com espaço amplo para caneta */}
        <div className="mt-12 pt-6 grid grid-cols-2 gap-12 text-center text-[7.5pt] break-inside-avoid">
          <div className="pt-8">
            <div className="border-t border-slate-800 mx-auto w-52 mb-1.5" />
            <p className="font-semibold text-slate-800">{atribuirNomeReligioso(data?.grau, data?.nome_civil) || data?.nome_religioso || data?.nome_civil}</p>
            <p className="text-[6.5pt] text-slate-400 uppercase tracking-wider">Assinatura do Religioso</p>
          </div>
          <div className="pt-8">
            <div className="border-t border-slate-800 mx-auto w-52 mb-1.5" />
            <p className="font-semibold text-slate-800">Chancelaria · Arquivo Provincial</p>
            <p className="text-[6.5pt] text-slate-400 uppercase tracking-wider">Assinatura e carimbo oficial</p>
          </div>
        </div>
      </PapelTimbradoBRM>
    </div>
  );
};

export default FichaCanonicaPDF;
