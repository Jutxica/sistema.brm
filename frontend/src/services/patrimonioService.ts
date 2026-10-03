import { imoveisService } from './imoveisService';
import { veiculosService } from './veiculosService';
import { bensService } from './bensService';
import { contratosService } from './contratosService';
import { manutencoesService } from './manutencoesService';
import { documentosService } from './documentosService';
import { storageService } from './storageService';
import { auditoriaService } from './auditoriaService';
import { sincronizacaoService } from './sincronizacaoService';
import { dashboardService } from './dashboardService';
import { cepService } from './cepService';
import { cnpjService } from './cnpjService';
import { ocrService } from './ocrService';
import { relatoriosService } from './relatoriosService';

export const patrimonioService = {
  imoveis: imoveisService,
  veiculos: veiculosService,
  bens: bensService,
  contratos: contratosService,
  manutencoes: manutencoesService,
  documentos: documentosService,
  storage: storageService,
  auditoria: auditoriaService,
  sincronizacao: sincronizacaoService,
  dashboard: dashboardService,
  cep: cepService,
  cnpj: cnpjService,
  ocr: ocrService,
  relatorios: relatoriosService
};

export {
  imoveisService,
  veiculosService,
  bensService,
  contratosService,
  manutencoesService,
  documentosService,
  storageService,
  auditoriaService,
  sincronizacaoService,
  dashboardService,
  cepService,
  cnpjService,
  ocrService,
  relatoriosService
};

export default patrimonioService;
