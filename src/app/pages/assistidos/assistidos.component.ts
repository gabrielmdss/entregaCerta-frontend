import { Component, OnInit } from '@angular/core';
import { Assistido } from '../../models/assistido.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AssistidosService } from '../../services/assistidos.service';
import { DocumentPipe } from '../../utils/pipes/document.pipe';
import { DocumentMaskDirective } from '../../utils/directives/document-mask.directive';
import Swal from 'sweetalert2';
import { UploadService } from '../../services/upload.service';
import { DialogDirective } from '../../shared/directives/dialog.directive';

/** Mensagem da API com fallback seguro (err.error pode ser nulo, string ou objeto). */
function mensagemErro(err: any, fallback: string): string {
  const msg = err?.error?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

/**
 * A API devolve `data_nascimento` como ISO com hora em UTC (coluna @db.Date, ex.
 * "1990-05-10T00:00:00.000Z"). O <input type="date"> só aceita yyyy-MM-dd; a parte da data
 * é lida como texto (sem conversão de fuso) para não "voltar um dia" em UTC-3.
 */
function paraInputDate(valor: Date | string | null | undefined): string {
  if (!valor) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(valor instanceof Date ? valor.toISOString() : String(valor));
  return m ? m[1] : '';
}

/**
 * Inverso de paraInputDate para o PUT: o repository repassa `data_nascimento` direto ao
 * Prisma (sem `new Date`, ao contrário do POST), que exige DateTime ISO completo. Envia o
 * mesmo formato que o GET devolveu (meia-noite UTC).
 */
function paraIsoUtc(valor: Date | string | null | undefined): Date | string | null | undefined {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? `${valor}T00:00:00.000Z`
    : valor;
}

const vazio = (): Assistido => ({ id: 0, nome: '', data_nascimento: '', documento: '', imagem: '' });

@Component({
  selector: 'app-assistidos',
  imports: [CommonModule, FormsModule, DocumentPipe, DocumentMaskDirective, DialogDirective],
  templateUrl: './assistidos.component.html',
  styleUrl: './assistidos.component.css',
})
export class AssistidosComponent implements OnInit {
  constructor(
    private assistidosService: AssistidosService,
    private uploadService: UploadService
  ) {}

  assistidos: Assistido[] = [];
  novoAssistido: Assistido = { id: 0, nome: '', documento: '' };
  atualizarAssistido: Assistido = { id: 0, nome: '', documento: '' };
  assistidosFiltrados: Assistido[] = [];
  searchTerm: string = '';

  isLoading: boolean = false;
  /** Falha ao carregar a lista (rede/5xx). */
  erroLista: boolean = false;
  mostrarModal: boolean = false;
  mostrarModalEditar: boolean = false;
  assistidoId: number | null = null;
  isUploading: boolean = false;
  /** Requisição de cadastro/edição em andamento (evita envio duplo). */
  isSalvando: boolean = false;
  /** Id do assistido cuja edição está sendo carregada (feedback no botão). */
  carregandoEdicaoId: number | null = null;
  erroUpload: string = '';
  /** Nome do arquivo escolhido no campo de foto (exibido ao lado do botão). */
  nomeArquivo: string = '';

  ngOnInit(): void {
    this.listarAssistidos();
  }

  /** Iniciais para o avatar sem foto (primeiro e último nome). Somente apresentação. */
  iniciais(nome: string | null | undefined): string {
    const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }

  listarAssistidos(): void {
    this.isLoading = true;
    this.erroLista = false;
    this.assistidosService
      .listarAssistidos()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: any) => {
          this.assistidos = Array.isArray(response) ? response : [];
          this.filtrarAssistidos();
        },
        error: () => {
          this.assistidos = [];
          this.assistidosFiltrados = [];
          this.erroLista = true;
        },
      });
  }

  /** Em erro o modal continua aberto com os dados digitados, para o usuário corrigir. */
  cadastrarAssistido(): void {
    if (this.isUploading || this.isSalvando) return;
    this.isSalvando = true;
    this.assistidosService
      .cadastrarAssistido(this.novoAssistido)
      .pipe(finalize(() => (this.isSalvando = false)))
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Assistido cadastrado!',
            text: 'O cadastro foi realizado com sucesso.',
            icon: 'success',
            theme: 'light',
            position: 'center',
          });
          this.listarAssistidos();
          this.limparInputs();
          this.closeModal();
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Erro no cadastro',
            text: mensagemErro(err, 'Ocorreu um problema ao cadastrar o Assistido. Tente novamente.'),
            icon: 'error',
            theme: 'light',
            position: 'center',
          });
        },
      });
  }

  editarAssistido(): void {
    if (this.isUploading || this.isSalvando) return;
    this.isSalvando = true;
    const payload: Assistido = {
      ...this.atualizarAssistido,
      data_nascimento: paraIsoUtc(this.atualizarAssistido.data_nascimento),
    };
    this.assistidosService
      .editarAssistido(this.assistidoId, payload)
      .pipe(finalize(() => (this.isSalvando = false)))
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Assistido Atualizado!',
            text: 'Os dados do assistido foram atualizados com sucesso.',
            icon: 'success',
            theme: 'light',
            position: 'center',
          });
          this.listarAssistidos();
          this.limparInputs();
          this.closeModalEditar();
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Erro ao atualizar',
            text: mensagemErro(
              err,
              'Ocorreu um problema ao atualizar os dados do Assistido. Tente novamente.'
            ),
            icon: 'error',
            theme: 'light',
            position: 'center',
          });
        },
      });
  }

  excluirAssistido(id: number): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-danger)',
      cancelButtonColor: 'var(--color-neutral)',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.assistidosService.excluirAssistido(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Assistido excluído com sucesso!',
              text: 'Os dados do assistido foram removidos permanentemente.',
              icon: 'success',
              theme: 'light',
              position: 'center',
            }).then(() => this.listarAssistidos());
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Erro ao excluir',
              text: mensagemErro(err, 'Houve um problema ao excluir os dados. Tente novamente.'),
              icon: 'error',
              theme: 'light',
              position: 'center',
            });
          },
        });
      }
    });
  }

  /**
   * Busca por nome (sem diferenciar maiúsculas) ou documento. O documento é comparado também
   * só pelos dígitos, para "123.456" encontrar "12345678901" (e vice-versa).
   */
  filtrarAssistidos(): void {
    const termo = this.searchTerm.trim();
    if (termo === '') {
      this.assistidosFiltrados = [...this.assistidos];
      return;
    }
    const termoMin = termo.toLowerCase();
    const termoDigitos = termo.replace(/\D/g, '');
    this.assistidosFiltrados = this.assistidos.filter((assistido) => {
      const doc = assistido.documento ?? '';
      return (
        (assistido.nome ?? '').toLowerCase().includes(termoMin) ||
        doc.includes(termo) ||
        (termoDigitos !== '' && doc.replace(/\D/g, '').includes(termoDigitos))
      );
    });
  }

  limparBusca(): void {
    this.searchTerm = '';
    this.filtrarAssistidos();
  }

  async onFileChangeCadastrar(event: any) {
    const url = await this.enviarImagem(event);
    if (url) this.novoAssistido.imagem = url;
  }

  async onFileChangeEditar(event: any) {
    const url = await this.enviarImagem(event);
    if (url) this.atualizarAssistido.imagem = url;
  }

  private async enviarImagem(event: any): Promise<string | null> {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return null;
    this.isUploading = true;
    this.erroUpload = '';
    try {
      return await this.uploadService.uploadImage(file);
    } catch {
      this.erroUpload = 'Não foi possível enviar a foto. Tente novamente.';
      return null;
    } finally {
      this.isUploading = false;
    }
  }

  openModal() {
    this.erroUpload = '';
    this.nomeArquivo = '';
    this.mostrarModal = true;
  }

  closeModal() {
    this.mostrarModal = false;
  }

  /** Abre o modal só com os dados carregados; falha no GET mostra feedback. */
  openModalEditar(id: number) {
    this.assistidoId = id;
    this.carregandoEdicaoId = id;
    this.assistidosService
      .obterAssistidoById(id)
      .pipe(finalize(() => (this.carregandoEdicaoId = null)))
      .subscribe({
        next: (response: Assistido) => {
          this.atualizarAssistido = {
            ...response,
            data_nascimento: paraInputDate(response?.data_nascimento),
          };
          this.erroUpload = '';
          this.nomeArquivo = '';
          this.mostrarModalEditar = true;
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Erro ao carregar assistido',
            text: mensagemErro(err, 'Não foi possível carregar os dados do Assistido. Tente novamente.'),
            icon: 'error',
            theme: 'light',
            position: 'center',
          });
        },
      });
  }

  closeModalEditar() {
    this.mostrarModalEditar = false;
  }

  limparInputs() {
    this.atualizarAssistido = vazio();
    this.novoAssistido = vazio();
  }
}
