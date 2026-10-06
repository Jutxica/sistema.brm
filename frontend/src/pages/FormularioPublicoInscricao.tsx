import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FormularioTimbrado } from '../components/FormularioTimbrado';
import type { FormularioSecretaria, RespostaFormulario } from './SecretariaConfiguracoes';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_FORMULARIOS = 'brm_secretaria_formularios_v1';
const LOCAL_STORAGE_RESPOSTAS = 'brm_secretaria_respostas_v1';

export const FormularioPublicoInscricao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormularioSecretaria | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarFormulario = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Tentar carregar do Supabase
        const { data, error: sbError } = await supabase
          .from('secretaria_formularios')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (data && !sbError) {
          setForm(data as FormularioSecretaria);
        } else {
          // Fallback para localStorage
          const saved = localStorage.getItem(LOCAL_STORAGE_FORMULARIOS);
          if (saved) {
            const list: FormularioSecretaria[] = JSON.parse(saved);
            const encontrado = list.find(f => f.id === id);
            if (encontrado) {
              setForm(encontrado);
            } else {
              setError('Formulário não encontrado ou já expirado.');
            }
          } else {
            setError('Formulário não encontrado.');
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar formulário público:', e);
        const saved = localStorage.getItem(LOCAL_STORAGE_FORMULARIOS);
        if (saved) {
          const list: FormularioSecretaria[] = JSON.parse(saved);
          const encontrado = list.find(f => f.id === id);
          if (encontrado) setForm(encontrado);
          else setError('Formulário não encontrado.');
        } else {
          setError('Não foi possível carregar o formulário.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) carregarFormulario();
  }, [id]);

  const handleSubmit = async (respostasValores: Record<string, any>) => {
    if (!form) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('secretaria_enviar_resposta', {
        p_formulario_id: form.id,
        p_dados: respostasValores
      });
      if (error) throw error;
      const savedResponse = Array.isArray(data) ? data[0] : null;
      if (!savedResponse?.id || !savedResponse?.protocolo) {
        throw new Error('O servidor não confirmou o recebimento da inscrição.');
      }

      const novaResposta: RespostaFormulario = {
        id: savedResponse.id,
        formulario_id: form.id,
        evento_id: savedResponse.evento_id || null,
        dados: respostasValores,
        protocolo: savedResponse.protocolo,
        status: 'Confirmada',
        created_at: savedResponse.created_at
      };

      // Persistir em localStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_RESPOSTAS);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(novaResposta);
      localStorage.setItem(LOCAL_STORAGE_RESPOSTAS, JSON.stringify(list));

      // Atualizar contagem no formulário local
      const savedForms = localStorage.getItem(LOCAL_STORAGE_FORMULARIOS);
      if (savedForms) {
        const formsList: FormularioSecretaria[] = JSON.parse(savedForms);
        const idx = formsList.findIndex(f => f.id === form.id);
        if (idx !== -1) {
          formsList[idx].total_respostas = (formsList[idx].total_respostas || 0) + 1;
          localStorage.setItem(LOCAL_STORAGE_FORMULARIOS, JSON.stringify(formsList));
        }
      }
    } catch (err) {
      console.error('Erro ao submeter resposta:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#226380]/20 border-t-[#226380] animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Carregando formulário provincial...
          </span>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#161b22] max-w-md w-full p-8 rounded-[6px] border border-slate-300 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
          <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
            Formulário Indisponível
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            {error || 'O formulário solicitado não existe, foi desativado ou atingiu o prazo de encerramento.'}
          </p>
          <div className="pt-2">
            <Link
              to="/portal-religioso"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ir para o Portal do Confrade</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#090d16] py-8 px-3 sm:px-6 flex flex-col items-center justify-start">
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/portal-religioso"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-[#113240] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retornar ao Portal</span>
          </Link>

          {form.codigo && (
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
              Protocolo Oficial: {form.codigo}
            </span>
          )}
        </div>

        <FormularioTimbrado
          titulo={form.titulo}
          subtitulo={form.codigo}
          descricao={form.descricao}
          campos={form.campos}
          carregando={saving}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default FormularioPublicoInscricao;
