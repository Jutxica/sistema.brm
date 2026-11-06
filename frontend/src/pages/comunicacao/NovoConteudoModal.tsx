import React, { useState, useEffect } from 'react';
import { X, Calendar, Layers, Image as ImageIcon, Send, Sparkles, MapPin, User, Users } from 'lucide-react';
import type { 
  AreaPauta, 
  FormatoConteudo, 
  ComunicacaoPauta, 
  ComunicacaoPost,
  ObraResumoComunicacao,
  ReligiosoConteudo,
  ComunicacaoEmailEquipe
} from '../../types/comunicacao';

interface NovoConteudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoInicial?: 'pauta' | 'post';
  dataInicial?: string;
  religiosoInicial?: ReligiosoConteudo | null;
  obras?: ObraResumoComunicacao[];
  religiosos?: ReligiosoConteudo[];
  equipe?: ComunicacaoEmailEquipe[];
  onPautaCriada: (pauta: Partial<ComunicacaoPauta>) => void;
  onPostCriado: (post: Partial<ComunicacaoPost>) => void;
}

export const NovoConteudoModal: React.FC<NovoConteudoModalProps> = ({
  isOpen,
  onClose,
  tipoInicial = 'post',
  dataInicial,
  religiosoInicial,
  obras = [],
  religiosos = [],
  equipe = [],
  onPautaCriada,
  onPostCriado
}) => {
  const [tipo, setTipo] = useState<'pauta' | 'post'>(tipoInicial);
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState<AreaPauta>('Institucional');
  const [formato, setFormato] = useState<FormatoConteudo>('Carrossel');
  const [canais, setCanais] = useState<string[]>(['Instagram']);
  const [legenda, setLegenda] = useState('');
  const [hashtags, setHashtags] = useState('#DehonianosBRM #VidaConsagrada');
  const [dataCronograma, setDataCronograma] = useState(dataInicial || new Date().toISOString().split('T')[0]);
  const [horario, setHorario] = useState('15:00');
  const [responsavelNome, setResponsavelNome] = useState(equipe[0]?.nome || 'Talita');
  const [obraId, setObraId] = useState<string>('');
  const [religiosoId, setReligiosoId] = useState<string>(religiosoInicial?.id || '');

  useEffect(() => {
    if (dataInicial) {
      setDataCronograma(dataInicial);
    }
  }, [dataInicial]);

  useEffect(() => {
    if (religiosoInicial) {
      setReligiosoId(religiosoInicial.id);
      setTitulo(`Homenagem: ${religiosoInicial.nome_religioso}`);
      setLegenda(`Hoje rendemos graças a Deus pela vida e vocação do ${religiosoInicial.nome_religioso}, ${religiosoInicial.cargo_funcao || 'religioso dehoniano'} na ${religiosoInicial.obra_atual_nome || 'Província BRM'}.\n\nLema: "${religiosoInicial.lema_destacado || 'Sint unum'}"\n\nDeixe nos comentários a sua oração e felicitações!`);
    }
  }, [religiosoInicial]);

  if (!isOpen) return null;

  const toggleCanal = (c: string) => {
    setCanais(prev => prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const obraEscolhida = obras.find(o => o.id === obraId);
    const relEscolhido = religiosos.find(r => r.id === religiosoId);

    if (tipo === 'pauta') {
      onPautaCriada({
        titulo,
        area,
        formato,
        status: 'ideia',
        prioridade: 'media',
        canais,
        obra_id: obraId || null,
        obra_nome: obraEscolhida?.nome || null,
        religioso_id: religiosoId || null,
        religioso_nome: relEscolhido?.nome_religioso || null,
        criado_por_nome: responsavelNome,
        data_prevista: dataCronograma ? `${dataCronograma}T${horario}:00Z` : null
      });
    } else {
      onPostCriado({
        titulo,
        area,
        formato,
        canais,
        legenda,
        hashtags,
        status: 'em_producao',
        arte_entregue: false,
        texto_entregue: Boolean(legenda.trim()),
        obra_id: obraId || null,
        obra_nome: obraEscolhida?.nome || null,
        religioso_id: religiosoId || null,
        religioso_nome: relEscolhido?.nome_religioso || null,
        data_cronograma: dataCronograma ? `${dataCronograma}T${horario}:00Z` : null,
        horario_agendado: horario,
        melhor_horario_sugerido: '15h-18h',
        arquivos_arte: relEscolhido?.foto_url ? [{ id: `art-${Date.now()}`, url: relEscolhido.foto_url, nome: `foto_${relEscolhido.nome_religioso}.jpg`, tipo: 'imagem', ordem: 1 }] : []
      });
    }

    onClose();
    setTitulo('');
    setLegenda('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c]">
          <div>
            <h2 className="text-base font-semibold text-[#113240] dark:text-white">
              {tipo === 'pauta' ? 'Nova Ideia no Banco de Pautas' : 'Novo Conteúdo para Produção'}
            </h2>
            <p className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
              Conectado ao banco de religiosos, obras e paróquias da Província BRM.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#e8f1f5] dark:bg-white/10 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setTipo('post')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tipo === 'post' 
                    ? 'bg-white dark:bg-[#226380] text-[#113240] dark:text-white font-semibold' 
                    : 'text-[#66777b] dark:text-[#a0aeaf]'
                }`}
              >
                Post
              </button>
              <button
                type="button"
                onClick={() => setTipo('pauta')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tipo === 'pauta' 
                    ? 'bg-white dark:bg-[#226380] text-[#113240] dark:text-white font-semibold' 
                    : 'text-[#66777b] dark:text-[#a0aeaf]'
                }`}
              >
                Pauta
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Título Principal */}
          <div>
            <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1">
              Título ou Tema do Conteúdo *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Homenagem pelos 25 anos de sacerdócio do Pe. André"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
            />
          </div>

          {/* Vínculo Real com o Banco: Obra / Paróquia & Religioso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#226380]" />
                <span>Lugar / Paróquia / Obra vinculada</span>
              </label>
              <select
                value={obraId}
                onChange={e => setObraId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              >
                <option value="">Selecione uma paróquia ou obra (opcional)...</option>
                {obras.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.nome} ({o.cidade || 'BRM'}/{o.uf || 'SC'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#226380]" />
                <span>Religioso vinculado</span>
              </label>
              <select
                value={religiosoId}
                onChange={e => setReligiosoId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              >
                <option value="">Nenhum religioso específico (institucional geral)</option>
                {religiosos.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nome_religioso} ({r.cargo_funcao || r.grau})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área e Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1">
                Área temática
              </label>
              <select
                value={area}
                onChange={e => setArea(e.target.value as AreaPauta)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              >
                <option value="Institucional">Institucional</option>
                <option value="Vocacional">Vocacional</option>
                <option value="Paróquias">Paróquias e Obras</option>
                <option value="Espiritualidade">Espiritualidade Dehoniana</option>
                <option value="Formação">Formação e Juventude</option>
                <option value="Obras Sociais">Obras Sociais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1">
                Formato do conteúdo
              </label>
              <select
                value={formato}
                onChange={e => setFormato(e.target.value as FormatoConteudo)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              >
                <option value="Carrossel">Carrossel (Instagram)</option>
                <option value="Reels">Reels / Shorts (Vertical)</option>
                <option value="Post">Post Imagem Única</option>
                <option value="Story">Story Informativo</option>
                <option value="Vídeo Longo">Vídeo Longo (YouTube)</option>
                <option value="Site">Artigo / Notícia no Site</option>
              </select>
            </div>
          </div>

          {/* Responsável da Equipe & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#226380]" />
                <span>Responsável</span>
              </label>
              <select
                value={responsavelNome}
                onChange={e => setResponsavelNome(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              >
                {equipe.length > 0 ? (
                  equipe.map(eq => (
                    <option key={eq.id} value={eq.nome}>
                      {eq.nome} ({eq.cargo})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Talita">Talita (Coordenação)</option>
                    <option value="Kath">Kath (Design & Vídeo)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1">
                Data prevista / agendada
              </label>
              <input
                type="date"
                value={dataCronograma}
                onChange={e => setDataCronograma(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1">
                Horário previsto
              </label>
              <input
                type="time"
                value={horario}
                onChange={e => setHorario(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              />
            </div>
          </div>

          {/* Legenda do Post (apenas para modo post) */}
          {tipo === 'post' && (
            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1">
                Texto / Legenda inicial
              </label>
              <textarea
                rows={3}
                value={legenda}
                onChange={e => setLegenda(e.target.value)}
                placeholder="Insira o texto que acompanhará a publicação nas redes sociais..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:border-[#226380]"
              />
            </div>
          )}

          {/* Canais */}
          <div>
            <label className="block text-xs font-semibold text-[#113240] dark:text-white mb-1.5">
              Canais de Publicação
            </label>
            <div className="flex flex-wrap gap-2">
              {['Instagram', 'Facebook', 'YouTube', 'Site Oficial', 'WhatsApp / Boletim'].map(c => {
                const ativo = canais.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCanal(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      ativo
                        ? 'bg-[#113240] text-white border-[#113240]'
                        : 'bg-white dark:bg-[#1c2427] text-[#52636a] dark:text-[#a0aeaf] border-[#dce4e2] dark:border-[#354246]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Ações */}
          <div className="pt-4 border-t border-[#dce4e2] dark:border-[#354246] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white text-xs font-semibold transition-colors"
            >
              {tipo === 'pauta' ? 'Salvar Pauta' : 'Criar Conteúdo em Produção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
