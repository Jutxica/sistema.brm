import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { confirmAction, showToast } from '../hooks/useFeedback';
import { 
  FileSpreadsheet, 
  Loader2, 
  Pencil, 
  Search, 
  Trash2, 
  Upload, 
  X, 
  Plus, 
  Church, 
  Home, 
  Landmark,
  CheckCircle2,
  Layers,
  Download,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Globe,
  ExternalLink,
  MapPin,
  Link2,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Obra { 
  id: string; 
  nome: string; 
  tipo: string; 
  localidade: string | null; 
  uf: string | null; 
  email: string | null; 
  telefone: string | null; 
  whatsapp: string | null; 
  diocese: string | null; 
  fundacao: string | null; 
  assumida_pelos_dehonianos: string | null; 
  endereco: string | null; 
  instagram: string | null; 
  facebook: string | null; 
  youtube: string | null; 
  site: string | null; 
  status: string;
  token_edicao?: string | null;
  historia?: string | null;
  resumo_historico?: string | null;
  fotos?: any[] | null;
  status_historia?: string | null;
  data_envio_historia?: string | null;
}

const tipoOptions = ['Paróquia', 'Casa', 'Obra'];

const parseDateValue = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    return null;
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;

    const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const dateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (dateMatch) {
      const [, first, second, year] = dateMatch;
      const month = Number(first);
      const day = Number(second);
      const fullYear = Number(year.length === 2 ? `20${year}` : year);
      if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(fullYear)) return null;
      return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }

    return null;
  }

  const asString = String(value).trim();
  if (!asString) return null;
  const parsed = new Date(asString);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const normalize = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');
const normalizeMarker = (value: unknown) => normalize(value).toLocaleUpperCase().replace(/[^A-ZÀ-Ú]/g, '');

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const formatDateBR = (val?: string | null): string | null => {
  if (!val) return null;
  const raw = val.slice(0, 10);
  const parts = raw.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return raw;
};

const cleanDigits = (phone?: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const getWhatsAppUrl = (wpp: string) => {
  const digits = cleanDigits(wpp);
  if (!digits) return '';
  const fullNumber = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
  return `https://wa.me/${fullNumber}`;
};

const cleanWebUrl = (url: string) => {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const extractContacts = (item: Obra) => {
  let tel = item.telefone || '';
  let wpp = item.whatsapp || '';

  if (tel.includes('| Whats:')) {
    const parts = tel.split('| Whats:');
    tel = parts[0]?.trim() || '';
    if (!wpp) wpp = parts[1]?.trim() || '';
  } else if (tel.includes('Whats:')) {
    const parts = tel.split('Whats:');
    tel = parts[0]?.trim() || '';
    if (!wpp) wpp = parts[1]?.trim() || '';
  }

  // Garantia para todos os registros atuais e futuros: se não houver WhatsApp explícito, utiliza o telefone
  if ((!wpp || wpp.trim() === '-' || wpp.trim() === '') && tel) {
    wpp = tel;
  }

  return {
    email: item.email?.trim() || null,
    telefone: tel.trim() || null,
    whatsapp: (wpp && wpp.trim() !== '-') ? wpp.trim() : null,
  };
};

export const ObrasAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Obra[]>([]);
  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [ufFilter, setUfFilter] = useState('Todos');
  const [cidadeFilter, setCidadeFilter] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Estado do Modal de Link Mágico
  const [magicModalObra, setMagicModalObra] = useState<Obra | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getMagicLink = (obra: Obra) => {
    const token = obra.token_edicao;
    if (!token) return null;
    const origin = window.location.origin;
    return `${origin}/atualizar-obra/${token}`;
  };

  const handleCopyMagicLink = (obra: Obra) => {
    const link = getMagicLink(obra);
    if (!link) {
      setMessage('Esta instituição ainda não tem token de link mágico. Atualize o registro após aplicar a migração de segurança.');
      return;
    }
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendWhatsAppMagicLink = (obra: Obra) => {
    const contacts = extractContacts(obra);
    const rawNumber = contacts.whatsapp || contacts.telefone;
    if (!rawNumber) {
      showToast.warning('Esta paróquia ou obra não possui telefone ou WhatsApp cadastrado.');
      return;
    }

    const link = getMagicLink(obra);
    if (!link) {
      showToast.error('Esta instituição ainda não tem token de link mágico. Aplique a migração de segurança e atualize o registro.');
      return;
    }
    const msg = `Olá! Saudações fraternas da Província BRM dos Padres Dehonianos.\n\nEstamos reunindo o acervo histórico e fotográfico oficial das nossas paróquias e obras.\n\nPor gentileza, revisem os dados cadastrais, preencham a história da comunidade e anexem as 6 fotos da igreja através do nosso link seguro e exclusivo:\n${link}\n\nFraternalmente,\nSecretaria Provincial • Província BRM`;

    const digits = cleanDigits(rawNumber);
    const fullNumber = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Sincronizar parâmetros de busca da URL (acionados pelo menu lateral ou abas)
  useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo) {
      const lower = tipo.toLowerCase();
      if (lower === 'paroquia' || lower === 'paróquia') {
        setTipoFilter('Paróquia');
      } else if (lower === 'casa') {
        setTipoFilter('Casa');
      } else if (lower === 'obra') {
        setTipoFilter('Obra');
      }
    } else {
      setTipoFilter('Todos');
    }

    if (searchParams.get('novo') === 'true') {
      navigate('/obras/nova', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSelectTipo = (tipo: string) => {
    setTipoFilter(tipo);
    const params = new URLSearchParams(searchParams);
    if (tipo === 'Todos') {
      params.delete('tipo');
    } else {
      params.set('tipo', tipo === 'Paróquia' ? 'Paroquia' : tipo);
    }
    setSearchParams(params);
  };

  const load = async () => { 
    setLoading(true); 
    const { data, error } = await supabase.from('religiosos_obras_referencia').select('*').order('nome'); 
    if (error) setMessage(error.message); 
    setItems((data || []) as Obra[]); 
    setLoading(false); 
  };
  
  useEffect(() => { load(); }, []);

  const uniqueUfs = useMemo(
    () => Array.from(new Set(items.map(item => item.uf).filter((value): value is string => Boolean(value)))).sort(),
    [items]
  );
  const uniqueCidades = useMemo(
    () => Array.from(new Set(items.map(item => item.localidade).filter((value): value is string => Boolean(value)))).sort(),
    [items]
  );

  const filtered = useMemo(() => items.filter(item => {
    const matchesText = [item.nome, item.tipo, item.localidade, item.uf, item.diocese].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase());
    const matchesTipo = tipoFilter === 'Todos' || item.tipo === tipoFilter;
    const matchesUf = ufFilter === 'Todos' || item.uf === ufFilter;
    const matchesCidade = cidadeFilter === 'Todos' || item.localidade === cidadeFilter;
    return matchesText && matchesTipo && matchesUf && matchesCidade;
  }), [items, query, tipoFilter, ufFilter, cidadeFilter]);


  const downloadTemplate = () => {
    const templateData = [
      [
        'Tipo (Paróquia / Casa / Obra)',
        'Nome da Instituição',
        'Cidade / Localidade',
        'UF',
        'E-mail',
        'Telefone',
        'WhatsApp',
        'Diocese',
        'Data Fundação (DD/MM/AAAA)',
        'Data Assumida (DD/MM/AAAA)',
        'Endereço Completo',
        'Instagram',
        'Facebook',
        'YouTube',
        'Site Oficial'
      ],
      [
        'Paróquia',
        'Santuário Santa Rita de Cássia',
        'Curitiba',
        'PR',
        'contato@santuariosantaritadecassia.com.br',
        '(41) 3276-2075',
        '(41) 98778-1840',
        'Arquidiocese de Curitiba',
        '22/05/1960',
        '',
        'R. Padre Dehon, 728 - Hauer | Curitiba-PR, 81630-090',
        'https://instagram.com/santaritacuritiba',
        'https://facebook.com/santaritacuritiba',
        'https://youtube.com/@tvdasrosas',
        'https://santuariosantaritadecassia.com.br'
      ],
      [
        'Casa',
        'Convento Sagrado Coração de Jesus',
        'Brusque',
        'SC',
        'cscj@brm.org.br',
        '(47) 3351-1404',
        '(47) 3351-1404',
        '',
        '03/06/1924',
        '',
        'R. Padre Leon Dehon, 50 - Centro | Brusque-SC, 88350-365',
        'https://instagram.com/conventoscj',
        'https://facebook.com/conventosagradocoracaodejesus',
        'https://youtube.com/@ConventoSagradoCoracaodeJesus',
        ''
      ],
      [
        'Obra',
        'Seminário SCJ',
        'Corupá',
        'SC',
        'gerenteseminario@gmail.com',
        '(47) 3375-1194',
        '(47) 3375-1194',
        '',
        '17/01/1932',
        '',
        'Rua Padre Gabriel Lux, 900, Seminário | Corupá-SC, 89278-000',
        'https://instagram.com/seminario.scj',
        'https://facebook.com/seminarioscj',
        '',
        ''
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Importação');
    XLSX.writeFile(wb, 'modelo_importacao_obras_brm.xlsx');
  };

  const importWorkbook = async (file: File) => {
    setImporting(true); 
    setMessage(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('A planilha está vazia ou em formato inválido.');

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      if (!rows || rows.length === 0) throw new Error('A planilha não contém linhas de dados.');

      let currentTipo = 'Paróquia';
      const records: Record<string, string | null>[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        const values = row.map(normalize);

        if (!values.length || values.every(v => !v)) continue;

        // Detectar seções de categoria (Paróquias, Casas, Obras)
        const val0 = normalizeMarker(values[0]);
        const val1 = normalizeMarker(values[1]);

        if (val1 === 'PAROQUIA' || val1 === 'PAROQUIAS' || val0 === 'PAROQUIAS') {
          currentTipo = 'Paróquia';
          continue;
        }
        if (val1 === 'CASA' || val1 === 'CASAS' || val1.includes('CASADEFORMACAO') || val1.includes('CASASDEFORMACAO')) {
          currentTipo = 'Casa';
          continue;
        }
        if (val1 === 'OBRA' || val1 === 'OBRAS') {
          currentTipo = 'Obra';
          continue;
        }

        // Ignorar linhas de cabeçalho
        const ufCandidate = values[3]?.toUpperCase();
        if (
          values[1]?.toUpperCase() === 'PARÓQUIA' || 
          values[1]?.toUpperCase() === 'PAROQUIA' || 
          values[1]?.toUpperCase() === 'NOME' ||
          values[1]?.toUpperCase() === 'INSTITUIÇÃO' ||
          ufCandidate === 'UF' ||
          ufCandidate === 'ESTADO'
        ) {
          continue;
        }

        // Mapeamento flexível das colunas (formato oficial BRM ou formato simples)
        let nome = values[1];
        let cidade = values[2];
        let uf = values[3]?.toUpperCase();
        let email = values[4] || null;
        let tel = values[5] || null;
        let wpp = values[6] || null;
        let diocese = values[7] || null;
        let fundacao = parseDateValue(row[8]) || null;
        let assumida = parseDateValue(row[9]) || null;
        let endereco = values[10] || null;
        let instagram = values[11] || null;
        let facebook = values[12] || null;
        let youtube = values[13] || null;
        let site = values[14] || null;
        let rowTipo = currentTipo;

        // Se a coluna 0 tiver o tipo explícito
        if (['PARÓQUIA', 'PAROQUIA', 'CASA', 'OBRA'].includes(values[0]?.toUpperCase())) {
          rowTipo = values[0].toLowerCase().includes('casa') ? 'Casa' : (values[0].toLowerCase().includes('obra') ? 'Obra' : 'Paróquia');
        }

        // Se a coluna 0 for o Nome (quando a planilha não tem coluna de índice A)
        if (values[0] && values[2]?.length === 2 && !uf) {
          nome = values[0];
          cidade = values[1];
          uf = values[2].toUpperCase();
          email = values[3] || null;
          tel = values[4] || null;
          wpp = values[5] || null;
          diocese = values[6] || null;
          fundacao = parseDateValue(row[7]) || null;
          assumida = parseDateValue(row[8]) || null;
          endereco = values[9] || null;
        }

        if (!nome || !cidade || !uf || uf.length !== 2) continue;

        // Categorização inteligente das Casas e Obras clássicas
        const nomeUpper = nome.toUpperCase();
        if (nomeUpper.includes('SEMINÁRIO SÃO JOSÉ') || nomeUpper.includes('CONVENTO') || nomeUpper.includes('NOVICIADO')) {
          rowTipo = 'Casa';
        } else if (nomeUpper.includes('SEMINÁRIO SCJ') || nomeUpper.includes('CASA PADRE DEHON')) {
          rowTipo = 'Obra';
        }

        // Mesclar WhatsApp com Telefone para não perder dados nem violar colunas
        const wppFinal = (wpp && wpp !== '-') ? wpp : (tel || null);
        const telefoneFinal = tel && wpp && tel !== wpp && wpp !== '-'
          ? `${tel} | Whats: ${wpp}`
          : (tel || wppFinal);

        records.push({
          nome,
          tipo: rowTipo,
          cidade,
          localidade: cidade,
          uf,
          email,
          telefone: telefoneFinal,
          whatsapp: wppFinal,
          diocese,
          fundacao,
          assumida_pelos_dehonianos: assumida,
          endereco,
          instagram,
          facebook,
          youtube,
          site,
          status: 'Ativa'
        });
      }

      if (!records.length) {
        throw new Error('Nenhum registro válido foi encontrado. Verifique se a planilha possui as colunas Nome, Cidade e UF (sigla de 2 letras).');
      }

      const { error } = await supabase
        .from('religiosos_obras_referencia')
        .upsert(records, { onConflict: 'nome,localidade,uf' });

      if (error) throw error;

      const paroquiasCount = records.filter(r => r.tipo === 'Paróquia').length;
      const casasCount = records.filter(r => r.tipo === 'Casa').length;
      const obrasCount = records.filter(r => r.tipo === 'Obra').length;

      setMessage(`${records.length} instituições sincronizadas com sucesso! (${paroquiasCount} Paróquias, ${casasCount} Casas, ${obrasCount} Obras)`);
      await load();
    } catch (error) {
      console.error('Erro na importação da planilha:', error);
      setMessage(error instanceof Error ? error.message : 'Não foi possível importar a planilha.');
    } finally {
      setImporting(false);
    }
  };


  const remove = async (item: Obra) => { 
    const confirmed = await confirmAction({
      title: 'Excluir Obra ou Paróquia',
      badge: 'Patrimônio Provincial • Exclusão',
      message: `Excluir permanentemente "${item.nome}"?`,
      detail: 'O registro da obra/paróquia e seus vínculos referenciais serão removidos.',
      confirmLabel: 'Excluir Obra',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    const { error } = await supabase.from('religiosos_obras_referencia').delete().eq('id', item.id); 
    if (error) {
      setMessage(error.message);
      showToast.error(`Erro ao excluir: ${error.message}`);
    } else {
      showToast.success(`"${item.nome}" excluída com sucesso.`);
      load(); 
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'paróquia': return <Church className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'casa': return <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default: return <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getTipoBadgeClass = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'paróquia': return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
      case 'casa': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION - Reto & Limpo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 font-cinzel">
            Base Institucional • Província BRM
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-cinzel">
            Paróquias, Casas e Obras
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Base cadastral unificada para o secretariado provincial e cadastros públicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            title="Baixar modelo de planilha pré-formatada para preenchimento"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Baixar Modelo</span>
          </button>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{importing ? 'Importando...' : 'Importar Planilha'}</span>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              disabled={importing} 
              onChange={event => { 
                const file = event.target.files?.[0]; 
                if (file) importWorkbook(file); 
                event.currentTarget.value = ''; 
              }} 
            />
          </label>

          <button
            type="button"
            onClick={() => navigate('/obras/nova')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Obra</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION MESSAGE */}
      {message && (
        <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs font-medium text-sky-800 dark:text-sky-300">
          <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-sky-600 hover:text-sky-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'Todos', label: 'Todas as Obras', icon: Layers },
          { key: 'Paróquia', label: 'Paróquias', icon: Church },
          { key: 'Casa', label: 'Casas Religiosas', icon: Home },
          { key: 'Obra', label: 'Obras & Institutos', icon: Landmark },
        ].map((tab) => {
          const active = tipoFilter === tab.key;
          const count = tab.key === 'Todos' ? items.length : items.filter(i => i.tipo === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelectTipo(tab.key)}
              className={`px-3.5 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors border ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold border ${
                active
                  ? 'border-white/30 text-white dark:border-slate-900/30 dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-3 grid gap-2.5 md:grid-cols-[1.5fr_1fr_0.8fr_1fr] items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            value={query} 
            onChange={event => setQuery(event.target.value)} 
            placeholder="Buscar por nome, localidade, UF ou diocese..." 
            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] pl-9 pr-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100" 
          />
        </div>

        <select 
          value={tipoFilter} 
          onChange={event => setTipoFilter(event.target.value)} 
          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] py-2 px-3 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100 cursor-pointer"
        >
          <option value="Todos">Tipo: Todos</option>
          {tipoOptions.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>

        <select 
          value={ufFilter} 
          onChange={event => setUfFilter(event.target.value)} 
          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] py-2 px-3 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100 cursor-pointer"
        >
          <option value="Todos">UF: Todas</option>
          {uniqueUfs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>

        <select 
          value={cidadeFilter} 
          onChange={event => setCidadeFilter(event.target.value)} 
          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] py-2 px-3 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100 cursor-pointer"
        >
          <option value="Todos">Cidade: Todas</option>
          {uniqueCidades.map(cidade => <option key={cidade} value={cidade}>{cidade}</option>)}
        </select>
      </div>

      {/* DATA TABLE */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Instituição & Localidade</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Contatos & WhatsApp</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fundação</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Canais & Redes</th>
              <th className="p-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(item => {
              const contacts = extractContacts(item);
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Instituição, Tipo, Diocese, Endereço */}
                  <td className="p-3 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 mt-0.5">
                        {getTipoIcon(item.tipo)}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13px] leading-snug">
                            {item.nome}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border ${getTipoBadgeClass(item.tipo)}`}>
                            {item.tipo}
                          </span>
                          {item.status_historia === 'Preenchido pela Paróquia' || item.status_historia === 'Aprovado' ? (
                            <span 
                              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] font-mono border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                              title="A paróquia já enviou a história e as fotos"
                            >
                              <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400"></span>
                              História Enviada
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] font-mono border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40"
                              title="Aguardando a paróquia enviar a história e 6 fotos"
                            >
                              <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600"></span>
                              História Pendente
                            </span>
                          )}
                        </div>
                        {item.diocese && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            {item.diocese}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{item.localidade || '—'}{item.uf ? ` • ${item.uf}` : ''}</span>
                        </div>
                        {item.endereco && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug" title={item.endereco}>
                            {item.endereco}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contatos & WhatsApp */}
                  <td className="p-3 align-top">
                    {contacts.whatsapp || contacts.telefone || contacts.email ? (
                      <div className="flex flex-col gap-1 text-[11px]">
                        {contacts.whatsapp && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getWhatsAppUrl(contacts.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Abrir conversa no WhatsApp: ${contacts.whatsapp}`}
                              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors w-fit"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 text-[#25D366]" />
                              <span className="font-mono">{contacts.whatsapp}</span>
                            </a>
                            {contacts.telefone === contacts.whatsapp && (
                              <a
                                href={`tel:${cleanDigits(contacts.telefone)}`}
                                title={`Ligar para o telefone: ${contacts.telefone}`}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}
                        {contacts.telefone && contacts.telefone !== contacts.whatsapp && (
                          <a
                            href={`tel:${cleanDigits(contacts.telefone)}`}
                            title={`Ligar: ${contacts.telefone}`}
                            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono transition-colors w-fit"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>{contacts.telefone}</span>
                          </a>
                        )}
                        {contacts.email && (
                          <a
                            href={`mailto:${contacts.email}`}
                            title={`Enviar e-mail: ${contacts.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 truncate max-w-[200px] transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{contacts.email}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Fundação */}
                  <td className="p-3 align-top text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {item.fundacao ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateBR(item.fundacao)}</span>
                        </div>
                        {item.assumida_pelos_dehonianos && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block pl-5">
                            SCJ: {formatDateBR(item.assumida_pelos_dehonianos)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Canais & Redes */}
                  <td className="p-3 align-top">
                    <div className="flex items-center gap-1.5">
                      {item.site && (
                        <a
                          href={cleanWebUrl(item.site)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Site Oficial: ${item.site}`}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {item.instagram && (
                        <a
                          href={cleanWebUrl(item.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Instagram: ${item.instagram}`}
                          className="w-7 h-7 flex items-center justify-center border border-pink-200 dark:border-pink-900/60 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 transition-colors cursor-pointer"
                        >
                          <InstagramIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {item.facebook && (
                        <a
                          href={cleanWebUrl(item.facebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Facebook: ${item.facebook}`}
                          className="w-7 h-7 flex items-center justify-center border border-blue-200 dark:border-blue-900/60 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                        >
                          <FacebookIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {item.youtube && (
                        <a
                          href={cleanWebUrl(item.youtube)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`YouTube: ${item.youtube}`}
                          className="w-7 h-7 flex items-center justify-center border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          <YoutubeIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {!item.site && !item.instagram && !item.facebook && !item.youtube && (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="p-3 align-top text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        title="Link de Inscrição e Memória para a Paróquia"
                        onClick={() => setMagicModalObra(item)}
                        className="h-7 px-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="hidden sm:inline">Inscrição</span>
                      </button>
                      <button 
                        title="Editar" 
                        onClick={() => navigate(`/obras/editar/${item.id}`)} 
                        className="w-7 h-7 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        title="Excluir" 
                        onClick={() => remove(item)} 
                        className="w-7 h-7 border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
            <p className="mt-2 text-xs text-slate-400 font-medium">Carregando catálogo...</p>
          </div>
        )}

        {!filtered.length && !loading && (
          <div className="py-16 text-center text-slate-400">
            <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum registro encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou importe uma nova planilha Excel.</p>
          </div>
        )}
      </div>

      {/* MODAL LINK DE INSCRIÇÃO E MEMÓRIA */}
      {magicModalObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-cinzel">
                    Formulário de Inscrição e Memória • {magicModalObra.tipo}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight font-cinzel">
                    {magicModalObra.nome}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMagicModalObra(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Este link permite que a secretaria ou pároco acesse diretamente o formulário oficial para conferir dados cadastrais, redigir a memória histórica e enviar as <strong>6 fotografias oficiais da igreja</strong> para o acervo provincial.
              </p>
            </div>

            {/* Input do link com botão de cópia */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Link de Acesso Exclusivo:
              </label>
              <div className="flex items-stretch border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                <input
                  type="text"
                  readOnly
                  value={getMagicLink(magicModalObra) || ''}
                  className="w-full px-3 py-2 text-xs font-mono bg-transparent outline-none text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => handleCopyMagicLink(magicModalObra)}
                  className="px-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-black dark:hover:bg-slate-200 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Ações Rápidas de Disparo */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSendWhatsAppMagicLink(magicModalObra)}
                className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 p-3 text-left transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                    Enviar no WhatsApp
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Abre mensagem formatada
                  </span>
                </div>
              </button>

              <a
                href={getMagicLink(magicModalObra) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 p-3 text-left transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Abrir Formulário
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Visualizar em nova aba
                  </span>
                </div>
              </a>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setMagicModalObra(null)}
                className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObrasAdmin;
