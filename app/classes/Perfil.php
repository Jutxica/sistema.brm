<?php

namespace App\classes;

class Perfil extends Conexao {

	public function buscarConfiguracoesPerfil()
	{
		$pdo = $this->conectar();

		$buscarConfiguracoesPerfil = $pdo->prepare("SELECT * FROM configperfil");
		$buscarConfiguracoesPerfil->execute();

		return $buscarConfiguracoesPerfil->fetchAll(\PDO::FETCH_ASSOC);
	}

	public function atualizarFiltroPerfil($dados)
	{
		$pdo = $this->conectar();

        $atualizarFiltroPerfil = $pdo->prepare("INSERT INTO configperfil (
            idconfigperfil,
            cpe_invisiveis,
            cpe_visiveis
        ) VALUES (
            :idconfigperfil,
            :cpe_invisiveis,
            :cpe_visiveis
        ) ON DUPLICATE KEY UPDATE 
            cpe_invisiveis = :cpe_invisiveis,
            cpe_visiveis = :cpe_visiveis
        ");
        $atualizarFiltroPerfil->bindValue(":idconfigperfil",1,\PDO::PARAM_INT);
        $atualizarFiltroPerfil->bindValue(":cpe_invisiveis",$dados['frInvisiveis'],\PDO::PARAM_STR);
        $atualizarFiltroPerfil->bindValue(":cpe_visiveis",$dados['frVisiveis'],\PDO::PARAM_STR);
        $atualizarFiltroPerfil->execute();
	}

    public function altPerfil($dados)
    {
        $pdo = $this->conectar();

        $altPerfil = $pdo->prepare("INSERT INTO perfil (
            idperfil,
            per_foto,
            per_nome,
            per_email,
            per_nascimento,
            per_genero,
            per_estadocivil,
            per_nacionalidade,
            per_cpf,
            per_rg,
            per_passaporte,
            per_pais,
            per_estado,
            per_cidade,
            per_bairro,
            per_logradouro,
            per_cep,
            per_numero,
            per_complemento
        ) VALUES (
            :idperfil,
            :per_foto,
            :per_nome,
            :per_email,
            :per_nascimento,
            :per_genero,
            :per_estadocivil,
            :per_nacionalidade,
            :per_cpf,
            :per_rg,
            :per_passaporte,
            :per_pais,
            :per_estado,
            :per_cidade,
            :per_bairro,
            :per_logradouro,
            :per_cep,
            :per_numero,
            :per_complemento
        ) ON DUPLICATE KEY UPDATE 
            per_foto = :per_foto,
            per_nome = :per_nome,
            per_email = :per_email,
            per_nascimento = :per_nascimento,
            per_genero = :per_genero,
            per_estadocivil = :per_estadocivil,
            per_nacionalidade = :per_nacionalidade,
            per_cpf = :per_cpf,
            per_rg = :per_rg,
            per_passaporte = :per_passaporte,
            per_pais = :per_pais,
            per_estado = :per_estado,
            per_cidade = :per_cidade,
            per_bairro = :per_bairro,
            per_logradouro = :per_logradouro,
            per_cep = :per_cep,
            per_numero = :per_numero,
            per_complemento = :per_complemento
        ");
        $altPerfil->bindValue(":idperfil",$dados['frIdPerfil']);
        $altPerfil->bindValue(":per_foto",$dados['frNovaFotoPerfil']);
        $altPerfil->bindValue(":per_nome",$dados['frNomePerfil']);
        $altPerfil->bindValue(":per_email",$dados['frEmailPerfil']);
        $altPerfil->bindValue(":per_nascimento",$dados['frNascimentoPerfil']);
        $altPerfil->bindValue(":per_genero",$dados['frGeneroPerfil']);
        $altPerfil->bindValue(":per_estadocivil",$dados['frEstadoCivilPerfil']);
        $altPerfil->bindValue(":per_nacionalidade",$dados['frNacionalidadePerfil']);
        $altPerfil->bindValue(":per_cpf",$dados['frCpfPerfil']);
        $altPerfil->bindValue(":per_rg",$dados['frRgPerfil']);
        $altPerfil->bindValue(":per_passaporte",$dados['frPassaportePerfil']);
        $altPerfil->bindValue(":per_pais",$dados['frPaisPerfil']);
        $altPerfil->bindValue(":per_estado",$dados['frEstadoPerfil']);
        $altPerfil->bindValue(":per_cidade",$dados['frCidadePerfil']);
        $altPerfil->bindValue(":per_bairro",$dados['frBairroPerfil']);
        $altPerfil->bindValue(":per_logradouro",$dados['frEnderecoPerfil']);
        $altPerfil->bindValue(":per_cep",$dados['frCepPerfil']);
        $altPerfil->bindValue(":per_numero",$dados['frNumeroPerfil']);
        $altPerfil->bindValue(":per_complemento",$dados['frComplementoPerfil']);
        $altPerfil->execute();

    }

    public function altContatos($dados,$perfil)
    {
        $pdo = $this->conectar();

        foreach($dados['frTipoContatoPerfil'] as $chave => $frTipoContatoPerfilL){
            $altContatos = $pdo->prepare("INSERT INTO contatos (
                idcontatos,
                con_tipo,
                con_numero,
                con_observacoes,
                perfil_idperfil
            ) VALUES (
                :idcontatos,
                :con_tipo,
                :con_numero,
                :con_observacoes,
                :perfil_idperfil
            ) ON DUPLICATE KEY UPDATE 
                con_tipo = :con_tipo,
                con_numero = :con_numero,
                con_observacoes = :con_observacoes
            ");
            $altContatos->bindValue(":idcontatos",$dados['frIdContato'][$chave]);
            $altContatos->bindValue(":con_tipo",$frTipoContatoPerfilL);
            $altContatos->bindValue(":con_numero",$dados['frContatoPerfil'][$chave]);
            $altContatos->bindValue(":con_observacoes",$dados['frObsContatoPerfil'][$chave]);
            $altContatos->bindValue(":perfil_idperfil",$perfil);
            $altContatos->execute();
        }
    }

}