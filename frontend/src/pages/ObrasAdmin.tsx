import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Building2, FileSpreadsheet, Loader2, Pencil, Search, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Obra { id: string; nome: string; tipo: string; localidade: string | null; uf: string | null; email: string | null; telefone: string | null; whatsapp: string | null; diocese: string | null; fundacao: string | null; endereco: string | null; instagram: string | null; facebook: string | null; youtube: string | null; site: string | null; status: string }
const fields = ['nome', 'tipo', 'localidade', 'uf', 'email', 'telefone', 'whatsapp', 'diocese', 'fundacao', 'assumida_pelos_dehonianos', 'endereco', 'instagram', 'facebook', 'youtube', 'site'];
const labels: Record<string, string> = { nome: 'Nome', tipo: 'Tipo', localidade: 'Localidade', uf: 'UF', email: 'E-mail', telefone: 'Telefone', whatsapp: 'WhatsApp', diocese: 'Diocese', fundacao: 'Fundação', assumida_pelos_dehonianos: 'Assumida pelos Dehonianos', endereco: 'Endereço', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', site: 'Site' };
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900';

const excelDate = (value: unknown) => { if (typeof value === 'number') { const date = XLSX.SSF.parse_date_code(value); return date ? `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}` : ''; } return String(value || ''); };
const normalize = (value: unknown) => String(value ?? '').trim();

export const ObrasAdmin: React.FC = () => {
  const [items, setItems] = useState<Obra[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<Partial<Obra> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => { setLoading(true); const { data, error } = await supabase.from('religiosos_obras_referencia').select('*').order('nome'); if (error) setMessage(error.message); setItems((data || []) as Obra[]); setLoading(false); };
  React.useEffect(() => { load(); }, []);
  const filtered = useMemo(() => items.filter(item => [item.nome, item.tipo, item.localidade, item.uf, item.diocese].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())), [items, query]);

  const importWorkbook = async (file: File) => {
    setImporting(true); setMessage(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      let tipo = 'Paróquia';
      const records: Record<string, string>[] = [];
      for (const row of rows) {
        const values = Array.isArray(row) ? row.map(normalize) : [];
        const marker = values[1]?.toLocaleUpperCase();
        if (marker === 'PARÓQUIA') { tipo = 'Paróquia'; continue; }
        if (marker === 'OBRAS') { tipo = 'Obra'; continue; }
        if (marker === 'CASAS' || marker === 'CASAS DE FORMAÇÃO') { tipo = 'Casa'; continue; }
        if (!values[1] || !values[2] || !values[3] || values[3].length !== 2) continue;
        records.push({ nome: values[1], tipo, localidade: values[2], uf: values[3], email: values[4], telefone: values[5], whatsapp: values[6], diocese: values[7], fundacao: excelDate(row[8]), assumida_pelos_dehonianos: values[9], endereco: values[10], instagram: values[11], facebook: values[12], youtube: values[13], site: values[14], status: 'Ativa' });
      }
      if (!records.length) throw new Error('Nenhum registro válido foi encontrado na planilha.');
      const { error } = await supabase.from('religiosos_obras_referencia').upsert(records, { onConflict: 'nome,localidade,uf' });
      if (error) throw error;
      setMessage(`${records.length} registros importados com sucesso.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível importar a planilha.'); } finally { setImporting(false); }
  };

  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!editing?.nome) return; const { error } = editing.id ? await supabase.from('religiosos_obras_referencia').update(editing).eq('id', editing.id) : await supabase.from('religiosos_obras_referencia').insert(editing); if (error) setMessage(error.message); else { setEditing(null); await load(); } };
  const remove = async (item: Obra) => { if (!window.confirm(`Excluir ${item.nome}?`)) return; const { error } = await supabase.from('religiosos_obras_referencia').delete().eq('id', item.id); if (error) setMessage(error.message); else load(); };

  return <div className="space-y-6"><header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Base institucional</p><h1 className="mt-2 font-serif text-3xl font-bold text-primary">Paróquias, casas e obras</h1><p className="mt-2 text-sm text-slate-500">A base usada pelo secretário e pelo cadastro público dos religiosos.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"><Upload className="h-4 w-4" />{importing ? 'Importando...' : 'Importar Excel'}<input type="file" accept=".xlsx,.xls" className="hidden" disabled={importing} onChange={event => { const file = event.target.files?.[0]; if (file) importWorkbook(file); event.currentTarget.value = ''; }} /></label></header>
    {message && <div className="rounded-xl bg-primary/10 p-3 text-xs font-semibold text-primary">{message}</div>}
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-premium dark:border-slate-800 dark:bg-slate-900/70"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Pesquisar por nome, cidade, UF ou diocese" className="w-full bg-transparent text-sm outline-none" /><span className="text-xs text-slate-400">{filtered.length} registros</span></div>
    {editing && <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium dark:border-slate-800 dark:bg-slate-900/70"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-lg font-bold text-primary">{editing.id ? 'Editar registro' : 'Nova obra'}</h2><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5 text-slate-400" /></button></div><div className="grid gap-4 md:grid-cols-3">{fields.map(field => <label className="space-y-1.5" key={field}><span className="text-xs font-semibold text-slate-500">{labels[field]}</span>{field === 'tipo' ? <select className={inputClass} value={editing[field as keyof Obra] as string || 'Paróquia'} onChange={event => setEditing({ ...editing, tipo: event.target.value })}><option>Paróquia</option><option>Casa</option><option>Obra</option></select> : <input className={inputClass} value={editing[field as keyof Obra] as string || ''} onChange={event => setEditing({ ...editing, [field]: event.target.value })} />}</label>)}</div><button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"><Pencil className="h-4 w-4" />Salvar registro</button></form>}
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900/70"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"><tr><th className="p-4">Nome</th><th className="p-4">Tipo</th><th className="p-4">Localidade</th><th className="p-4">Contato</th><th className="p-4">Diocese</th><th className="p-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map(item => <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span><div><p className="font-bold text-slate-800 dark:text-slate-100">{item.nome}</p><p className="text-[10px] text-slate-400">{item.uf}</p></div></div></td><td className="p-4"><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{item.tipo}</span></td><td className="p-4 text-slate-600 dark:text-slate-300">{item.localidade || '-'} / {item.uf || '-'}</td><td className="p-4 text-slate-500">{item.email || item.telefone || '-'}</td><td className="p-4 text-slate-500">{item.diocese || '-'}</td><td className="p-4"><div className="flex justify-end gap-2"><button title="Editar" onClick={() => setEditing({ ...item })} className="rounded-lg border border-slate-200 p-2 text-primary dark:border-slate-700"><Pencil className="h-4 w-4" /></button><button title="Excluir" onClick={() => remove(item)} className="rounded-lg border border-slate-200 p-2 text-red-500 dark:border-slate-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{loading && <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-secondary" /></div>}{!filtered.length && !loading && <div className="p-10 text-center text-xs text-slate-400"><FileSpreadsheet className="mx-auto mb-2 h-8 w-8" />Nenhuma obra cadastrada.</div>}</div>
  </div>;
};
export default ObrasAdmin;
