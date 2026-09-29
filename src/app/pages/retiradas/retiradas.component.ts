import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Retirada } from '../../models/retirada.interface';
import { AssistidosService } from '../../services/assistidos.service';
import { Assistido } from '../../models/assistido.interface';
import { RetiradasService } from '../../services/retiradas.service';
import { SelectComponent } from '../../shared/components/select/select.component';
import { DocumentPipe } from '../../utils/pipes/document.pipe';
import { DialogDirective } from '../../shared/directives/dialog.directive';

/** Filtro aplicado à lista: assistido, intervalo de datas ou os dois combinados. */
type FiltroAtivo = 'assistido' | 'intervalo' | 'combinado' | null;

/** Valores efetivamente aplicados (independem dos campos editados depois). */
interface FiltroAplicado {
  assistidoId: number | null;
  inicio: string | null;
  fim: string | null;
}

/**
 * Dia UTC (yyyy-MM-dd) de uma data da API. O backend (/retirada/periodo) filtra
 * `data_retirada >= <inicio>T00:00:00.000Z` e `<= <fim>T23:59:59.999Z`, ou seja, dias UTC
 * com limites inclusivos; a tela exibe as datas com o fuso 'UTC'. Comparar o dia UTC como
 * string yyyy-MM-dd reproduz exatamente essa semântica.
 */
export function diaUtc(valor: string | Date | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** yyyy-MM-dd -> dd/MM/yyyy (somente para o texto do aviso). */
function dataBr(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Imagem padrão já usada pela tela quando o assistido não tem foto. */
const IMAGEM_PADRAO =
  'https://res.cloudinary.com/dhpteq1gq/image/upload/v1744070495/assistidos/pbhvegkmq5ia0wima4jd.jpg';

/** Mensagem da API com fallback seguro (err.error pode ser nulo, string ou objeto). */
function mensagemErro(err: any, fallback: string): string {
  const msg = err?.error?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

/** Converte a data da API (ISO com hora, UTC) para o formato do <input type="date">. */
function paraInputDate(valor: string | null | undefined): string {
  if (!valor) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(valor));
  return m ? m[1] : '';
}

@Component({
  selector: 'app-retiradas',
  imports: [FormsModule, CommonModule, SelectComponent, DocumentPipe, DialogDirective],
  templateUrl: './retiradas.component.html',
  styleUrl: './retiradas.component.css',
})
export class RetiradasComponent implements OnInit {
  readonly imagemPadrao = IMAGEM_PADRAO;

  assistidos: Assistido[] = [];
  assistidoIdFilter: number | null = null;
  dataInicialFilter: string | null = null;
  dataFinalFilter: string | null = null;
  isLoading: boolean = false;
  /** Falha ao carregar a lista (rede/5xx). */
  erroLista: boolean = false;
  /** Mensagem de validação/erro exibida junto aos filtros (sem travar a tela). */
  mensagemFiltro: string = '';

  mostrarModal: boolean = false;
  mostrarModalRegistrar: boolean = false;
  mostrarModalDetalhesAssistido: boolean = false;
  retiradaEditada: any = { nome: '', data_retirada: '' };

  /** Itens exibidos na página atual. */
  retiradas: Retirada[] = [];
  /** Resultado completo do filtro ativo (os endpoints de filtro não são paginados). */
  resultadoFiltro: Retirada[] = [];
  filtroAtivo: FiltroAtivo = null;
  filtroAplicado: FiltroAplicado = { assistidoId: null, inicio: null, fim: null };
  /** Retiradas do assistido exibidas no modal Detalhes (independem da página atual). */
  ultimasRetiradasAssistido: Retirada[] = [];

  totalRetiradas: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  itemsPerPageOptions: number[] = [5, 10, 20, 50];
  selectedPageSize: number = 10;
  imagemExpandida = false;

  novaRetirada: Retirada = {
    id: 0,
    assistido_id: 0,
    data_retirada: '',
    documento: '',
    nome: '',
  };

  assistidoDetalhes: Assistido = {
    id: 0,
    nome: '',
    documento: '',
  };

  constructor(
    private retiradasService: RetiradasService,
    private assistidosService: AssistidosService
  ) {}

  ngOnInit(): void {
    this.obterAssistidos();
    this.obterRetiradas(this.currentPage, this.selectedPageSize);
  }

  /** Quantidade total considerada na paginação (lista completa ou resultado do filtro). */
  get totalItens(): number {
    return this.filtroAtivo ? this.resultadoFiltro.length : this.totalRetiradas;
  }

  obterAssistidos(): void {
    this.assistidosService.listarAssistidos().subscribe({
      next: (response: any) => {
        this.assistidos = Array.isArray(response) ? response : [];
      },
      error: () => {
        this.assistidos = [];
      },
    });
  }

  /**
   * Carrega a página e o total juntos: o total de páginas só é calculado quando as duas
   * respostas chegam, independentemente da ordem (antes dependia de uma chamada paralela
   * e podia exibir "Página 1 de 0").
   */
  obterRetiradas(page: number, pageSize: number): void {
    this.isLoading = true;
    this.erroLista = false;
    forkJoin({
      lista: this.retiradasService.listarRetiradas(page, pageSize).pipe(
        map((r: any) => (Array.isArray(r) ? (r as Retirada[]) : []))
      ),
      total: this.retiradasService.obterQuantidadeRetiradas().pipe(
        map((t: any) => Number(t) || 0)
      ),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ lista, total }) => {
          this.filtroAtivo = null;
          this.filtroAplicado = { assistidoId: null, inicio: null, fim: null };
          this.resultadoFiltro = [];
          this.retiradas = lista;
          this.totalRetiradas = total;
          this.totalPages = Math.ceil(total / pageSize);
        },
        error: () => {
          this.retiradas = [];
          this.totalPages = 0;
          this.erroLista = true;
        },
      });
  }

  registrarRetirada(): void {
    this.retiradasService
      .registrarRetirada(this.novaRetirada.assistido_id, this.novaRetirada.data_retirada)
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Retirada cadastrada!',
            text: 'A Retirada foi realizada com sucesso.',
            icon: 'success',
            theme: 'light',
            position: 'center',
          });
          this.closeModalRegistrar();
          this.recarregarVisao();
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Erro ao retirar',
            text: mensagemErro(err, 'Ocorreu um problema ao registrar a retirada. Tente novamente.'),
            icon: 'error',
            theme: 'light',
            position: 'center',
          });
          this.closeModalRegistrar();
        },
      });
  }

  confirmarAlteracao() {
    this.retiradasService
      .atualizarRetirada(this.retiradaEditada.id, {
        assistido_id: this.retiradaEditada.assistido_id,
        data_retirada: this.retiradaEditada.data_retirada,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Alteração Efetuada!',
            text: 'A alteração foi realizada com sucesso.',
            icon: 'success',
            theme: 'light',
            position: 'center',
          });
          this.recarregarVisao();
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Erro ao alterar retirada',
            text: mensagemErro(
              err,
              'Ocorreu um problema ao alterar a retirada do Assistido. Tente novamente.'
            ),
            icon: 'error',
            theme: 'light',
            position: 'center',
          });
        },
      });
    this.mostrarModal = false;
  }

  /** Após escrita: reaplica o filtro ativo (valores aplicados) ou recarrega a página e o total. */
  private recarregarVisao(): void {
    if (this.filtroAtivo) {
      const { assistidoId, inicio, fim } = this.filtroAplicado;
      this.executarFiltro(assistidoId, inicio, fim, false);
    } else {
      this.obterRetiradas(this.currentPage, this.selectedPageSize);
    }
  }

  /** Texto do aviso "Filtrado por ..." descrevendo a combinação aplicada. */
  get descricaoFiltro(): string {
    const { assistidoId, inicio, fim } = this.filtroAplicado;
    const partes: string[] = [];
    if (assistidoId != null) {
      const nome = this.assistidos.find((a) => a.id === assistidoId)?.nome;
      partes.push(nome ? `assistido ${nome}` : 'assistido');
    }
    if (inicio && fim) partes.push(`período de ${dataBr(inicio)} a ${dataBr(fim)}`);
    return partes.length ? `Filtrado por ${partes.join(' e ')}.` : '';
  }

  /**
   * Botão único "Filtrar": aplica o assistido e/ou o intervalo preenchidos.
   * Validação no cliente: ao menos um filtro; intervalo exige as duas datas; início <= fim.
   */
  aplicarFiltros(): void {
    this.mensagemFiltro = '';
    const id = this.assistidoIdFilter;
    const inicio = this.dataInicialFilter || null;
    const fim = this.dataFinalFilter || null;
    if (inicio || fim) {
      if (!inicio || !fim) {
        this.mensagemFiltro = 'Informe a data inicial e a data final.';
        return;
      }
      if (inicio > fim) {
        this.mensagemFiltro = 'A data inicial não pode ser posterior à data final.';
        return;
      }
    }
    if (id == null && !inicio) {
      this.mensagemFiltro = 'Selecione um assistido ou informe um intervalo de datas.';
      return;
    }
    this.executarFiltro(id, inicio, fim, id != null);
  }

  /**
   * Somente assistido -> GET /retirada/assistido/:id; somente intervalo -> GET /retirada/periodo;
   * os dois -> GET /retirada/assistido/:id filtrado no cliente pelo dia UTC (limites
   * inclusivos, mesma regra do backend). Sem alterar contratos nem services.
   */
  private executarFiltro(
    id: number | null,
    inicio: string | null,
    fim: string | null,
    abrirDetalhes: boolean
  ): void {
    if (id != null) {
      this.buscarPorAssistido(id, abrirDetalhes, inicio && fim ? { inicio, fim } : null);
    } else if (inicio && fim) {
      this.buscarPorIntervalo(inicio, fim);
    }
  }

  private buscarPorAssistido(
    id: number,
    abrirDetalhes: boolean,
    intervalo: { inicio: string; fim: string } | null
  ): void {
    this.isLoading = true;
    this.erroLista = false;
    forkJoin({
      retiradas: this.listaFiltrada(this.retiradasService.selectByAssistidoId(id)),
      assistido: abrirDetalhes
        ? this.assistidosService.obterAssistidoById(id).pipe(catchError(() => of(null)))
        : of(null),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(({ retiradas, assistido }) => {
        if (retiradas === null) {
          this.mensagemFiltro = 'Não foi possível filtrar as retiradas. Tente novamente.';
          return;
        }
        const lista = intervalo
          ? retiradas.filter((r) => {
              const dia = diaUtc(r.data_retirada);
              return dia != null && dia >= intervalo.inicio && dia <= intervalo.fim;
            })
          : retiradas;
        this.aplicarFiltro(intervalo ? 'combinado' : 'assistido', lista, {
          assistidoId: id,
          inicio: intervalo?.inicio ?? null,
          fim: intervalo?.fim ?? null,
        });
        // Detalhes mostra o histórico do assistido, independente do período filtrado.
        this.ultimasRetiradasAssistido = retiradas.slice(0, 4);
        if (abrirDetalhes && assistido) {
          this.assistidoDetalhes = assistido;
          this.imagemExpandida = false;
          this.mostrarModalDetalhesAssistido = true;
        }
      });
  }

  private buscarPorIntervalo(inicio: string, fim: string): void {
    this.isLoading = true;
    this.erroLista = false;
    this.retiradasService
      .selectByDataIntervalo(inicio, fim)
      .pipe(
        map((r: any) => ({ ok: true, lista: Array.isArray(r) ? (r as Retirada[]) : [] })),
        // 404 = nenhuma retirada no intervalo (vazio); 400 = validação (ex.: início > fim).
        catchError((err: HttpErrorResponse) =>
          of({ ok: err?.status === 404, lista: [] as Retirada[], err })
        ),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((res: any) => {
        if (!res.ok) {
          this.mensagemFiltro = mensagemErro(
            res.err,
            'Não foi possível filtrar as retiradas. Tente novamente.'
          );
          return;
        }
        this.aplicarFiltro('intervalo', res.lista, { assistidoId: null, inicio, fim });
      });
  }

  /** 404 do backend = lista vazia; outras falhas = null. */
  private listaFiltrada(fonte: Observable<any>): Observable<Retirada[] | null> {
    return fonte.pipe(
      map((r: any) => (Array.isArray(r) ? (r as Retirada[]) : [])),
      catchError((err: HttpErrorResponse) => of(err?.status === 404 ? [] : null))
    );
  }

  /** Paginação no cliente do resultado filtrado, sempre a partir da página 1. */
  private aplicarFiltro(
    tipo: Exclude<FiltroAtivo, null>,
    lista: Retirada[],
    aplicado: FiltroAplicado
  ): void {
    this.filtroAtivo = tipo;
    this.filtroAplicado = aplicado;
    this.resultadoFiltro = lista;
    this.currentPage = 1;
    this.atualizarPaginaFiltrada();
  }

  private atualizarPaginaFiltrada(): void {
    this.totalPages = Math.ceil(this.resultadoFiltro.length / this.selectedPageSize);
    const inicio = (this.currentPage - 1) * this.selectedPageSize;
    this.retiradas = this.resultadoFiltro.slice(inicio, inicio + this.selectedPageSize);
  }

  limparFiltros(): void {
    this.assistidoIdFilter = null;
    this.dataInicialFilter = null;
    this.dataFinalFilter = null;
    this.mensagemFiltro = '';
    this.novaRetirada.assistido_id = 0;
    this.currentPage = 1;
    this.obterRetiradas(this.currentPage, this.selectedPageSize);
  }

  onAssistidoSelecionado(assistido: any) {
    this.assistidoIdFilter = assistido ?? null;
    if (this.assistidoIdFilter != null) this.mensagemFiltro = '';
  }

  onAssistidoSelecionadoRegistrarRetirada(assistido_id: number) {
    this.novaRetirada.assistido_id = assistido_id;
  }

  /** Alterar: troca do assistido da retirada (é o que o PUT aceita). */
  onAssistidoSelecionadoAlterarRetirada(assistido_id: number | null) {
    this.retiradaEditada.assistido_id = assistido_id ?? null;
  }

  openModal(retirada: any) {
    this.retiradaEditada = {
      ...retirada,
      data_retirada: paraInputDate(retirada?.data_retirada),
    };
    this.mostrarModal = true;
  }

  closeModal() {
    this.mostrarModal = false;
  }

  openModalRegistrar(retirada: any) {
    this.retiradaEditada = { ...retirada };
    this.mostrarModalRegistrar = true;
  }

  closeModalRegistrar() {
    this.novaRetirada.assistido_id = 0;
    this.mostrarModalRegistrar = false;
  }

  closeModalDetalhesAssistido() {
    this.imagemExpandida = false;
    this.mostrarModalDetalhesAssistido = false;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    if (this.filtroAtivo) {
      this.atualizarPaginaFiltrada();
    } else {
      this.obterRetiradas(this.currentPage, this.selectedPageSize);
    }
  }

  changePageSize(size: number): void {
    this.selectedPageSize = Number(size);
    this.currentPage = 1;
    if (this.filtroAtivo) {
      this.atualizarPaginaFiltrada();
    } else {
      this.obterRetiradas(this.currentPage, this.selectedPageSize);
    }
  }

  expandirImagem() {
    this.imagemExpandida = true;
  }

  fecharImagem() {
    this.imagemExpandida = false;
  }
}
