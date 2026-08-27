<?php

namespace App\classes;

class Hospedagens extends Conexao {

    public function altHospedagem($dados)
    {
        $pdo = $this->conectar();

        $altHospedagem = $pdo->prepare("INSERT INTO hospedagens (
            idhospedagens,
            hos_categoria,
            hos_nome,
            hos_nascimento,
            hos_cpfrg,
            hos_email,
            hos_telefone,
            hos_telefoneemergencia,
            hos_logradouro,
            hos_numero,
            hos_cep,
            hos_bairro,
            hos_cidade,
            hos_estado,
            hos_alergico,
            hos_especifiquealergia,
            hos_restricaoalimentar,
            hos_especifiquerestricao,
            hos_lavanderia,
            hos_estadiamotivo,
            hos_modulo,
            hos_previsaochegada,
            hos_previsaosaida,
            hos_recibo,
            hos_recnome,
            hos_reccpfcnpj,
            hos_reclogradouro,
            hos_recnumero,
            hos_reccep,
            hos_recbairro,
            hos_reccidade,
            hos_recestado,
            hos_termo,
            hos_inscricao
        ) VALUES (
            :idhospedagens,
            :categoria,
            :nome,
            :nascimento,
            :cpfrg,
            :email,
            :telefone,
            :telefoneemergencia,
            :logradouro,
            :numero,
            :cep,
            :bairro,
            :cidade,
            :estado,
            :alergico,
            :especifiquealergia,
            :restricaoalimentar,
            :especifiquerestricao,
            :lavanderia,
            :estadiamotivo,
            :modulo,
            :previsaochegada,
            :previsaosaida,
            :recibo,
            :recnome,
            :reccpfcnpj,
            :reclogradouro,
            :recnumero,
            :reccep,
            :recbairro,
            :reccidade,
            :recestado,
            :termo,
            :inscricao
        ) ON DUPLICATE KEY UPDATE 
            hos_categoria = :categoria,
            hos_nome = :nome,
            hos_nascimento = :nascimento,
            hos_cpfrg = :cpfrg,
            hos_email = :email,
            hos_telefone= :telefone,
            hos_telefoneemergencia = :telefoneemergencia,
            hos_logradouro = :logradouro,
            hos_numero = :numero,
            hos_cep = :cep,
            hos_bairro = :bairro,
            hos_cidade = :cidade,
            hos_estado = :estado,
            hos_alergico = :alergico,
            hos_especifiquealergia = :especifiquealergia,
            hos_restricaoalimentar = :restricaoalimentar,
            hos_especifiquerestricao = :especifiquerestricao,
            hos_lavanderia = :lavanderia,
            hos_estadiamotivo = :estadiamotivo,
            hos_modulo = :modulo,
            hos_previsaochegada = :previsaochegada,
            hos_previsaosaida = :previsaosaida,
            hos_recibo = :recibo,
            hos_recnome = :recnome,
            hos_reccpfcnpj = :reccpfcnpj,
            hos_reclogradouro = :reclogradouro,
            hos_recnumero = :recnumero,
            hos_reccep = :reccep,
            hos_recbairro = :recbairro,
            hos_reccidade = :reccidade,
            hos_recestado = :recestado,
            hos_termo = :termo
        ");
        $altHospedagem->bindValue(":idhospedagens", $dados['fridhospedagens']);
        $altHospedagem->bindValue(":categoria", $dados['frcategoria']);
        $altHospedagem->bindValue(":nome", $dados['frnome']);
        $altHospedagem->bindValue(":nascimento", $dados['frnascimento']);
        $altHospedagem->bindValue(":cpfrg", $dados['frcpfrg']);
        $altHospedagem->bindValue(":email", $dados['fremail']);
        $altHospedagem->bindValue(":telefone", $dados['frtelefone']);
        $altHospedagem->bindValue(":telefoneemergencia", $dados['frtelefoneemergencia']);
        $altHospedagem->bindValue(":logradouro", $dados['frlogradouro']);
        $altHospedagem->bindValue(":numero", $dados['frnumero']);
        $altHospedagem->bindValue(":cep", $dados['frcep']);
        $altHospedagem->bindValue(":bairro", $dados['frbairro']);
        $altHospedagem->bindValue(":cidade", $dados['frcidade']);
        $altHospedagem->bindValue(":estado", $dados['frestado']);
        $altHospedagem->bindValue(":alergico", $dados['fralergico']);
        $altHospedagem->bindValue(":especifiquealergia", $dados['frespecifiquealergia']);
        $altHospedagem->bindValue(":restricaoalimentar", $dados['frrestricaoalimentar']);
        $altHospedagem->bindValue(":especifiquerestricao", $dados['frespecifiquerestricao']);
        $altHospedagem->bindValue(":lavanderia", $dados['frlavanderia']);
        $altHospedagem->bindValue(":estadiamotivo", $dados['frestadiamotivo']);
        $altHospedagem->bindValue(":modulo", $dados['frestadiamodulo']);
        
        $dthrChegada = $dados['frprevisaochegadaData'] . "T" . $dados['frprevisaochegadaHora'] . ":00";
        $dthrSaida = $dados['frprevisaosaidaData'] . "T" . $dados['frprevisaosaidaHora'] . ":00";
        
        $altHospedagem->bindValue(":previsaochegada", $dthrChegada);
        $altHospedagem->bindValue(":previsaosaida", $dthrSaida);

        $altHospedagem->bindValue(":recibo", $dados['frrecibo']);
        $altHospedagem->bindValue(":recnome", $dados['frnomerecibo']);
        $altHospedagem->bindValue(":reccpfcnpj", $dados['frrecibocpfcnpj']);
        $altHospedagem->bindValue(":reclogradouro", $dados['frlogradouroRecibo']);
        $altHospedagem->bindValue(":recnumero", $dados['frnumeroRecibo']);
        $altHospedagem->bindValue(":reccep", $dados['frcepRecibo']);
        $altHospedagem->bindValue(":recbairro", $dados['frbairroRecibo']);
        $altHospedagem->bindValue(":reccidade", $dados['frcidadeRecibo']);
        $altHospedagem->bindValue(":recestado", $dados['frestadoRecibo']);
        $altHospedagem->bindValue(":termo", $dados['frtermo']);
        $altHospedagem->bindValue(":inscricao", date("Y-m-d H:i:s"));
        $altHospedagem->execute();

        return $pdo->lastInsertId();
    }

    public function buscarHospedagens($motivo, $modulo = [])
    {
        $pdo = $this->conectar();
        $params = [];

        // --- 1. MOTIVO (Obrigatório) ---
        // Transforma em array caso venha um valor único e cria os placeholders :mot0, :mot1...
        $motivoArray = (array)$motivo;
        $idsMotivo = [];
        foreach ($motivoArray as $i => $id) {
            $chave = ":mot" . $i;
            $idsMotivo[] = $chave;
            $params[$chave] = $id;
        }

        // Se o array de motivos estiver vazio, retorna vazio para evitar erro de SQL
        if (empty($idsMotivo)) return [];

        $listaMotivos = implode(', ', $idsMotivo);
        $query = "SELECT * FROM hospedagens WHERE hos_estadiamotivo IN ($listaMotivos)";

        // --- 2. MÓDULO (Opcional) ---
        // Só entra no IF se o usuário tiver selecionado pelo menos um módulo
        if (!empty($modulo)) {
            $moduloArray = (array)$modulo;
            $idsModulo = [];
            foreach ($moduloArray as $i => $id) {
                $chave = ":mod" . $i;
                $idsModulo[] = $chave;
                $params[$chave] = $id;
            }
            
            $listaModulos = implode(', ', $idsModulo);
            // Só concatena o AND se houver módulos para filtrar
            $query .= " AND hos_modulo IN ($listaModulos)";
        }

        $buscarHospedagens = $pdo->prepare($query);

        // Faz o bind de todos os parâmetros (motivos e módulos, se houver)
        foreach ($params as $chave => $valor) {
            $buscarHospedagens->bindValue($chave, $valor);
        }

        $buscarHospedagens->execute();
        return $buscarHospedagens->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function excluirHospedagem($ident)
    {
        $pdo = $this->conectar();

        $excluirHospedagem = $pdo->prepare("DELETE FROM hospedagens WHERE idhospedagens = :id");
        $excluirHospedagem->bindValue(":id",$ident);
        $excluirHospedagem->execute();

        return $excluirHospedagem->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarHospedagem($ident)
    {
        $pdo = $this->conectar();

        $buscarHospedagem = $pdo->prepare("SELECT * FROM hospedagens WHERE idhospedagens = :id");
        $buscarHospedagem->bindValue(":id",$ident);
        $buscarHospedagem->execute();

        return $buscarHospedagem->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarHospedagemRecibo($ident)
    {
        $pdo = $this->conectar();

        $buscarHospedagemRecibo = $pdo->prepare("SELECT * FROM hospedagens INNER JOIN mainhospedagem ON hospedagens.hos_estadiamotivo = mainhospedagem.idmainhospedagem WHERE hospedagens.idhospedagens = :id");
        $buscarHospedagemRecibo->bindValue(":id",$ident);
        $buscarHospedagemRecibo->execute();

        return $buscarHospedagemRecibo->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function configHospedagens($dados)
    {
        $pdo = $this->conectar();

        $configHospedagens = $pdo->prepare("INSERT INTO confighospedagens (
            idconfighospedagens,
            chos_acolhida
        ) VALUES (
            :idconfighospedagens,
            :chos_acolhida
        ) ON DUPLICATE KEY UPDATE 
            chos_acolhida = :chos_acolhida
        ");
        $configHospedagens->bindParam(":idconfighospedagens",$dados['frIdConfigHospedagens'],\PDO::PARAM_INT);
        $configHospedagens->bindParam(":chos_acolhida",$dados['frAcolhida'],\PDO::PARAM_STR);
        $configHospedagens->execute();
    }

    public function buscarConfigHospedagens($ident)
    {
        $pdo = $this->conectar();

        $buscarConfigHospedagens = $pdo->prepare("SELECT * FROM confighospedagens WHERE idconfighospedagens = :id");
        $buscarConfigHospedagens->bindValue(":id",$ident);
        $buscarConfigHospedagens->execute();

        return $buscarConfigHospedagens->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function altLavanderia($dados)
    {
        $pdo = $this->conectar();

        $altLavanderia = $pdo->prepare("INSERT INTO lavanderia (
            idlavanderia,
            lav_servico
        ) VALUES (
            :idlavanderia,
            :lav_servico
        ) ON DUPLICATE KEY UPDATE 
            lav_servico = :lav_servico
        ");
        $altLavanderia->bindParam(":idlavanderia",$dados['frIdLavanderia'],\PDO::PARAM_INT);
        $altLavanderia->bindParam(":lav_servico",$dados['frServico'],\PDO::PARAM_STR);
        $altLavanderia->execute();
    }

    public function buscarLavanderias()
    {
        $pdo = $this->conectar();

        $buscarLavanderias = $pdo->prepare("SELECT * FROM lavanderia");
        $buscarLavanderias->execute();

        return $buscarLavanderias->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarLavanderia($ident)
    {
        $pdo = $this->conectar();

        $buscarLavanderia = $pdo->prepare("SELECT * FROM lavanderia WHERE idlavanderia = :id");
        $buscarLavanderia->bindValue(":id",$ident);
        $buscarLavanderia->execute();

        return $buscarLavanderia->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function excluirLavanderia($ident)
    {
        $pdo = $this->conectar();

        $excluirLavanderia = $pdo->prepare("DELETE FROM lavanderia WHERE idlavanderia = :id");
        $excluirLavanderia->bindValue(":id",$ident);
        $excluirLavanderia->execute();
    }

    public function altMain($dados)
    {
        $pdo = $this->conectar();

        $altMain = $pdo->prepare("INSERT INTO mainhospedagem (
            idmainhospedagem,
            main_motivo,
            main_host,
            main_seguranca,
            main_porta,
            main_remetente,
            main_email,
            main_senha,
            main_mensagemtela,
            main_mensagememail,
            main_termos,
            main_recibo_pessoal,
            main_recibo_terceiros,
            main_recibo_mensagem,
            main_status
        ) VALUES (
            :idmainhospedagem,
            :main_motivo,
            :main_host,
            :main_seguranca,
            :main_porta,
            :main_remetente,
            :main_email,
            :main_senha,
            :main_mensagemtela,
            :main_mensagememail,
            :main_termos,
            :main_recibo_pessoal,
            :main_recibo_terceiros,
            :main_recibo_mensagem,
            :main_status
        ) ON DUPLICATE KEY UPDATE 
            main_motivo = :main_motivo,
            main_host = :main_host,
            main_seguranca = :main_seguranca,
            main_porta = :main_porta,
            main_remetente = :main_remetente,
            main_email = :main_email,
            main_senha = :main_senha,
            main_mensagemtela = :main_mensagemtela,
            main_mensagememail = :main_mensagememail,
            main_termos = :main_termos,
            main_recibo_pessoal = :main_recibo_pessoal,
            main_recibo_terceiros = :main_recibo_terceiros,
            main_recibo_mensagem = :main_recibo_mensagem,
            main_status = :main_status
        ");
        $altMain->bindParam(":idmainhospedagem",$dados['frIdMain']);
        $altMain->bindParam(":main_motivo",$dados['frMotivo']);
        $altMain->bindParam(":main_host",$dados['frHost']);
        $altMain->bindParam(":main_seguranca",$dados['frSeguranca']);
        $altMain->bindParam(":main_porta",$dados['frPorta']);
        $altMain->bindParam(":main_remetente",$dados['frRemetente']);
        $altMain->bindParam(":main_email",$dados['frEmail']);
        $altMain->bindParam(":main_senha",$dados['frSenha']);
        $altMain->bindParam(":main_mensagemtela",$dados['frTela']);
        $altMain->bindParam(":main_mensagememail",$dados['frMsgEmail']);
        $altMain->bindParam(":main_termos",$dados['frTermos']);
        $altMain->bindParam(":main_recibo_pessoal",$dados['frReciboPessoal']);
        $altMain->bindParam(":main_recibo_terceiros",$dados['frReciboTerceiros']);
        $altMain->bindParam(":main_recibo_mensagem",$dados['frReciboMensagem']);
        $altMain->bindParam(":main_status",$dados['frStatus']);
        $altMain->execute();
    }

    public function duplicarMainHospedagem($ident)
    {
        $pdo = $this->conectar();

        // Invertemos o CONCAT para colocar 'Cópia de ' antes do nome original
        $sql = "INSERT INTO mainhospedagem (
                    main_motivo, main_host, main_seguranca, main_porta, 
                    main_remetente, main_email, main_senha, main_mensagemtela, 
                    main_mensagememail, main_termos, main_recibo_terceiros, 
                    main_recibo_pessoal, main_recibo_mensagem, main_status
                )
                SELECT 
                    CONCAT('Cópia de ', main_motivo), main_host, main_seguranca, main_porta, 
                    main_remetente, main_email, main_senha, main_mensagemtela, 
                    main_mensagememail, main_termos, main_recibo_terceiros, 
                    main_recibo_pessoal, main_recibo_mensagem, main_status
                FROM mainhospedagem 
                WHERE idmainhospedagem = :id";

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', $ident, \PDO::PARAM_INT);
            $stmt->execute();

            // Retorna o ID da nova hospedagem gerada
            return $pdo->lastInsertId();

        } catch (\PDOException $e) {
            // Trate o erro de acordo com o seu sistema
            return false;
        }
    }

    public function buscarEstadias()
    {
        $pdo = $this->conectar();

        $buscarEstadias = $pdo->prepare("SELECT * FROM mainhospedagem");
        $buscarEstadias->execute();

        return $buscarEstadias->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarEstadiasMotivo()
    {
        $pdo = $this->conectar();

        $buscarEstadiasMotivo = $pdo->prepare("SELECT idmainhospedagem,main_motivo FROM mainhospedagem");
        $buscarEstadiasMotivo->execute();

        return $buscarEstadiasMotivo->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarEstadiasMotivoExterno()
    {
        $pdo = $this->conectar();

        $buscarEstadiasMotivoExterno = $pdo->prepare("SELECT idmainhospedagem,main_motivo FROM mainhospedagem WHERE main_status = 'Ativo'");
        $buscarEstadiasMotivoExterno->execute();

        return $buscarEstadiasMotivoExterno->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarEstadia($ident)
    {
        $pdo = $this->conectar();

        $buscarEstadia = $pdo->prepare("SELECT * FROM mainhospedagem WHERE idmainhospedagem = :id");
        $buscarEstadia->bindValue(":id",$ident);
        $buscarEstadia->execute();

        return $buscarEstadia->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function excluirEstadia($ident)
    {
        $pdo = $this->conectar();

        $excluirEstadia = $pdo->prepare("DELETE FROM mainhospedagem WHERE idmainhospedagem = :id");
        $excluirEstadia->bindValue(":id",$ident);
        $excluirEstadia->execute();
    }

    public function filtroHospedagens($dados)
    {
        $pdo = $this->conectar();

        $filtroHospedagens = $pdo->prepare("INSERT INTO confighospedagens (
            idconfighospedagens,
            chos_invisiveis,
            chos_visiveis
        ) VALUES (
            :idconfighospedagens,
            :chos_invisiveis,
            :chos_visiveis
        ) ON DUPLICATE KEY UPDATE 
            chos_invisiveis = :chos_invisiveis,
            chos_visiveis = :chos_visiveis
        ");
        $filtroHospedagens->bindValue(":idconfighospedagens",1,\PDO::PARAM_INT);
        $filtroHospedagens->bindValue(":chos_invisiveis",$dados['frInvisiveis'],\PDO::PARAM_STR);
        $filtroHospedagens->bindValue(":chos_visiveis",$dados['frVisiveis'],\PDO::PARAM_STR);
        $filtroHospedagens->execute();
    }

    public function altModulos($dados)
    {
        $pdo = $this->conectar();

        $altModulos = $pdo->prepare("INSERT INTO modulos (
            idmodulos,
            mod_nome,
            mod_status
        ) VALUES (
            :idmodulos,
            :mod_nome,
            :mod_status
        ) ON DUPLICATE KEY UPDATE 
            mod_nome = :mod_nome,
            mod_status = :mod_status
        ");
        $altModulos->bindValue(":idmodulos",$dados['frIdModulo']);
        $altModulos->bindValue(":mod_nome",$dados['frModulo']);
        $altModulos->bindValue(":mod_status",$dados['frStatusModulo']);
        $altModulos->execute();
    }

    public function excluirModulo($ident)
    {
        $pdo = $this->conectar();

        $excluirModulo = $pdo->prepare("DELETE FROM modulos WHERE idmodulos = :id");
        $excluirModulo->bindValue(":id",$ident);
        $excluirModulo->execute();
    }

    public function buscarModulo($ident)
    {
        $pdo = $this->conectar();

        $buscarModulo = $pdo->prepare("SELECT * FROM modulos WHERE idmodulos = :id");
        $buscarModulo->bindValue(":id",$ident);
        $buscarModulo->execute();

        return $buscarModulo->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarModulos()
    {
        $pdo = $this->conectar();

        $buscarModulos = $pdo->prepare("SELECT * FROM modulos");
        $buscarModulos->execute();

        return $buscarModulos->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarModulosExterno()
    {
        $pdo = $this->conectar();

        $buscarModulosExterno = $pdo->prepare("SELECT * FROM modulos WHERE mod_status = 'Ativo'");
        $buscarModulosExterno->execute();

        return $buscarModulosExterno->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function altStatus($dados)
    {
        $pdo = $this->conectar();

        $altStatus = $pdo->prepare("INSERT INTO statushospedagem (
            idstatushospedagem,
            sta_nome,
            sta_status
        ) VALUES (
            :idstatushospedagem,
            :sta_nome,
            :sta_status
        ) ON DUPLICATE KEY UPDATE 
            sta_nome = :sta_nome,
            sta_status = :sta_status
        ");
        $altStatus->bindValue(":idstatushospedagem",$dados['frIdStatusHospedagem']);
        $altStatus->bindValue(":sta_nome",$dados['frStatusNome']);
        $altStatus->bindValue(":sta_status",$dados['frStatusStatus']);
        $altStatus->execute();
    }

    public function buscarStatus($ident)
    {
        $pdo = $this->conectar();

        $buscarStatus = $pdo->prepare("SELECT * FROM statushospedagem WHERE idstatushospedagem = :id");
        $buscarStatus->bindValue(":id",$ident);
        $buscarStatus->execute();

        return $buscarStatus->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function excluirStatus($ident)
    {
        $pdo = $this->conectar();

        $excluirStatus = $pdo->prepare("DELETE FROM statushospedagem WHERE idstatushospedagem = :id");
        $excluirStatus->bindValue(":id",$ident);
        $excluirStatus->execute();
    }

    public function buscarAllStatus()
    {
        $pdo = $this->conectar();

        $buscarAllStatus = $pdo->prepare("SELECT * FROM statushospedagem");
        $buscarAllStatus->execute();

        return $buscarAllStatus->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarAllStatusAtivos()
    {
        $pdo = $this->conectar();

        $buscarAllStatusAtivos = $pdo->prepare("SELECT * FROM statushospedagem WHERE sta_status = 'Ativo'");
        $buscarAllStatusAtivos->execute();

        return $buscarAllStatusAtivos->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function altStatusHospedagem($dados)
    {
        $pdo = $this->conectar();

        $altStatusHospedagem = $pdo->prepare("UPDATE hospedagens SET hos_status = :sta WHERE idhospedagens = :id");
        $altStatusHospedagem->bindValue(":sta",$dados['status']);
        $altStatusHospedagem->bindValue(":id",$dados['id']);
        $altStatusHospedagem->execute();
    }

    public function altCheckInHospedagem($dados)
    {
        $pdo = $this->conectar();

        $altCheckInHospedagem = $pdo->prepare("UPDATE hospedagens SET hos_checkin = :datahora WHERE idhospedagens = :id");
        if($dados['datahora'] != ""){
            $altCheckInHospedagem->bindValue(":datahora",str_replace(" ","T",$dados['datahora']));
        } else {
            $altCheckInHospedagem->bindValue(":datahora",NULL);
        }
        $altCheckInHospedagem->bindValue(":id",$dados['id']);
        $altCheckInHospedagem->execute();
    }

    public function altCheckOutHospedagem($dados)
    {
        $pdo = $this->conectar();

        $altCheckOutHospedagem = $pdo->prepare("UPDATE hospedagens SET hos_checkout = :datahora WHERE idhospedagens = :id");
        if($dados['datahora'] != ""){
            $altCheckOutHospedagem->bindValue(":datahora",str_replace(" ","T",$dados['datahora']));
        } else {
            $altCheckOutHospedagem->bindValue(":datahora",NULL);
        }
        $altCheckOutHospedagem->bindValue(":id",$dados['id']);
        $altCheckOutHospedagem->execute();
    }

    public function altQuarto($dados)
    {
        $pdo = $this->conectar();

        $altQuarto = $pdo->prepare("INSERT INTO hos_quartos (
            idhos_quartos,
            hos_qua_nome,
            hos_qua_status
        ) VALUES (
            :idhos_quartos,
            :hos_qua_nome,
            :hos_qua_status
        ) ON DUPLICATE KEY UPDATE 
            hos_qua_nome = :hos_qua_nome,
            hos_qua_status = :hos_qua_status
        ");
        $altQuarto->bindValue(":idhos_quartos",$dados['frIdQuartoHospedagem']);
        $altQuarto->bindValue(":hos_qua_nome",$dados['frQuartoNome']);
        $altQuarto->bindValue(":hos_qua_status",$dados['frQuartoStatus']);
        $altQuarto->execute();
    }

    public function excluirQuarto($ident)
    {
        $pdo = $this->conectar();

        $excluirQuarto = $pdo->prepare("DELETE FROM hos_quartos WHERE idhos_quartos = :id");
        $excluirQuarto->bindValue(":id",$ident);
        $excluirQuarto->execute();
    }

    public function buscarQuarto($ident)
    {
        $pdo = $this->conectar();

        $buscarQuarto = $pdo->prepare("SELECT * FROM hos_quartos WHERE idhos_quartos = :id");
        $buscarQuarto->bindValue(":id",$ident);
        $buscarQuarto->execute();

        return $buscarQuarto->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarQuartos()
    {
        $pdo = $this->conectar();

        $buscarQuartos = $pdo->prepare("SELECT * FROM hos_quartos");
        $buscarQuartos->execute();

        return $buscarQuartos->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function buscarQuartosExterno()
    {
        $pdo = $this->conectar();

        $buscarQuartosExterno = $pdo->prepare("SELECT * FROM hos_quartos WHERE hos_qua_status = 'Ativo'");
        $buscarQuartosExterno->execute();

        return $buscarQuartosExterno->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function altQuartoHospedagem($dados)
    {
        $pdo = $this->conectar();

        $altQuartoHospedagem = $pdo->prepare("UPDATE hospedagens SET hos_quarto = :qua WHERE idhospedagens = :id");
        $altQuartoHospedagem->bindValue(":qua",$dados['quarto']);
        $altQuartoHospedagem->bindValue(":id",$dados['id']);
        $altQuartoHospedagem->execute();
    }

    public function altInativo($dados)
    {
        $pdo = $this->conectar();

        $altInativo = $pdo->prepare("UPDATE confighospedagens SET chos_ativar = :ativar, chos_txtinativo = :txt WHERE idconfighospedagens = 1");
        $altInativo->bindValue(":ativar",$dados['frAtivar']);
        $altInativo->bindValue(":txt",$dados['frTxtInativo']);
        $altInativo->execute();
    }

}