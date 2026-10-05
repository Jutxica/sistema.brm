import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PoliticaPrivacidade: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#090a0f] text-[#1d1d1f] dark:text-[#f5f5f7] py-12 md:py-20 px-4 sm:px-6 lg:px-8 selection:bg-[#226380]/20 selection:text-[#226380]">
      <main className="max-w-3xl mx-auto bg-white dark:bg-[#12151e] border border-slate-200 dark:border-slate-800 rounded-[6px] p-8 sm:p-14 md:p-20 shadow-none space-y-12">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-[#e5e5ea] dark:border-white/10 pb-8 print:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs font-medium text-[#707070] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
          >
            ← Voltar
          </button>
          
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-medium text-[#707070] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
          >
            Versão para impressão
          </button>
        </div>

        {/* Document Header */}
        <header className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#707070] dark:text-[#86868b]">
            Província dos Padres do Sagrado Coração de Jesus • Província BRM
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-white leading-tight font-serif">
            Política de Privacidade e Proteção de Dados Pessoais
          </h1>
          <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] leading-relaxed">
            Diretrizes institucionais de conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018) e as normas canônicas vigentes.
          </p>
        </header>

        <hr className="border-t border-[#e5e5ea] dark:border-white/10" />

        {/* Continuous Formal Legal Text */}
        <div className="text-[13px] sm:text-sm leading-relaxed text-[#3a3a3c] dark:text-[#b0b3b8] space-y-8 text-justify hyphens-auto">
          
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              1. Preâmbulo e Identificação do Controlador
            </h2>
            <p>
              A Província dos Padres do Sagrado Coração de Jesus — Província Brasil Meridional (doravante denominada simplesmente Província BRM), entidade religiosa católica e pessoa jurídica de direito privado sem fins lucrativos, com sede provincial no município de Curitiba, Estado do Paraná, estabelece por meio deste instrumento suas diretrizes oficiais de privacidade, transparência e governança sobre o tratamento de dados pessoais.
            </p>
            <p>
              Na qualidade de Controladora de dados, a Província BRM reafirma seu compromisso inegociável com a dignidade da pessoa humana, o respeito à inviolabilidade da intimidade e a confidencialidade das informações que lhe são confiadas por religiosos professos, seminaristas, postulantes, colaboradores leigos, benfeitores e hóspedes, assegurando a estrita conformidade de seus processos com a Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 — LGPD) e as prescrições do Código de Direito Canônico.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              2. Princípios e Fundamentos do Tratamento
            </h2>
            <p>
              Todas as operações de coleta, registro, organização, armazenamento, consulta, utilização, compartilhamento e eliminação de dados pessoais conduzidas pela Província BRM regem-se com base nos princípios da boa-fé, finalidade legítima, adequação, estrita necessidade, livre acesso aos titulares, transparência procedimental, segurança da informação e prevenção contra acessos ou incidentes lesivos.
            </p>
            <p>
              A coleta de dados restringe-se ao volume mínimo indispensável para a instrução de processos eclesiásticos, atualização do catálogo provincial, gestão de casas de formação e conventos, acolhimento hospitaleiro e o fiel atendimento de obrigações civis, trabalhistas, fiscais e estatutárias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              3. Categorias de Dados e Finalidades Institucionais
            </h2>
            <p>
              Em razão da natureza de suas atividades pastorais, assistenciais e formativas, a instituição processa dados distribuídos nos seguintes núcleos de atuação:
            </p>
            <p>
              <strong>Gestão de Religiosos, Vocações e Vida Consagrada:</strong> Abrange a qualificação civil completa (nome, filiação, data e local de nascimento, naturalidade, nacionalidade, Cadastro de Pessoas Físicas - CPF, Registro Geral - RG, título de eleitor, Carteira Nacional de Habilitação e passaporte), trajetória acadêmica, registros documentais de sacramentos da Igreja Católica (Batismo, Primeira Eucaristia e Confirmação), histórico vocacional, etapas formativas, escrutínios canônicos, profissões religiosas de votos temporários e perpétuos, cartas de ordens sacras (Diaconato, Presbiterado e Episcopado), provisões e histórico de destinações comunitárias. A finalidade exclusiva reside no acompanhamento vocacional e formativo, registro histórico permanente da Província, relacionamento institucional com dioceses e cumprimento dos deveres estatutários da Congregação Dehoniana.
            </p>
            <p>
              <strong>Hospedaria, Encontros e Retiros Pastorais:</strong> Abrange dados cadastrais básicos de visitantes e participantes de atividades (nome civil, documento de identificação, endereço de domicílio, número de telefone e endereço de correio eletrônico), período de estadia, destinação de aposentos e comprovantes para faturamento e emissão de recibos. A finalidade exclusiva repousa na acolhida fraterna, controle de acesso e segurança física das instalações e adequada escrituração contábil.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              4. Tratamento Especial de Dados Pessoais Sensíveis
            </h2>
            <p>
              O sistema institucional trata categorias especiais de informações qualificadas pela legislação como dados pessoais sensíveis, observando com rigor os preceitos do Artigo 11 da Lei nº 13.709/2018:
            </p>
            <p>
              <strong>Filiação Canônica e Convicção Religiosa:</strong> As informações concernentes à fé professada, consagração religiosa e vínculos eclesiásticos são tratadas com fundamento expresso no Artigo 11, inciso II, alínea "f" da LGPD, o qual resguarda o legítimo exercício de atividades de organizações religiosas e sem fins lucrativos, respeitados os direitos dos membros e formandos.
            </p>
            <p>
              <strong>Dados Clínicos e de Saúde:</strong> O registro de dados médicos — tais como tipo sanguíneo, fator RH, histórico de enfermidades crônicas, cirurgias pregressas, uso contínuo de medicamentos, alergias severas e restrições alimentares específicas — fundamenta-se na salvaguarda da vida, integridade e tutela da saúde do titular (Artigo 11, inciso II, alínea "e"), associado ao consentimento expresso e destacado. Essas informações destinam-se exclusivamente ao pronto socorro e direcionamento médico hospitalar em eventuais situações de emergência que ocorram no decorrer da convivência comunitária ou durante a hospedagem, sendo terminantemente vedado o seu compartilhamento para qualquer fim discriminatório ou comercial.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              5. Direitos do Titular de Dados
            </h2>
            <p>
              Em fiel cumprimento ao Artigo 18 da Lei Federal nº 13.709/2018, todo titular de dados cadastrado no sistema tem a faculdade de exercer, mediante solicitação formal e a qualquer tempo, os seguintes direitos perante a Província BRM:
            </p>
            <p>
              a) Confirmação da existência de operações de tratamento relativas aos seus dados pessoais;<br />
              b) Acesso integral, transparente e facilitado às informações constantes em seu prontuário cadastral;<br />
              c) Retificação ou atualização de dados que se apresentem incorretos, incompletos ou defasados;<br />
              d) Bloqueio, anonimização ou eliminação de dados que venham a ser considerados excessivos ou desnecessários em relação às finalidades declaradas;<br />
              e) Revogação a qualquer momento do consentimento anteriormente manifestado para contatos não essenciais ou comunicações opcionais;<br />
              f) Obtenção de informações claras sobre eventuais entidades públicas ou privadas com as quais a instituição compartilhe informações por imposição legal ou assistencial.
            </p>
            <p>
              Informa-se que o direito à eliminação definitiva não incide sobre documentos, atas e certidões cuja conservação seja imposta pelo Código de Direito Canônico ou pelas leis civis vigentes para efeito de salvaguarda de patrimônio histórico, probatório e arquivístico perpétuo da Igreja e da congregação.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              6. Segurança da Informação e Salvaguardas Técnicas
            </h2>
            <p>
              A Província BRM implementa salvaguardas tecnológicas e organizacionais para impedir acessos não autorizados, vazamentos, destruição acidental, perda ou adulteração de informações.
            </p>
            <p>
              Entre as medidas adotadas destacam-se a obrigatoriedade de canais de comunicação com criptografia em trânsito sob protocolo HTTPS/TLS, segregação lógica de dados por meio de políticas de segurança por linha (Row Level Security - RLS), controle estrito de credenciais restrito a usuários com perfis administrativos autenticados e auditoria contínua de consultas públicas, garantindo que senhas de infraestrutura, servidores ou parâmetros internos jamais trafeguem para ambientes de visitantes externos. O sistema opera de forma autônoma e não emprega cookies intrusivos de publicidade, ferramentas de telemetria comportamental de terceiros ou pixels de rastreamento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              7. Prazo de Armazenamento e Retenção Documental
            </h2>
            <p>
              Os dados pessoais serão conservados unicamente pelo tempo necessário ao cumprimento das finalidades para as quais foram legitimamente coletados.
            </p>
            <p>
              Os assentamentos canônicos e pastorais relativos aos religiosos professos e aos ministérios conferidos integram o arquivo perpétuo da Província BRM, possuindo guarda permanente conforme a praxe da Sé Apostólica. Já as fichas cadastrais de hóspedes e os lançamentos de faturamento financeiro são mantidos pelo prazo quinquenal ordinário determinado pelas normas civis e tributárias brasileiras, findo o qual são anonimizados ou destruídos de modo seguro.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              8. Canais Oficiais de Atendimento e Comunicação
            </h2>
            <p>
              Para o exercício dos direitos de titularidade, esclarecimento de dúvidas, formulação de requerimentos sobre o tratamento de informações ou comunicação com a equipe de governança de dados da instituição, a Província BRM disponibiliza seus canais institucionais oficiais:
            </p>
            <p>
              Secretariado Provincial: <a href="mailto:secretaria@brm.org.br" className="text-[#226380] dark:text-[#A3C3C7] font-medium hover:underline">secretaria@brm.org.br</a><br />
              Assessoria de Comunicação Institucional: <a href="mailto:comunicacao@brm.org.br" className="text-[#226380] dark:text-[#A3C3C7] font-medium hover:underline">comunicacao@brm.org.br</a>
            </p>
            <p>
              As solicitações serão recepcionadas pelo Secretariado e processadas em observância aos prazos legais razoáveis e às deliberações expedidas pela Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </section>

        </div>

        {/* Document Footer */}
        <footer className="border-t border-[#e5e5ea] dark:border-white/10 pt-8 text-center text-xs text-[#707070] dark:text-[#86868b] print:hidden space-y-3">
          <p className="tracking-wide">
            sistema.brm.org - todos os direitos reservados-2026
          </p>
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs font-semibold text-[#1d1d1f] dark:text-white hover:text-[#226380] dark:hover:text-[#A3C3C7] transition-colors cursor-pointer"
            >
              ← Voltar para o sistema
            </button>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default PoliticaPrivacidade;
