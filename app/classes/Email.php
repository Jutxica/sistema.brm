<?php

namespace App\classes;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Email extends Conexao {

    private $host;
    private $seguranca;
    private $porta;
    private $nome;
    private $email;
    private $senha;

    public function variaveis($msg,$dados,$lastId = "")
    {
        $mensagem = str_replace('[[hierarquia]]', $dados['frcategoria'], $msg);
        $mensagem = str_replace('[[id]]', $lastId, $mensagem);
        $mensagem = str_replace('[[nome]]', $dados['frnome'], $mensagem);
        $mensagem = str_replace('[[nascimento]]', $dados['frnascimento'], $mensagem);
        $mensagem = str_replace('[[cpfrg]]', $dados['frcpfrg'], $mensagem);
        $mensagem = str_replace('[[email]]', $dados['fremail'], $mensagem);
        $mensagem = str_replace('[[celular]]', $dados['frtelefone'], $mensagem);
        $mensagem = str_replace('[[telefoneemergencia]]', $dados['frtelefoneemergencia'], $mensagem);
        $mensagem = str_replace('[[endereco]]', $dados['frlogradouro'], $mensagem);
        $mensagem = str_replace('[[numero]]', $dados['frnumero'], $mensagem);
        $mensagem = str_replace('[[cep]]', $dados['frcep'], $mensagem);
        $mensagem = str_replace('[[bairro]]', $dados['frbairro'], $mensagem);
        $mensagem = str_replace('[[cidade]]', $dados['frcidade'], $mensagem);
        $mensagem = str_replace('[[estado]]', $dados['frestado'], $mensagem);
        $mensagem = str_replace('[[alergico]]', $dados['fralergico'], $mensagem);
        $mensagem = str_replace('[[qualalergia]]', $dados['frespecifiquealergia'], $mensagem);
        $mensagem = str_replace('[[restricao]]', $dados['frrestricaoalimentar'], $mensagem);
        $mensagem = str_replace('[[qualrestricao]]', $dados['frespecifiquerestricao'], $mensagem);
        $mensagem = str_replace('[[lavanderia]]', $dados['frlavanderia'], $mensagem);
        $mensagem = str_replace('[[motivoestadia]]', $dados['frestadiamotivo'], $mensagem);
        $mensagem = str_replace('[[chegada]]', $dados['frprevisaochegada'], $mensagem);
        $mensagem = str_replace('[[saida]]', $dados['frprevisaosaida'], $mensagem);
        $mensagem = str_replace('[[termo]]', $dados['frtermo'], $mensagem);

        return $mensagem;
    }

    public function buscarEstadiaMail($ident)
    {
        $pdo = $this->conectar();

        $buscarEstadiaMail = $pdo->prepare("SELECT * FROM mainhospedagem WHERE idmainhospedagem = :id");
        $buscarEstadiaMail->bindValue(":id",$ident);
        $buscarEstadiaMail->execute();

        return $buscarEstadiaMail->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function email($dados,$lastId)
    {
        $estadia = $this->buscarEstadiaMail($dados['frestadiamotivo']);

        $this->host = $estadia[0]['main_host'];
        $this->seguranca = $estadia[0]['main_seguranca'];
        $this->porta = $estadia[0]['main_porta'];
        $this->nome = $estadia[0]['main_remetente'];
        $this->email = $estadia[0]['main_email'];
        $this->senha = $estadia[0]['main_senha'];

        $mensagem = $this->variaveis($estadia[0]['main_mensagememail'],$dados,$lastId);

        $this->enviarEmail($dados['fremail'], "Ficha de Hospedagem - Sistema BRM", $mensagem, $lastId, $dados['frestadiamotivo']);
    }
    
    public function enviarEmail($destinatario, $assunto, $mensagem, $id, $termo)
    {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();

            $mail->SMTPDebug = 2;
            $mail->Debugoutput = function($str, $level) {
                file_put_contents('log_email_debug.txt', date('Y-m-d H:i:s') . " - DEBUG: $str\n", FILE_APPEND);
            };

            $mail->Host = $this->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->email;
            $mail->Password = $this->senha;
            $mail->SMTPSecure = $this->seguranca;
            $mail->Port = $this->porta;

            $mail->setFrom($this->email, $this->nome);
            $mail->addAddress($destinatario);
            $mail->isHTML(true);
            $mail->Subject = utf8_decode($assunto);
            $mail->Body    = utf8_decode($mensagem);

            // 🔽 Primeiro anexo
            $url1 = "https://sistema.brm.org.br/ficha-hospedagem/".$id;
            $tempFile1 = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "ficha.pdf";
            file_put_contents($tempFile1, file_get_contents($url1));
            if (file_exists($tempFile1)) {
                $mail->addAttachment($tempFile1, "FichaHospedagem.pdf");
            }

            // 🔽 Segundo anexo
            $url2 = "https://sistema.brm.org.br/termos-pdf/".$termo;
            $tempFile2 = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "termos.pdf";
            file_put_contents($tempFile2, file_get_contents($url2));
            if (file_exists($tempFile2)) {
                $mail->addAttachment($tempFile2, "Termos.pdf");
            }

            if (!$mail->send()) {
                file_put_contents('log_email_erro_rec.txt', date('Y-m-d H:i:s') . " - Falha ao enviar e-mail para {$destinatario}: " . $mail->ErrorInfo . "\n", FILE_APPEND);
            }

        } catch (Exception $e) {
            file_put_contents('log_email_erro_rec.txt', date('Y-m-d H:i:s') . " - Erro ao enviar e-mail para {$this->email} com assunto '{$assunto}': " . $mail->ErrorInfo . "\n", FILE_APPEND);
        }

    }

    public function buscarHospedagemReciboEmail($ident)
    {
        $pdo = $this->conectar();

        $buscarHospedagemReciboEmail = $pdo->prepare("SELECT * FROM hospedagens INNER JOIN mainhospedagem ON hospedagens.hos_estadiamotivo = mainhospedagem.idmainhospedagem WHERE hospedagens.idhospedagens = :id");
        $buscarHospedagemReciboEmail->bindValue(":id",$ident);
        $buscarHospedagemReciboEmail->execute();

        return $buscarHospedagemReciboEmail->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function enviarRecibo($id)
    {
        $info = $this->buscarHospedagemReciboEmail($id);

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();

            $mail->SMTPDebug = 2;
            $mail->Debugoutput = function($str, $level) {
                file_put_contents('log_email_debug.txt', date('Y-m-d H:i:s') . " - DEBUG: $str\n", FILE_APPEND);
            };

            $mail->Host = $info[0]['main_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $info[0]['main_email'];
            $mail->Password = $info[0]['main_senha'];
            $mail->SMTPSecure = $info[0]['main_seguranca'];
            $mail->Port = $info[0]['main_porta'];

            $mail->setFrom($info[0]['main_email'], $info[0]['main_remetente']);
            $mail->addAddress($info[0]['hos_email']);
            $mail->isHTML(true);
            $mail->Subject = utf8_decode("Recibo - Hospedagem BRM");

            $msgRec = $info[0]['main_recibo_mensagem'];

            $msgRec = str_replace('[[hos_nome]]', $info[0]['hos_nome'], $msgRec);
            $msgRec = str_replace('[[hos_cpfrg]]', $info[0]['hos_cpfrg'], $msgRec);

            $mail->Body    = utf8_decode($msgRec);

            // 🔽 Primeiro anexo
            $url1 = "https://sistema.brm.org.br/recibo-pdf/".$id;
            $tempFile1 = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "recibo.pdf";
            file_put_contents($tempFile1, file_get_contents($url1));
            if (file_exists($tempFile1)) {
                $mail->addAttachment($tempFile1, "recibo.pdf");
            }

            if (!$mail->send()) {
                file_put_contents('log_email_recibo.txt', date('Y-m-d H:i:s') . " - Falha ao enviar e-mail para {$destinatario}: " . $mail->ErrorInfo . "\n", FILE_APPEND);
            }

        } catch (Exception $e) {
            file_put_contents('log_email_recibo.txt', date('Y-m-d H:i:s') . " - Erro ao enviar e-mail para {$this->email} com assunto '{$assunto}': " . $mail->ErrorInfo . "\n", FILE_APPEND);
        }

    }

}
