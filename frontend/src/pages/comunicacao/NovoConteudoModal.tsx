import React, { useState } from 'react';
import { X, Calendar, Layers, Image as ImageIcon, Send, Sparkles } from 'lucide-react';
import type { AreaPauta, FormatoConteudo, ComunicacaoPauta, ComunicacaoPost } from '../../types/comunicacao';

interface NovoConteudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoInicial?: 'pauta' | 'post';
  dataInicial?: string;
  onPautaCriada: (pauta: Partial<ComunicacaoPauta>) => void;
  onPostCriado: (post: Partial<ComunicacaoPost>) => void;
}

export const NovoConteudoModal: React.FC<NovoConteudoModalProps> = ({
  isOpen,
  onClose,
  tipoInicial = 'post',
  dataInicial,
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
  const [responsavelNome, setResponsavelNome] = useState('Talita');

  if (!isOpen) return null;

  const toggleCanal = (c: string) => {
    setCanais(prev => prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    if (tipo === 'pauta') {
      onPautaCriada({
        titulo,
        area,
        formato,
        status: 'ideia',
        prioridade: 'media',
        canais,
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
        data_cronograma: dataCronograma ? `${dataCronograma}T${horario}:00Z` : null,
        horario_agendado: horario,
        melhor_horario_sugerido: '15h-18h',
        arquivos_arte: []
      });
    }

    onClose();
    setTitulo('');
    setLegenda('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c2427] border border-[#dce4e2] dark:border-[#354246] rounded-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce4e2] dark:border-[#354246] bg-[#f8faf9] dark:bg-[#141a1c]">
          <div>
            <h2 className="text-base font-semibold text-[#113240] dark:text-white">
              {tipo === 'pauta' ? 'Nova Ideia no Banco de Pautas' : 'Novo Conteúdo para Produção'}
            </h2>
            <p className="text-xs text-[#66777b] dark:text-[#a0aeaf]">
              Centralize informações para alinhamento entre redação, design e aprovação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Pauta / Post */}
            <div className="flex bg-[#e8f1f5] dark:bg-white/10 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setTipo('post')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tipo === 'post' 
                    ? 'bg-white dark:bg-[#226380] text-[#113240] dark:text-white' 
                    : 'text-[#66777b] dark:text-[#a0aeaf]'
                }`}
              >
                Conteúdo
              </button>
              <button
                type="button"
                onClick={() => setTipo('pauta')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tipo === 'pauta' 
                    ? 'bg-white dark:bg-[#226380] text-[#113240] dark:text-white' 
                    : 'text-[#66777b] dark:text-[#a0aeaf]'
                }`}
              >
                Pauta
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
              Título da Pauta / Conteúdo *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex.: Jubileu de 25 anos de sacerdócio do Pe. Marcos"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
                Área / Tema
              </label>
              <select
                value={area}
                onChange={e => setArea(e.target.value as AreaPauta)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
              >
                <option value="Institucional">Institucional</option>
                <option value="Vocacional">Vocacional</option>
                <option value="Paróquias">Paróquias</option>
                <option value="Formação">Formação</option>
                <option value="Espiritualidade">Espiritualidade</option>
                <option value="Obras Sociais">Obras Sociais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
                Formato
              </label>
              <select
                value={formato}
                onChange={e => setFormato(e.target.value as FormatoConteudo)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
              >
                <option value="Carrossel">Carrossel (Instagram)</option>
                <option value="Reels">Reels / Shorts (Vídeo)</option>
                <option value="Post">Post Único (Feed)</option>
                <option value="Story">Story</option>
                <option value="Site">Matéria do Site Oficial</option>
                <option value="Vídeo Longo">Vídeo Longo (YouTube)</option>
              </select>
            </div>
          </div>

          {/* Canais */}
          <div>
            <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1.5">
              Canais de Publicação
            </label>
            <div className="flex flex-wrap gap-2">
              {['Instagram', 'Facebook', 'YouTube', 'Site'].map(canal => {
                const ativo = canais.includes(canal);
                return (
                  <button
                    key={canal}
                    type="button"
                    onClick={() => toggleCanal(canal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      ativo
                        ? 'bg-[#226380] border-[#226380] text-white'
                        : 'border-[#dce4e2] dark:border-[#354246] bg-slate-50 dark:bg-white/5 text-[#52636a] dark:text-[#a0aeaf]'
                    }`}
                  >
                    {canal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Se for Post, campos de texto e data */}
          {tipo === 'post' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
                  Legenda / Texto
                </label>
                <textarea
                  rows={4}
                  value={legenda}
                  onChange={e => setLegenda(e.target.value)}
                  placeholder="Escreva a legenda ou o roteiro inicial do conteúdo..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
                Data Prevista / Cronograma
              </label>
              <input
                type="date"
                value={dataCronograma}
                onChange={e => setDataCronograma(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#113240] dark:text-[#edf2f1] mb-1">
                Horário Sugerido
              </label>
              <input
                type="time"
                value={horario}
                onChange={e => setHorario(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#dce4e2] dark:border-[#354246] bg-white dark:bg-[#141a1c] text-[#113240] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#226380]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#dce4e2] dark:border-[#354246]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#66777b] hover:text-[#113240] dark:text-[#a0aeaf] dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#226380] hover:bg-[#1a4f66] text-white transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{tipo === 'pauta' ? 'Salvar no Banco de Pautas' : 'Enviar para Produção'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
