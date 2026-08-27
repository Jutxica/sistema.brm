import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, Trash2, Edit, Save, Check, Loader2, UserCheck, UserX 
} from 'lucide-react';

interface SystemUser {
  idusuarios: string;
  usu_email: string;
  usu_nome: string;
  usu_status: 'Ativo' | 'Inativo';
  usu_acessos: string; // JSON string or array
  auth_user_id: string;
  usu_pref_opensidebar?: string;
}

export const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit / Add Form State
  const [editingUser, setEditingUser] = useState<Partial<SystemUser> | null>(null);
  const [selectedAcessos, setSelectedAcessos] = useState<string[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('usu_nome', { ascending: true });
        
      if (!error && data) {
        setUsers(data as SystemUser[]);
      } else if (error) {
        console.error("Erro ao carregar usuários:", error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditClick = (user: SystemUser) => {
    let parsedAcessos: string[] = [];
    try {
      parsedAcessos = typeof user.usu_acessos === 'string' 
        ? JSON.parse(user.usu_acessos) 
        : user.usu_acessos || [];
    } catch {
      parsedAcessos = [];
    }
    setEditingUser({ ...user });
    setSelectedAcessos(parsedAcessos);
  };

  const handleNewClick = () => {
    setEditingUser({
      usu_nome: '',
      usu_email: '',
      usu_status: 'Ativo',
      auth_user_id: ''
    });
    setSelectedAcessos(['inicio', 'hospedagens']);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este usuário administrativo?")) return;
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('idusuarios', id);
        
      if (!error) {
        setUsers(prev => prev.filter(u => u.idusuarios !== id));
      } else {
        alert("Erro ao excluir usuário: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);

    const payload = {
      usu_nome: editingUser.usu_nome,
      usu_email: editingUser.usu_email,
      usu_status: editingUser.usu_status,
      usu_acessos: JSON.stringify(selectedAcessos),
      auth_user_id: editingUser.auth_user_id || null,
      usu_pref_opensidebar: editingUser.usu_pref_opensidebar || null
    };

    try {
      let error;
      if (editingUser.idusuarios) {
        const { error: updateError } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('idusuarios', editingUser.idusuarios);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert([payload]);
        error = insertError;
      }
      
      if (!error) {
        setEditingUser(null);
        loadUsers();
      } else {
        alert("Erro ao salvar usuário: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAccessToggle = (accessKey: string) => {
    if (selectedAcessos.includes(accessKey)) {
      setSelectedAcessos(selectedAcessos.filter(a => a !== accessKey));
    } else {
      setSelectedAcessos([...selectedAcessos, accessKey]);
    }
  };

  const availablePermissions = [
    { key: 'inicio', name: 'Acesso ao Início/Dashboard', desc: 'Visualizar resumo do painel principal' },
    { key: 'hospedagens', name: 'Acesso a Hospedagens', desc: 'Visualizar e gerenciar inscrições de hóspedes' },
    { key: 'configuracoes', name: 'Acesso a Configurações', desc: 'Alterar quartos, cursos e status auxiliares' },
    { key: 'usuarios', name: 'Acesso a Usuários', desc: 'Gerenciar outros usuários do sistema' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-sm font-medium text-slate-500">Carregando usuários do sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#082842] dark:text-slate-100">
            {editingUser ? 'Ficha do Usuário' : 'Usuários do Sistema'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {editingUser ? 'Ajuste os dados de login e permissões.' : 'Gerencie as contas administrativas autorizadas a acessar o sistema.'}
          </p>
        </div>
        
        {!editingUser && (
          <button
            onClick={handleNewClick}
            className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/95 text-white text-xs font-semibold rounded-xl shadow-premium shadow-secondary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Usuário</span>
          </button>
        )}
      </div>

      {editingUser ? (
        <form onSubmit={handleSave} className="glass shadow-premium rounded-2xl overflow-hidden animate-fade-in bg-white/90">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50/50 dark:bg-slate-900/30">
            <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
              {editingUser.idusuarios ? `Editar Usuário #${editingUser.idusuarios}` : 'Novo Usuário Administrativo'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-xl text-xs font-semibold shadow-premium shadow-secondary/15 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Usuário</span>
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Core credentials */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-primary dark:text-secondary uppercase tracking-wider font-mono border-b pb-2">Informações Básicas</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editingUser.usu_nome || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, usu_nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Endereço de E-mail (Login)</label>
                <input
                  type="email"
                  required
                  value={editingUser.usu_email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, usu_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  ID de Autenticação (UUID do Supabase Auth)
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.auth_user_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, auth_user_id: e.target.value })}
                  placeholder="Ex: d3b07384-d113-4956-a5db-2e0f0f498c4a"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Crie o usuário na aba <b>Authentication</b> do Supabase, copie o UUID gerado e cole-o aqui para vincular o perfil.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 font-sans">Status da Conta</label>
                <select
                  value={editingUser.usu_status || 'Ativo'}
                  onChange={(e) => setEditingUser({ ...editingUser, usu_status: e.target.value as 'Ativo' | 'Inativo' })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none cursor-pointer"
                >
                  <option value="Ativo">Conta Ativa (Acesso Permitido)</option>
                  <option value="Inativo">Conta Inativa (Acesso Bloqueado)</option>
                </select>
              </div>
            </div>

            {/* Access matrix */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-primary dark:text-secondary uppercase tracking-wider font-mono border-b pb-2">Matriz de Permissões</h3>
              <div className="space-y-3">
                {availablePermissions.map(p => {
                  const isChecked = selectedAcessos.includes(p.key);
                  return (
                    <div 
                      key={p.key}
                      onClick={() => handleAccessToggle(p.key)}
                      className={`flex items-start gap-3.5 p-3 rounded-xl border cursor-pointer select-none transition-all
                        ${isChecked 
                          ? 'border-secondary bg-secondary/5 text-secondary dark:border-secondary/40' 
                          : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300'}`}
                    >
                      <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded border
                        ${isChecked 
                          ? 'border-secondary bg-secondary text-white' 
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-sans">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass shadow-premium rounded-2xl overflow-hidden bg-white/90">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-semibold tracking-wider font-mono">
                  <th className="p-4">Usuário</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Permissões Ativas</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                {users.map(u => {
                  let parsedAcessos: string[] = [];
                  try {
                    parsedAcessos = JSON.parse(u.usu_acessos || '[]');
                  } catch {
                    parsedAcessos = [];
                  }
                  
                  return (
                    <tr key={u.idusuarios} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 font-sans font-semibold text-slate-800 dark:text-slate-100">
                        {u.usu_nome}
                      </td>
                      <td className="p-4 font-mono text-slate-500">{u.usu_email}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {parsedAcessos.map(a => (
                            <span key={a} className="px-2 py-0.5 rounded bg-primary/5 dark:bg-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {a}
                            </span>
                          ))}
                          {parsedAcessos.length === 0 && <span className="text-[10px] text-slate-400">Nenhum Acesso</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${u.usu_status === 'Ativo' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}
                        >
                          {u.usu_status === 'Ativo' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.usu_status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-amber-500 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(u.idusuarios)}
                            className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-red-500 cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
};
export default Usuarios;
