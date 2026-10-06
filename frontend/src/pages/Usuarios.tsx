import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, Trash2, Edit, Save, Check, Loader2, UserCheck, UserX, Shield, User, KeyRound, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { confirmAction, showAlertModal, showToast } from '../hooks/useFeedback';

interface SystemUser {
  idusuarios: string;
  usu_email: string;
  usu_nome: string;
  usu_status: 'Ativo' | 'Inativo';
  usu_acessos: string[] | string;
  auth_user_id: string;
  usu_pref_opensidebar?: string;
}

export const Usuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingResetFor, setSendingResetFor] = useState<string | null>(null);
  const [resetSuccessEmail, setResetSuccessEmail] = useState<string | null>(null);

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

  const handleDeleteClick = async (id: string, name: string, email: string) => {
    if (currentUser?.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
      await showAlertModal({
        title: 'Operação Bloqueada',
        badge: 'Segurança • Sessão Ativa',
        message: 'Você não pode excluir sua própria conta de administrador enquanto estiver conectado ao sistema.',
        tone: 'warning'
      });
      return;
    }

    const confirmed = await confirmAction({
      title: 'Remover Acesso de Usuário',
      badge: 'Controle de Acesso • Exclusão',
      message: `Deseja realmente remover o acesso de "${name}"?`,
      detail: `O usuário com e-mail "${email}" não poderá mais acessar o sistema administrativo.`,
      confirmLabel: 'Remover Usuário',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('idusuarios', id);
        
      if (!error) {
        setUsers(prev => prev.filter(u => u.idusuarios !== id));
        showToast.success(`Acesso de "${name}" removido com sucesso.`);
      } else {
        showToast.error("Erro ao excluir usuário: " + error.message);
      }
    } catch (err: any) {
      console.error(err);
      showToast.error("Erro inesperado ao excluir usuário.");
    }
  };

  const handleSendResetPassword = async (email: string) => {
    if (!email) {
      showToast.warning("Usuário não possui e-mail cadastrado.");
      return;
    }
    setSendingResetFor(email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        showToast.error("Erro ao enviar e-mail de acesso/redefinição: " + error.message);
      } else {
        setResetSuccessEmail(email);
        showToast.success(`E-mail de acesso/redefinição enviado para ${email}`);
        setTimeout(() => setResetSuccessEmail(null), 4000);
      }
    } catch (err: any) {
      showToast.error("Falha de conexão: " + (err.message || err));
    } finally {
      setSendingResetFor(null);
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
      usu_acessos: selectedAcessos,
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
        showToast.success("Usuário salvo com sucesso!");
        setEditingUser(null);
        loadUsers();
      } else {
        showToast.error("Erro ao salvar usuário: " + error.message);
      }
    } catch (err: any) {
      console.error(err);
      showToast.error("Falha ao salvar usuário.");
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
    { key: 'inicio', name: 'Painel Inicial', desc: 'Resumo geral, métricas de ocupação e atalhos rápidos' },
    { key: 'religiosos', name: 'Módulo Religiosos', desc: 'Fichas canônicas, histórico vocacional e dados sacramentais' },
    { key: 'obras', name: 'Comunidades & Obras', desc: 'Gestão de paróquias, casas religiosas e presenças da Província' },
    { key: 'patrimonio', name: 'Módulo Patrimônio', desc: 'Gestão de imóveis, veículos, inventário, contratos e manutenção patrimonial' },
    { key: 'secretaria', name: 'Secretaria & Atos', desc: 'Acesso a documentos oficiais, agenda e eventos provinciais' },
    { key: 'hospedagens', name: 'Módulo Hospedagens', desc: 'Inscrições, quartos, check-in e relatórios de hóspedes' },
    { key: 'configuracoes', name: 'Configurações do Sistema', desc: 'Regras de formulários, motivos de estadia e parâmetros' },
    { key: 'usuarios', name: 'Gestão de Usuários', desc: 'Controle de contas administrativas e permissões de acesso' },
    { key: 'admin', name: 'Super Administrador', desc: 'Acesso irrestrito a todas as funções e auditorias do sistema' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Carregando usuários administrativos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 font-cinzel">
            Segurança & Controle • Província BRM
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white font-cinzel mt-1">
            {editingUser ? 'Ficha do Usuário' : 'Usuários do Sistema'}
          </h1>
        </div>
        
        {!editingUser && (
          <button
            onClick={handleNewClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold bg-[#113240] text-white hover:bg-[#0c242e] transition-colors cursor-pointer rounded-[6px] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Usuário</span>
          </button>
        )}
      </div>

      {editingUser ? (
        <form onSubmit={handleSave} className="apple-card rounded-[6px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
          <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-[#fbfbfd] dark:bg-slate-900/40">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                {editingUser.idusuarios ? `ID #${editingUser.idusuarios}` : 'Novo Cadastro'}
              </span>
              <h2 className="text-base font-semibold text-[#113240] dark:text-white font-cinzel">
                {editingUser.idusuarios ? editingUser.usu_nome || 'Editar Perfil' : 'Novo Usuário Administrativo'}
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-[6px] border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#0c242e] disabled:opacity-50 cursor-pointer rounded-[6px] shadow-sm transition-all"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar Usuário</span>
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Core credentials */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <User className="w-4 h-4 text-[#226380]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#113240] dark:text-slate-300">
                  Dados de Identificação
                </h3>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editingUser.usu_nome || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, usu_nome: e.target.value })}
                  placeholder="Ex: Pe. João da Silva, scj"
                  className="w-full apple-input rounded-[6px] px-3.5 py-2.5 text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Endereço de E-mail (Login)</label>
                <input
                  type="email"
                  required
                  value={editingUser.usu_email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, usu_email: e.target.value })}
                  placeholder="usuario@brm.org.br"
                  className="w-full apple-input rounded-[6px] px-3.5 py-2.5 text-xs outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">
                  UUID do Supabase Auth
                </label>
                <input
                  type="text"
                  value={editingUser.auth_user_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, auth_user_id: e.target.value })}
                  placeholder="d3b07384-d113-4956-a5db-2e0f0f498c4a"
                  className="w-full apple-input rounded-[6px] px-3.5 py-2.5 text-xs outline-none font-mono text-[11px]"
                />
                <p className="text-[11px] text-slate-400">
                  Vincule o ID correspondente criado no painel de Autenticação do Supabase.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Status da Conta</label>
                <select
                  value={editingUser.usu_status || 'Ativo'}
                  onChange={(e) => setEditingUser({ ...editingUser, usu_status: e.target.value as 'Ativo' | 'Inativo' })}
                  className="w-full apple-input rounded-[6px] px-3.5 py-2.5 text-xs outline-none cursor-pointer"
                >
                  <option value="Ativo">Conta Ativa (Acesso Permitido)</option>
                  <option value="Inativo">Conta Inativa (Acesso Bloqueado)</option>
                </select>
              </div>
            </div>

            {/* Access matrix */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Shield className="w-4 h-4 text-[#226380]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#113240] dark:text-slate-300">
                  Matriz de Acessos
                </h3>
              </div>

              <div className="space-y-3">
                {availablePermissions.map(p => {
                  const isChecked = selectedAcessos.includes(p.key);
                  return (
                    <div 
                      key={p.key}
                      onClick={() => handleAccessToggle(p.key)}
                      className={`flex items-start gap-3.5 p-3.5 rounded-[6px] border cursor-pointer select-none transition-all
                        ${isChecked 
                          ? 'border-[#226380]/40 bg-[#226380]/5 text-slate-900 dark:text-white' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'}`}
                    >
                      <div className={`mt-0.5 flex items-center justify-center w-4 h-4 rounded-[4px] border transition-all
                        ${isChecked 
                          ? 'border-[#226380] bg-[#226380] text-white' 
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-semibold">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {resetSuccessEmail && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Instruções de acesso e redefinição de senha enviadas com sucesso para <strong>{resetSuccessEmail}</strong>.</span>
            </div>
          )}

          <div className="apple-card rounded-[6px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-[#fbfbfd] dark:bg-slate-900/60 text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-mono">
                  <tr>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Permissões de Acesso</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-inter">
                  {users.map(u => {
                    let parsedAcessos: string[] = [];
                    try {
                      parsedAcessos = typeof u.usu_acessos === 'string'
                        ? JSON.parse(u.usu_acessos)
                        : u.usu_acessos || [];
                    } catch {
                      parsedAcessos = [];
                    }
                    
                    const isSelf = currentUser?.email?.toLowerCase() === u.usu_email.toLowerCase();

                    return (
                      <tr key={u.idusuarios} className="hover:bg-[#f5f5f7]/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-[6px] border border-[#226380]/20 bg-[#226380]/10 flex items-center justify-center font-semibold text-[#113240] dark:text-[#A3C3C7] text-xs shrink-0">
                              {u.usu_nome.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {u.usu_nome}
                              </span>
                              {isSelf && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-[4px] border border-[#226380]/30 text-[9px] font-semibold bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
                                  Você
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[11px]">{u.usu_email}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {parsedAcessos.map(a => (
                              <span key={a} className="px-2 py-0.5 rounded-[4px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                {a}
                              </span>
                            ))}
                            {parsedAcessos.length === 0 && <span className="text-[11px] text-slate-400">Nenhum Acesso</span>}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-semibold border
                            ${u.usu_status === 'Ativo' 
                              ? 'bg-[#113240] text-white dark:bg-white dark:text-slate-900 border-[#113240] dark:border-white' 
                              : 'bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'}`}
                          >
                            {u.usu_status === 'Ativo' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {u.usu_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Enviar instruções de acesso / redefinição de senha"
                              onClick={() => handleSendResetPassword(u.usu_email)}
                              disabled={sendingResetFor === u.usu_email}
                              className="border border-slate-200 dark:border-slate-700 p-1.5 rounded-[6px] text-[#226380] hover:bg-[#226380]/10 dark:text-[#A3C3C7] dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {sendingResetFor === u.usu_email ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              title="Editar Usuário"
                              onClick={() => handleEditClick(u)}
                              className="border border-slate-200 dark:border-slate-700 p-1.5 rounded-[6px] text-slate-600 dark:text-slate-400 hover:text-[#113240] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title={isSelf ? "Você não pode excluir sua própria conta conectada" : "Excluir Usuário"}
                              disabled={isSelf}
                              onClick={() => handleDeleteClick(u.idusuarios, u.usu_nome, u.usu_email)}
                              className={`border border-slate-200 dark:border-slate-700 p-1.5 rounded-[6px] transition-colors ${
                                isSelf
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                                  : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer'
                              }`}
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
        </div>
      )}
    </div>
  );
};

export default Usuarios;
