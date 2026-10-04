import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Building2,
  Car,
  Package,
  ShieldCheck,
  Wrench,
  MapPin,
  FileText,
  Calendar,
  Landmark,
  ChevronRight,
  Sparkles,
  Search,
  Loader2,
  Navigation
} from 'lucide-react';
import { 
  imoveisService, 
  veiculosService, 
  bensService, 
  contratosService, 
  manutencoesService,
  cepService,
  cnpjService,
  ocrService
} from '../services/patrimonioService';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../hooks/useFeedback';
import { PatrimonioAnexosManager } from '../components/PatrimonioAnexosManager';
import type {
  TipoPatrimonio,
  ImovelPatrimonio,
  VeiculoPatrimonio,
  BemPatrimonio,
  ContratoPatrimonio,
  ManutencaoPatrimonio,
  PatrimonioAnexo
} from '../types/patrimonio';
import {
  getPatrimonioLocal,
  savePatrimonioLocal
} from '../types/patrimonio';

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const COMUNIDADES_PREDEFINIDAS = [
  'Curia Provincial BRM - Brusque',
  'Casa Padre Dehon - Brusque',
  'Convento SCJ - Taubaté (Conventinho)',
  'Seminário São José - Rio Negrinho',
  'Seminário Coração de Jesus - Corupá',
  'Seminário Dehonista - Lavras',
  'Paróquia São Sebastião - Joinville',
  'Paróquia Sagrado Coração de Jesus - Joinville',
  'Paróquia Santa Teresinha - Brusque',
  'Paróquia São Judas Tadeu - Brusque',
  'Comunidade Dehoniana - Curitiba',
  'Comunidade Dehoniana - São Paulo',
  'Paróquia São José - Vargem Bonita',
  'Colégio São Luiz - Brusque'
];

export const PatrimonioForm: React.FC = () => {
  const navigate = useNavigate();
  const { tipo: paramTipo, id: paramId } = useParams<{ tipo?: string; id?: string }>();
  const [searchParams] = useSearchParams();

  // Tipo inicial determinado pela URL (?tipo=imovel ou paramTipo)
  const queryTipo = searchParams.get('tipo');
  const [tipoAtivo, setTipoAtivo] = useState<TipoPatrimonio>(() => {
    const raw = (paramTipo || queryTipo || 'imovel').toLowerCase();
    if (raw === 'veiculo' || raw === 'veiculos') return 'veiculo';
    if (raw === 'bem' || raw === 'bens' || raw === 'inventario') return 'bem';
    if (raw === 'contrato' || raw === 'contratos') return 'contrato';
    if (raw === 'manutencao' || raw === 'manutencoes' || raw === 'vistoria') return 'vistoria';
    return 'imovel';
  });

  const isEditing = Boolean(paramId);
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [anexosAtuais, setAnexosAtuais] = useState<PatrimonioAnexo[]>([]);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [processandoOcr, setProcessandoOcr] = useState(false);
  const [ocrResultado, setOcrResultado] = useState<any>(null);

  // Estados dos Formulários
  const [imovelData, setImovelData] = useState<Partial<ImovelPatrimonio>>({
    nome: '',
    tipo: 'Convento / Casa Religiosa',
    comunidade_obra: 'Curia Provincial BRM - Brusque',
    cidade: 'Brusque',
    uf: 'SC',
    endereco: '',
    bairro: '',
    cep: '',
    latitude: undefined,
    longitude: undefined,
    destinacao: '',
    area_terreno_m2: undefined,
    area_construida_m2: undefined,
    numero_matricula: '',
    cartorio_registro: '',
    livro_folha: '',
    inscricao_municipal: '',
    tem_escritura: true,
    tem_habite_se: true,
    avcb_numero: '',
    avcb_vencimento: '',
    seguro_predial_seguradora: '',
    seguro_predial_apolice: '',
    seguro_predial_vencimento: '',
    valor_venal: undefined,
    status: 'Ativo',
    observacoes: ''
  });

  const [veiculoData, setVeiculoData] = useState<Partial<VeiculoPatrimonio>>({
    marca_modelo: '',
    placa: '',
    ano_fabricacao: new Date().getFullYear(),
    ano_modelo: new Date().getFullYear(),
    cor: 'Prata',
    tipo: 'Carro',
    chassi: '',
    renavam: '',
    comunidade_obra: 'Curia Provincial BRM - Brusque',
    responsavel_nome: '',
    combustivel: 'Flex',
    quilometragem_atual: 0,
    proxima_revisao_km: 10000,
    proxima_revisao_data: '',
    ipva_pago: true,
    ipva_vencimento: '',
    seguro_seguradora: 'Porto Seguro Auto',
    seguro_apolice: '',
    seguro_vencimento: '',
    seguro_contato_emergencia: '0800 727 0727',
    status: 'Em Uso',
    observacoes: ''
  });

  const [bemData, setBemData] = useState<Partial<BemPatrimonio>>({
    codigo_tombamento: 'PAT-BRM-004',
    titulo: '',
    categoria: 'Arte Sacra & Liturgia',
    comunidade_obra: 'Convento SCJ - Taubaté (Conventinho)',
    localizacao_especifica: 'Capela Maior',
    estado_conservacao: 'Bom',
    ano_aquisicao: undefined,
    origem_procedencia: '',
    autor_escola: '',
    valor_estimado: undefined,
    tombamento_historico: true,
    descricao_detalhada: '',
    status: 'Ativo'
  });

  const [contratoData, setContratoData] = useState<Partial<ContratoPatrimonio>>({
    titulo: '',
    tipo: 'Seguro Predial Multirrisco',
    fornecedor_prestador: '',
    cnpj_cpf: '',
    contato_telefone: '',
    contato_email: '',
    imovel_vinculado: 'Casa Padre Dehon (Sede Provincial)',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    valor_mensal: undefined,
    valor_anual: undefined,
    renovacao_automatica: true,
    status: 'Vigente',
    observacoes: ''
  });

  const [manutencaoData, setManutencaoData] = useState<Partial<ManutencaoPatrimonio>>({
    titulo: '',
    tipo: 'Vistoria Técnica Periódica',
    comunidade_obra: 'Casa Padre Dehon - Brusque',
    imovel_nome: 'Casa Padre Dehon (Sede Provincial)',
    data_solicitacao: new Date().toISOString().split('T')[0],
    data_conclusao: '',
    responsavel_vistoria: 'Engenharia de Segurança',
    prestador_executante: '',
    custo_estimado: undefined,
    custo_realizado: undefined,
    prioridade: 'Média',
    status: 'Pendente',
    descricao: '',
    laudo_observacoes: ''
  });

  // Carregar dados na edição
  useEffect(() => {
    if (!isEditing || !paramId) return;

    const carregarItemEdicao = () => {
      const local = getPatrimonioLocal();

      if (tipoAtivo === 'imovel') {
        const item = local.imoveis.find((i: ImovelPatrimonio) => i.id === paramId);
        if (item) {
          setImovelData(item);
          setAnexosAtuais(item.anexos || []);
        }
      } else if (tipoAtivo === 'veiculo') {
        const item = local.veiculos.find((v: VeiculoPatrimonio) => v.id === paramId);
        if (item) {
          setVeiculoData(item);
          setAnexosAtuais(item.anexos || []);
        }
      } else if (tipoAtivo === 'bem') {
        const item = local.bens.find((b: BemPatrimonio) => b.id === paramId);
        if (item) {
          setBemData(item);
          setAnexosAtuais(item.anexos || []);
        }
      } else if (tipoAtivo === 'contrato') {
        const item = local.contratos.find((c: ContratoPatrimonio) => c.id === paramId);
        if (item) {
          setContratoData(item);
          setAnexosAtuais(item.anexos || []);
        }
      } else if (tipoAtivo === 'vistoria') {
        const item = local.manutencoes.find((m: ManutencaoPatrimonio) => m.id === paramId);
        if (item) {
          setManutencaoData(item);
          setAnexosAtuais(item.anexos || []);
        }
      }
    };

    carregarItemEdicao();
  }, [isEditing, paramId, tipoAtivo]);

  // Integração Assistida ViaCEP
  const handleBuscarCep = async () => {
    if (!imovelData.cep) return;
    const limpo = cepService.sanitizarCep(imovelData.cep);
    if (limpo.length !== 8) {
      showToast.error('Informe um CEP válido com 8 dígitos.', 'CEP Inválido');
      return;
    }
    setBuscandoCep(true);
    try {
      const res = await cepService.consultarCep(limpo);
      if (res) {
        setImovelData(prev => ({
          ...prev,
          cep: res.cep,
          endereco: prev.endereco ? prev.endereco : (res.logradouro || ''),
          bairro: res.bairro || prev.bairro,
          cidade: res.localidade || prev.cidade,
          uf: res.uf || prev.uf
        }));
        showToast.success(`Endereço localizado: ${res.localidade}/${res.uf}`, 'CEP Localizado');
      } else {
        showToast.error('CEP não localizado. Preencha os campos manualmente.', 'CEP Não Encontrado');
      }
    } catch (_) {
      showToast.error('Falha ao consultar CEP. Preenchimento manual liberado.', 'Aviso');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Integração Assistida CNPJ (BrasilAPI / ReceitaWS)
  const handleBuscarCnpj = async () => {
    if (!contratoData.cnpj_cpf) return;
    const limpo = cnpjService.sanitizarCnpj(contratoData.cnpj_cpf);
    if (limpo.length !== 14) {
      showToast.error('Informe um CNPJ válido com 14 dígitos.', 'CNPJ Inválido');
      return;
    }
    setBuscandoCnpj(true);
    try {
      const res = await cnpjService.consultarCnpj(limpo);
      if (res) {
        setContratoData(prev => ({
          ...prev,
          cnpj_cpf: res.cnpj,
          fornecedor_prestador: res.razaoSocial || res.nomeFantasia || prev.fornecedor_prestador,
          contato_telefone: res.telefone || prev.contato_telefone,
          contato_email: res.email || prev.contato_email
        }));
        showToast.success(`Empresa localizada: ${res.razaoSocial}`, 'CNPJ Localizado');
      } else {
        showToast.error('CNPJ não encontrado na base pública. Preencha os campos manualmente.', 'CNPJ Não Encontrado');
      }
    } catch (_) {
      showToast.error('Falha ao consultar CNPJ. Preenchimento manual liberado.', 'Aviso');
    } finally {
      setBuscandoCnpj(false);
    }
  };

  // Inteligência Documental Assistida por OCR
  const handleProcessarOcrArquivo = async (file: File) => {
    setProcessandoOcr(true);
    try {
      const resultado = await ocrService.processarDocumento(file, tipoAtivo);
      setOcrResultado(resultado);
      showToast.success(`Documento processado com ${resultado.confianca}% de precisão estimada.`, 'OCR Concluído');

      if (tipoAtivo === 'imovel') {
        setImovelData(prev => ({
          ...prev,
          numero_matricula: prev.numero_matricula || resultado.campos.matricula || '',
          cartorio_registro: prev.cartorio_registro || resultado.campos.cartorio || '',
          valor_venal: prev.valor_venal || resultado.campos.valorVenal
        }));
      } else if (tipoAtivo === 'veiculo') {
        setVeiculoData(prev => ({
          ...prev,
          placa: prev.placa || resultado.campos.placa || '',
          renavam: prev.renavam || resultado.campos.renavam || '',
          chassi: prev.chassi || resultado.campos.chassi || '',
          ipva_vencimento: prev.ipva_vencimento || resultado.campos.dataVencimento
        }));
      } else if (tipoAtivo === 'contrato') {
        setContratoData(prev => ({
          ...prev,
          cnpj_cpf: prev.cnpj_cpf || resultado.campos.cnpj || '',
          data_fim: prev.data_fim || resultado.campos.dataVencimento || prev.data_fim,
          valor_mensal: prev.valor_mensal || resultado.campos.valorVenal
        }));
      }
    } catch (err: any) {
      showToast.error(`Erro ao analisar documento: ${err.message || 'Falha de leitura'}`, 'Erro OCR');
    } finally {
      setProcessandoOcr(false);
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const novoId = paramId || crypto.randomUUID();
      const tabDestino = tipoAtivo === 'imovel' ? 'imoveis' :
                         tipoAtivo === 'veiculo' ? 'veiculos' :
                         tipoAtivo === 'bem' ? 'inventario' :
                         tipoAtivo === 'contrato' ? 'contratos' : 'manutencoes';

      const usuarioLogado = user ? { id: user.id, email: user.email, nome: user.nome } : undefined;

      if (tipoAtivo === 'imovel') {
        if (!imovelData.nome?.trim() || !imovelData.cidade?.trim()) {
          showToast.error('Informe ao menos o nome do imóvel e a cidade.', 'Campos Obrigatórios');
          setSaving(false);
          return;
        }

        const payload: ImovelPatrimonio = {
          ...(imovelData as ImovelPatrimonio),
          id: novoId,
          nome: imovelData.nome!.trim(),
          cidade: imovelData.cidade!.trim(),
          tipo: imovelData.tipo || 'Convento / Casa Religiosa',
          uf: imovelData.uf || 'SC',
          tem_escritura: imovelData.tem_escritura ?? true,
          tem_habite_se: imovelData.tem_habite_se ?? true,
          status: imovelData.status || 'Ativo',
          anexos: anexosAtuais,
          created_at: imovelData.created_at || new Date().toISOString()
        };

        await imoveisService.salvar(payload, usuarioLogado);
        showToast.success(`Imóvel "${payload.nome}" gravado com sucesso.`, 'Imóvel Salvo');

      } else if (tipoAtivo === 'veiculo') {
        if (!veiculoData.marca_modelo?.trim() || !veiculoData.placa?.trim()) {
          showToast.error('Informe a marca/modelo e a placa do veículo.', 'Campos Obrigatórios');
          setSaving(false);
          return;
        }

        const payload: VeiculoPatrimonio = {
          ...(veiculoData as VeiculoPatrimonio),
          id: novoId,
          marca_modelo: veiculoData.marca_modelo!.trim(),
          placa: veiculoData.placa!.trim().toUpperCase(),
          comunidade_obra: veiculoData.comunidade_obra || 'Curia Provincial BRM - Brusque',
          tipo: veiculoData.tipo || 'Carro',
          quilometragem_atual: Number(veiculoData.quilometragem_atual || 0),
          ipva_pago: veiculoData.ipva_pago ?? true,
          status: veiculoData.status || 'Em Uso',
          anexos: anexosAtuais,
          created_at: veiculoData.created_at || new Date().toISOString()
        };

        await veiculosService.salvar(payload, usuarioLogado);
        showToast.success(`Veículo ${payload.marca_modelo} (${payload.placa}) registrado.`, 'Veículo Salvo');

      } else if (tipoAtivo === 'bem') {
        if (!bemData.codigo_tombamento?.trim() || !bemData.titulo?.trim()) {
          showToast.error('Informe o código de tombamento e a denominação do bem.', 'Campos Obrigatórios');
          setSaving(false);
          return;
        }

        const payload: BemPatrimonio = {
          ...(bemData as BemPatrimonio),
          id: novoId,
          codigo_tombamento: bemData.codigo_tombamento!.trim().toUpperCase(),
          titulo: bemData.titulo!.trim(),
          categoria: bemData.categoria || 'Arte Sacra & Liturgia',
          comunidade_obra: bemData.comunidade_obra || 'Convento SCJ - Taubaté (Conventinho)',
          estado_conservacao: bemData.estado_conservacao || 'Bom',
          tombamento_historico: bemData.tombamento_historico ?? true,
          status: bemData.status || 'Ativo',
          anexos: anexosAtuais,
          created_at: bemData.created_at || new Date().toISOString()
        };

        await bensService.salvar(payload, usuarioLogado);
        showToast.success(`Item tombo ${payload.codigo_tombamento} registrado.`, 'Item Tombado');

      } else if (tipoAtivo === 'contrato') {
        if (!contratoData.titulo?.trim() || !contratoData.fornecedor_prestador?.trim() || !contratoData.data_fim) {
          showToast.error('Informe o título, fornecedor e data de término do contrato.', 'Campos Obrigatórios');
          setSaving(false);
          return;
        }

        const payload: ContratoPatrimonio = {
          ...(contratoData as ContratoPatrimonio),
          id: novoId,
          titulo: contratoData.titulo!.trim(),
          tipo: contratoData.tipo || 'Seguro Predial Multirrisco',
          fornecedor_prestador: contratoData.fornecedor_prestador!.trim(),
          data_inicio: contratoData.data_inicio || new Date().toISOString().split('T')[0],
          data_fim: contratoData.data_fim,
          renovacao_automatica: contratoData.renovacao_automatica ?? true,
          status: contratoData.status || 'Vigente',
          anexos: anexosAtuais,
          created_at: contratoData.created_at || new Date().toISOString()
        };

        await contratosService.salvar(payload, usuarioLogado);
        showToast.success(`Contrato "${payload.titulo}" registrado.`, 'Contrato Salvo');

      } else if (tipoAtivo === 'vistoria') {
        if (!manutencaoData.titulo?.trim() || !manutencaoData.descricao?.trim()) {
          showToast.error('Informe o título e a descrição da vistoria.', 'Campos Obrigatórios');
          setSaving(false);
          return;
        }

        const payload: ManutencaoPatrimonio = {
          ...(manutencaoData as ManutencaoPatrimonio),
          id: novoId,
          titulo: manutencaoData.titulo!.trim(),
          tipo: manutencaoData.tipo || 'Vistoria Técnica Periódica',
          comunidade_obra: manutencaoData.comunidade_obra || 'Casa Padre Dehon - Brusque',
          data_solicitacao: manutencaoData.data_solicitacao || new Date().toISOString().split('T')[0],
          prioridade: manutencaoData.prioridade || 'Média',
          status: manutencaoData.status || 'Pendente',
          descricao: manutencaoData.descricao!.trim(),
          anexos: anexosAtuais,
          created_at: manutencaoData.created_at || new Date().toISOString()
        };

        await manutencoesService.salvar(payload, usuarioLogado);
        showToast.success(`Ordem de vistoria/obra "${payload.titulo}" registrada.`, 'Ordem Registrada');
      }

      navigate(`/patrimonio?tab=${tabDestino}`);
    } catch (err: any) {
      showToast.error(`Erro ao gravar dados: ${err.message || 'Falha inesperada'}`, 'Erro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto font-sans">
      {/* Top Bar / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/patrimonio')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar ao painel do patrimônio</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Economato Provincial</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#226380] dark:text-[#A3C3C7] font-medium">
            {isEditing ? 'Edição de Ativo' : 'Novo Lançamento'}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] border-t-2 border-t-[#226380] p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7]">
              Província Brasil Meridional · Gestão de Bens
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white font-cinzel">
              {isEditing ? 'Atualizar Registro' : 'Lançamento de Patrimônio'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Preencha os dados do ativo conforme as diretrizes do Economato Provincial BRM.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-[4px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300">
              {tipoAtivo === 'imovel' ? 'Imóvel' :
               tipoAtivo === 'veiculo' ? 'Veículo' :
               tipoAtivo === 'bem' ? 'Inventário Sacro' :
               tipoAtivo === 'contrato' ? 'Contrato / Seguro' : 'Vistoria / Obra'}
            </span>
          </div>
        </div>

        {/* Categoria Switcher */}
        {!isEditing && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-medium text-slate-500 block mb-2.5">
              Categoria do Ativo:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                { id: 'imovel', label: 'Imóvel & Terreno', icon: Building2 },
                { id: 'veiculo', label: 'Frota Veicular', icon: Car },
                { id: 'bem', label: 'Arte Sacra & Bens', icon: Package },
                { id: 'contrato', label: 'Contrato & Seguro', icon: ShieldCheck },
                { id: 'vistoria', label: 'Vistoria & Obra', icon: Wrench },
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = tipoAtivo === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTipoAtivo(cat.id as TipoPatrimonio)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#113240] bg-[#113240] text-white shadow-xs dark:border-[#226380] dark:bg-[#226380]'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#226380]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ========================================================================= */}
        {/* SEÇÃO 1: IMOVEL                                                           */}
        {/* ========================================================================= */}
        {tipoAtivo === 'imovel' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#226380]" />
                  <span>1. Identificação & Destinação Canônica</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nome Oficial do Imóvel / Complexo <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={imovelData.nome || ''}
                    onChange={(e) => setImovelData({ ...imovelData, nome: e.target.value })}
                    placeholder="Ex: Convento Sagrado Coração de Jesus (Conventinho)"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Edificação
                  </label>
                  <select
                    value={imovelData.tipo || 'Convento / Casa Religiosa'}
                    onChange={(e) => setImovelData({ ...imovelData, tipo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Convento / Casa Religiosa">Convento / Casa Religiosa</option>
                    <option value="Seminário / Casa de Formação">Seminário / Casa de Formação</option>
                    <option value="Igreja Matriz / Capela">Igreja Matriz / Capela</option>
                    <option value="Casa Paroquial / Residência">Casa Paroquial / Residência</option>
                    <option value="Colégio / Instituto de Ensino">Colégio / Instituto de Ensino</option>
                    <option value="Obra Social / Centro Pastoral">Obra Social / Centro Pastoral</option>
                    <option value="Casa de Retiros / Encontros">Casa de Retiros / Encontros</option>
                    <option value="Terreno / Gleba Rural ou Urbana">Terreno / Gleba Rural ou Urbana</option>
                    <option value="Imóvel Comercial / Alugado">Imóvel Comercial / Alugado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Comunidade Vinculada
                  </label>
                  <input
                    type="text"
                    list="comunidades-list"
                    value={imovelData.comunidade_obra || ''}
                    onChange={(e) => setImovelData({ ...imovelData, comunidade_obra: e.target.value })}
                    placeholder="Selecione ou digite a comunidade..."
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                  <datalist id="comunidades-list">
                    {COMUNIDADES_PREDEFINIDAS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Destinação Canônica & Uso Pastoral
                  </label>
                  <input
                    type="text"
                    value={imovelData.destinacao || ''}
                    onChange={(e) => setImovelData({ ...imovelData, destinacao: e.target.value })}
                    placeholder="Ex: Formação teológica de seminaristas maiores, biblioteca provincial e capela aberta ao público"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#226380]" />
                  <span>2. Localização & Endereço</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Cidade <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={imovelData.cidade || ''}
                    onChange={(e) => setImovelData({ ...imovelData, cidade: e.target.value })}
                    placeholder="Ex: Taubaté"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    UF <span className="text-[#80282E]">*</span>
                  </label>
                  <select
                    value={imovelData.uf || 'SC'}
                    onChange={(e) => setImovelData({ ...imovelData, uf: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      CEP
                    </label>
                    <button
                      type="button"
                      onClick={handleBuscarCep}
                      disabled={buscandoCep}
                      className="text-[11px] font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {buscandoCep ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      <span>{buscandoCep ? 'Buscando...' : 'Buscar CEP'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={imovelData.cep || ''}
                    onChange={(e) => setImovelData({ ...imovelData, cep: e.target.value })}
                    onBlur={() => {
                      if (imovelData.cep && imovelData.cep.replace(/\D/g, '').length === 8) {
                        handleBuscarCep();
                      }
                    }}
                    placeholder="00000-000"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Logradouro & Número
                  </label>
                  <input
                    type="text"
                    value={imovelData.endereco || ''}
                    onChange={(e) => setImovelData({ ...imovelData, endereco: e.target.value })}
                    placeholder="Ex: Av. Marechal Deodoro, 333"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={imovelData.bairro || ''}
                    onChange={(e) => setImovelData({ ...imovelData, bairro: e.target.value })}
                    placeholder="Ex: Santa Clara"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Latitude (GPS)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={imovelData.latitude ?? ''}
                    onChange={(e) => setImovelData({ ...imovelData, latitude: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="-23.023456"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Longitude (GPS)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={imovelData.longitude ?? ''}
                    onChange={(e) => setImovelData({ ...imovelData, longitude: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="-45.556789"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#226380]" />
                  <span>3. Medições & Cartório de Registro de Imóveis (RGI)</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Área do Terreno (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={imovelData.area_terreno_m2 ?? ''}
                    onChange={(e) => setImovelData({ ...imovelData, area_terreno_m2: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 24800"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Área Construída / Edificada (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={imovelData.area_construida_m2 ?? ''}
                    onChange={(e) => setImovelData({ ...imovelData, area_construida_m2: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 6200"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Matrícula Imobiliária (RGI)
                  </label>
                  <input
                    type="text"
                    value={imovelData.numero_matricula || ''}
                    onChange={(e) => setImovelData({ ...imovelData, numero_matricula: e.target.value })}
                    placeholder="Ex: 38.411 - 2º Ofício"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Cartório Competente de Registro
                  </label>
                  <input
                    type="text"
                    value={imovelData.cartorio_registro || ''}
                    onChange={(e) => setImovelData({ ...imovelData, cartorio_registro: e.target.value })}
                    placeholder="Ex: Cartório de Registro de Imóveis de Taubaté/SP"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Inscrição Cadastral / IPTU
                  </label>
                  <input
                    type="text"
                    value={imovelData.inscricao_municipal || ''}
                    onChange={(e) => setImovelData({ ...imovelData, inscricao_municipal: e.target.value })}
                    placeholder="Código tributário municipal"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={imovelData.tem_escritura ?? true}
                    onChange={(e) => setImovelData({ ...imovelData, tem_escritura: e.target.checked })}
                    className="w-4 h-4 accent-[#226380] rounded"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-900 dark:text-white block">
                      Escritura Pública Registrada
                    </span>
                    <span className="text-xs text-slate-400">
                      Transcrito em nome da entidade provincial BRM
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={imovelData.tem_habite_se ?? true}
                    onChange={(e) => setImovelData({ ...imovelData, tem_habite_se: e.target.checked })}
                    className="w-4 h-4 accent-[#226380] rounded"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-900 dark:text-white block">
                      Habite-se Municipal Expedido
                    </span>
                    <span className="text-xs text-slate-400">
                      Regularidade de ocupação expedida pela Prefeitura
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#226380]" />
                  <span>4. Conformidade Legal, Bombeiros (AVCB) & Seguro</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Número do AVCB / CLCB (Bombeiros)
                  </label>
                  <input
                    type="text"
                    value={imovelData.avcb_numero || ''}
                    onChange={(e) => setImovelData({ ...imovelData, avcb_numero: e.target.value })}
                    placeholder="Ex: SP-BOMB-4412-24"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Vencimento do AVCB
                  </label>
                  <input
                    type="date"
                    value={imovelData.avcb_vencimento || ''}
                    onChange={(e) => setImovelData({ ...imovelData, avcb_vencimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Seguradora Predial
                  </label>
                  <input
                    type="text"
                    value={imovelData.seguro_predial_seguradora || ''}
                    onChange={(e) => setImovelData({ ...imovelData, seguro_predial_seguradora: e.target.value })}
                    placeholder="Ex: Allianz / Porto Seguro"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nº da Apólice Predial
                  </label>
                  <input
                    type="text"
                    value={imovelData.seguro_predial_apolice || ''}
                    onChange={(e) => setImovelData({ ...imovelData, seguro_predial_apolice: e.target.value })}
                    placeholder="Ex: ALLI-CONV-7740"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Vigência Seguro Predial
                  </label>
                  <input
                    type="date"
                    value={imovelData.seguro_predial_vencimento || ''}
                    onChange={(e) => setImovelData({ ...imovelData, seguro_predial_vencimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Valor Venal / Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={imovelData.valor_venal ?? ''}
                    onChange={(e) => setImovelData({ ...imovelData, valor_venal: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 28000000"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Status Operacional
                  </label>
                  <select
                    value={imovelData.status || 'Ativo'}
                    onChange={(e) => setImovelData({ ...imovelData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Ativo">Ativo (Uso Institucional)</option>
                    <option value="Alugado">Alugado para Terceiros</option>
                    <option value="Em Reforma">Em Reforma / Obras</option>
                    <option value="Cedido / Comodato">Cedido / Comodato Pastoral</option>
                    <option value="Inativo">Inativo / Desocupado</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Observações Notariais
                  </label>
                  <input
                    type="text"
                    value={imovelData.observacoes || ''}
                    onChange={(e) => setImovelData({ ...imovelData, observacoes: e.target.value })}
                    placeholder="Histórico, situação canônica ou tombamento..."
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 2: VEICULO                                                          */}
        {/* ========================================================================= */}
        {tipoAtivo === 'veiculo' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#226380]" />
                  <span>1. Dados do Automóvel & Registro DETRAN</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Marca & Modelo <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={veiculoData.marca_modelo || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, marca_modelo: e.target.value })}
                    placeholder="Ex: Toyota Corolla Cross XRE 2.0 Flex"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Placa (Mercosul) <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={veiculoData.placa || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, placa: e.target.value.toUpperCase() })}
                    placeholder="Ex: RXP4E21"
                    maxLength={8}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase tracking-widest outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Categoria do Veículo
                  </label>
                  <select
                    value={veiculoData.tipo || 'Carro'}
                    onChange={(e) => setVeiculoData({ ...veiculoData, tipo: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Carro">Carro de Passeio</option>
                    <option value="Van / Micro-ônibus">Van / Micro-ônibus</option>
                    <option value="Caminhonete / Utilitário">Caminhonete / Utilitário</option>
                    <option value="Moto">Motocicleta</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ano Modelo
                  </label>
                  <input
                    type="number"
                    value={veiculoData.ano_modelo ?? ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, ano_modelo: Number(e.target.value) })}
                    placeholder="2024"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Cor Predominante
                  </label>
                  <input
                    type="text"
                    value={veiculoData.cor || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, cor: e.target.value })}
                    placeholder="Ex: Prata Metálico"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    RENAVAM
                  </label>
                  <input
                    type="text"
                    value={veiculoData.renavam || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, renavam: e.target.value })}
                    placeholder="00000000000"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Chassi
                  </label>
                  <input
                    type="text"
                    value={veiculoData.chassi || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, chassi: e.target.value.toUpperCase() })}
                    placeholder="17 caracteres"
                    maxLength={17}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#226380]" />
                  <span>2. Alocação Provincial, Odômetro & Revisões</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Comunidade Alocada <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="comunidades-veic"
                    value={veiculoData.comunidade_obra || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, comunidade_obra: e.target.value })}
                    placeholder="Ex: Convento SCJ - Taubaté"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                  <datalist id="comunidades-veic">
                    {COMUNIDADES_PREDEFINIDAS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Condutor Responsável
                  </label>
                  <input
                    type="text"
                    value={veiculoData.responsavel_nome || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, responsavel_nome: e.target.value })}
                    placeholder="Ex: Superior Local"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Quilometragem Atual (Km)
                  </label>
                  <input
                    type="number"
                    value={veiculoData.quilometragem_atual ?? ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, quilometragem_atual: Number(e.target.value) })}
                    placeholder="Ex: 38450"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Próxima Revisão (Km)
                  </label>
                  <input
                    type="number"
                    value={veiculoData.proxima_revisao_km ?? ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, proxima_revisao_km: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 40000"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Data Prevista da Revisão
                  </label>
                  <input
                    type="date"
                    value={veiculoData.proxima_revisao_data || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, proxima_revisao_data: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Status na Frota
                  </label>
                  <select
                    value={veiculoData.status || 'Em Uso'}
                    onChange={(e) => setVeiculoData({ ...veiculoData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Em Uso">Em Uso Ativo</option>
                    <option value="Em Manutenção">Em Manutenção</option>
                    <option value="Reserva Provincial">Reserva da Cúria</option>
                    <option value="Disponível para Venda">Disponível para Venda</option>
                    <option value="Baixado">Baixado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#226380]" />
                  <span>3. Seguro Automotivo & IPVA</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Seguradora
                  </label>
                  <input
                    type="text"
                    value={veiculoData.seguro_seguradora || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, seguro_seguradora: e.target.value })}
                    placeholder="Ex: Porto Seguro Auto"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nº da Apólice
                  </label>
                  <input
                    type="text"
                    value={veiculoData.seguro_apolice || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, seguro_apolice: e.target.value })}
                    placeholder="Ex: AUTO-PORTO-98213"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Vencimento do Seguro
                  </label>
                  <input
                    type="date"
                    value={veiculoData.seguro_vencimento || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, seguro_vencimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Emergência (0800)
                  </label>
                  <input
                    type="text"
                    value={veiculoData.seguro_contato_emergencia || ''}
                    onChange={(e) => setVeiculoData({ ...veiculoData, seguro_contato_emergencia: e.target.value })}
                    placeholder="0800 727 0727"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={veiculoData.ipva_pago ?? true}
                    onChange={(e) => setVeiculoData({ ...veiculoData, ipva_pago: e.target.checked })}
                    className="w-4 h-4 accent-[#226380] rounded"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-900 dark:text-white block">
                      IPVA e Licenciamento Anual Quitado
                    </span>
                    <span className="text-xs text-slate-400">
                      Documentação CRLV-e regular perante o DETRAN
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 3: INVENTÁRIO SACRO & BENS                                          */}
        {/* ========================================================================= */}
        {tipoAtivo === 'bem' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#226380]" />
                  <span>1. Tombamento & Catalogação Artística/Litúrgica</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Código de Tombamento <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bemData.codigo_tombamento || ''}
                    onChange={(e) => setBemData({ ...bemData, codigo_tombamento: e.target.value.toUpperCase() })}
                    placeholder="Ex: PAT-BRM-004"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Denominação do Objeto <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bemData.titulo || ''}
                    onChange={(e) => setBemData({ ...bemData, titulo: e.target.value })}
                    placeholder="Ex: Ostensório de Prata com Banho de Ouro (Século XIX)"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Classificação
                  </label>
                  <select
                    value={bemData.categoria || 'Arte Sacra & Liturgia'}
                    onChange={(e) => setBemData({ ...bemData, categoria: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Arte Sacra & Liturgia">Arte Sacra & Liturgia</option>
                    <option value="Equipamento & Tecnologia">Equipamento & TI</option>
                    <option value="Maquinário & Geradores">Maquinário & Geradores</option>
                    <option value="Mobiliário Histórico">Mobiliário Histórico</option>
                    <option value="Instrumento Musical">Órgão / Instrumento</option>
                    <option value="Outro">Outro Bem</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Comunidade Custodiante
                  </label>
                  <input
                    type="text"
                    list="comunidades-bens"
                    value={bemData.comunidade_obra || ''}
                    onChange={(e) => setBemData({ ...bemData, comunidade_obra: e.target.value })}
                    placeholder="Ex: Convento SCJ - Taubaté"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                  <datalist id="comunidades-bens">
                    {COMUNIDADES_PREDEFINIDAS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Localização na Casa
                  </label>
                  <input
                    type="text"
                    value={bemData.localizacao_especifica || ''}
                    onChange={(e) => setBemData({ ...bemData, localizacao_especifica: e.target.value })}
                    placeholder="Ex: Capela Maior - Retábulo"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#226380]" />
                  <span>2. Histórico, Procedência & Valor</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Estado de Conservação
                  </label>
                  <select
                    value={bemData.estado_conservacao || 'Bom'}
                    onChange={(e) => setBemData({ ...bemData, estado_conservacao: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Excelente">Excelente (Sem Danos)</option>
                    <option value="Bom">Bom (Preservado)</option>
                    <option value="Regular">Regular (Desgaste Natural)</option>
                    <option value="Necessita Restauração / Reparo">Necessita Restauração</option>
                    <option value="Danificado">Danificado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ano / Época da Obra
                  </label>
                  <input
                    type="number"
                    value={bemData.ano_aquisicao ?? ''}
                    onChange={(e) => setBemData({ ...bemData, ano_aquisicao: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 1932"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Origem / Procedência
                  </label>
                  <input
                    type="text"
                    value={bemData.origem_procedencia || ''}
                    onChange={(e) => setBemData({ ...bemData, origem_procedencia: e.target.value })}
                    placeholder="Ex: Alemanha / Baviera"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={bemData.valor_estimado ?? ''}
                    onChange={(e) => setBemData({ ...bemData, valor_estimado: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 95000"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Descrição Detalhada & Histórico
                  </label>
                  <textarea
                    rows={3}
                    value={bemData.descricao_detalhada || ''}
                    onChange={(e) => setBemData({ ...bemData, descricao_detalhada: e.target.value })}
                    placeholder="Descreva materiais utilizados, iconografia, histórico e particularidades..."
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 4: CONTRATOS & SEGUROS                                              */}
        {/* ========================================================================= */}
        {tipoAtivo === 'contrato' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#226380]" />
                  <span>1. Objeto do Contrato & Fornecedor</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Título / Objeto do Contrato <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contratoData.titulo || ''}
                    onChange={(e) => setContratoData({ ...contratoData, titulo: e.target.value })}
                    placeholder="Ex: Apólice Multirrisco Patrimonial Predial"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Contrato
                  </label>
                  <select
                    value={contratoData.tipo || 'Seguro Predial Multirrisco'}
                    onChange={(e) => setContratoData({ ...contratoData, tipo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Seguro Predial Multirrisco">Seguro Predial Multirrisco</option>
                    <option value="Seguro Frota Auto">Seguro Frota de Veículos</option>
                    <option value="Manutenção de Elevadores">Manutenção de Elevadores</option>
                    <option value="Prestação de Serviços / TI">Prestação de Serviços / TI</option>
                    <option value="Energia Solar / Locação">Energia Solar / Locação</option>
                    <option value="Arrendamento Rural / Urbano">Arrendamento Rural / Urbano</option>
                    <option value="Outro">Outro Contrato Notarial</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Razão Social / Fornecedor <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contratoData.fornecedor_prestador || ''}
                    onChange={(e) => setContratoData({ ...contratoData, fornecedor_prestador: e.target.value })}
                    placeholder="Ex: Porto Seguro Companhia de Seguros"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      CNPJ / CPF
                    </label>
                    <button
                      type="button"
                      onClick={handleBuscarCnpj}
                      disabled={buscandoCnpj}
                      className="text-[11px] font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {buscandoCnpj ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      <span>{buscandoCnpj ? 'Consultando...' : 'Consultar CNPJ'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={contratoData.cnpj_cpf || ''}
                    onChange={(e) => setContratoData({ ...contratoData, cnpj_cpf: e.target.value })}
                    onBlur={() => {
                      if (contratoData.cnpj_cpf && contratoData.cnpj_cpf.replace(/\D/g, '').length === 14) {
                        handleBuscarCnpj();
                      }
                    }}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#226380]" />
                  <span>2. Prazos de Vigência & Valores Financeiros</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Início de Vigência
                  </label>
                  <input
                    type="date"
                    value={contratoData.data_inicio || ''}
                    onChange={(e) => setContratoData({ ...contratoData, data_inicio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Término de Vigência <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={contratoData.data_fim || ''}
                    onChange={(e) => setContratoData({ ...contratoData, data_fim: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Valor Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={contratoData.valor_mensal ?? ''}
                    onChange={(e) => setContratoData({ ...contratoData, valor_mensal: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="2850.00"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Valor Anual Global (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={contratoData.valor_anual ?? ''}
                    onChange={(e) => setContratoData({ ...contratoData, valor_anual: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="34200.00"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEÇÃO 5: VISTORIAS & OBRAS                                                */}
        {/* ========================================================================= */}
        {tipoAtivo === 'vistoria' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#226380]" />
                  <span>1. Diagnóstico da Vistoria / Ordem de Manutenção</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Título da Intervenção <span className="text-[#80282E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manutencaoData.titulo || ''}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, titulo: e.target.value })}
                    placeholder="Ex: Recarga Anual de Extintores e Laudo de Hidrantes"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tipo de Chamado
                  </label>
                  <select
                    value={manutencaoData.tipo || 'Vistoria Técnica Periódica'}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, tipo: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Vistoria Técnica Periódica">Vistoria Técnica Periódica</option>
                    <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                    <option value="Manutenção Corretiva / Emergencial">Manutenção Corretiva / Emergencial</option>
                    <option value="Reforma / Ampliação">Reforma / Ampliação Predial</option>
                    <option value="Chamado da Comunidade">Chamado da Comunidade</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Comunidade Vinculada
                  </label>
                  <input
                    type="text"
                    list="comunidades-manu"
                    value={manutencaoData.comunidade_obra || ''}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, comunidade_obra: e.target.value })}
                    placeholder="Ex: Casa Padre Dehon - Brusque"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  />
                  <datalist id="comunidades-manu">
                    {COMUNIDADES_PREDEFINIDAS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Prioridade
                  </label>
                  <select
                    value={manutencaoData.prioridade || 'Média'}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, prioridade: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white"
                  >
                    <option value="Baixa">Baixa (Rotina)</option>
                    <option value="Média">Média (Recomendada)</option>
                    <option value="Alta">Alta (Prazos Críticos)</option>
                    <option value="Urgente">Urgente (Risco Estrutural)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manutencaoData.custo_estimado ?? ''}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, custo_estimado: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 3200.00"
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Descrição Detalhada do Laudo / Intervenção <span className="text-[#80282E]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={manutencaoData.descricao || ''}
                    onChange={(e) => setManutencaoData({ ...manutencaoData, descricao: e.target.value })}
                    placeholder="Descreva a vistoria realizada, peças a substituir ou adequações prediais necessárias..."
                    className="w-full px-3.5 py-2.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs outline-none focus:border-[#226380] text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO COMUM: DOCUMENTOS, CERTIDÕES E FOTOS ANEXAS */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Anexos de Documentos, Certidões & Fotos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Anexe documentos comprobatórios, certidões, escrituras, laudos ou fotos da fachada e do bem, indicando o tipo e nome descritivo.
              </p>
            </div>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#226380]/30 bg-[#226380]/5 text-[#113240] dark:text-[#A3C3C7] text-xs font-semibold hover:bg-[#226380]/10 transition-colors cursor-pointer shrink-0">
              {processandoOcr ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#226380]" /> : <FileText className="w-3.5 h-3.5 text-[#226380]" />}
              <span>{processandoOcr ? 'Analisando Documento...' : 'Leitura Notarial Assistida (OCR)'}</span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                disabled={processandoOcr}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessarOcrArquivo(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {ocrResultado && (
            <div className="p-3.5 rounded-[6px] border border-[#226380]/30 bg-[#226380]/5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#113240] dark:text-[#A3C3C7] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                  Protocolo Notarial / Leitura de Dados ({ocrResultado.confianca}% de precisão estimada)
                </span>
                <button
                  type="button"
                  onClick={() => setOcrResultado(null)}
                  className="text-[11px] text-[#226380] dark:text-[#A3C3C7] hover:underline cursor-pointer"
                >
                  Dispensar
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Os campos do formulário foram pré-preenchidos com base nos dados notariais e cadastrais identificados no documento oficial.
              </p>
            </div>
          )}

          <PatrimonioAnexosManager
            anexos={anexosAtuais}
            onChange={setAnexosAtuais}
            tipoPatrimonio={tipoAtivo}
          />
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/patrimonio')}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer rounded-[6px]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Registrando...' : isEditing ? 'Salvar Alterações' : 'Concluir Lançamento'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatrimonioForm;
