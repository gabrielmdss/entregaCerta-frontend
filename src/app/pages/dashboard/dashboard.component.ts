import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { DocumentPipe } from '../../utils/pipes/document.pipe';
import { LineChartsComponent } from '../../shared/components/line-charts/line-charts.component';
import { Estoque } from '../../models/estoque.interface';
import { Retirada } from '../../models/retirada.interface';

/** Resultado de cada bloco: dado recebido ou falha (404 do backend = "sem dados", não falha). */
interface Bloco<T> {
  dados: T;
  erro: boolean;
}

/** Blocos reordenáveis do Dashboard (drag & drop / teclado). */
export type BlocoDashboard = 'indicadores' | 'estoque' | 'grafico' | 'ultimas';

export const ORDEM_PADRAO: readonly BlocoDashboard[] = ['indicadores', 'estoque', 'grafico', 'ultimas'];
/** Chave do localStorage com a ordem escolhida (preferência visual deste navegador). */
export const CHAVE_ORDEM = 'entregaCerta.dashboard.ordem.v1';

const NOMES_BLOCOS: Record<BlocoDashboard, string> = {
  indicadores: 'Indicadores',
  estoque: 'Estoque atual',
  grafico: 'Retiradas por mês',
  ultimas: 'Últimas retiradas',
};

const DURACAO_CONTAGEM_MS = 700;

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    DocumentPipe,
    LineChartsComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  anoAtual = new Date().getFullYear();
  totalAssistidos: number = 0;
  retiradasPorMes: { mes: string; total: number | null }[] = [];
  ultimasRetiradas: Retirada[] = [];
  totalRetiradasMes: number = 0;
  estoqueAtual: Estoque[] = [];

  /** Verdadeiro até TODAS as respostas (sucesso, vazio ou erro) chegarem. */
  isLoading: boolean = false;
  erros = {
    totalAssistidos: false,
    retiradasPorMes: false,
    totalRetiradasMes: false,
    ultimasRetiradas: false,
    estoqueAtual: false,
  };

  /** Ordem atual dos blocos. SSR e 1ª renderização usam a padrão; a salva é aplicada após a hidratação. */
  ordem: BlocoDashboard[] = [...ORDEM_PADRAO];
  /** Mensagem para leitores de tela após mover um bloco (aria-live). */
  anuncio = '';
  /** Valores exibidos nos KPIs (contam de 0 até o valor real no browser). */
  kpiExibido = { totalAssistidos: 0, totalRetiradasMes: 0 };
  /** Maior quantidade do estoque: base da barra de nível. */
  maiorQuantidade = 1;

  private readonly isBrowser: boolean;
  private quadroContagem: number | null = null;

  constructor(
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) platformId: object,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Após a hidratação, para o HTML do servidor (ordem padrão) casar com o do cliente.
    afterNextRender(() => this.restaurarOrdem());
  }

  get todosComErro(): boolean {
    return Object.values(this.erros).every(Boolean);
  }

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.pararContagem();
  }

  carregar(): void {
    const { dataInicio, dataFim } = this.getPeriodoMesAtual();

    this.isLoading = true;
    forkJoin({
      totalAssistidos: this.bloco(
        this.dashboardService.totalAssistidosCadastrados().pipe(map((r: any) => Number(r?.total) || 0)),
        0,
      ),
      retiradasPorMes: this.bloco(
        this.dashboardService.retiradasPorMes(this.anoAtual.toString()).pipe(map((r: any) => (Array.isArray(r) ? r : []))),
        [] as { mes: string; total: number | null }[],
      ),
      totalRetiradasMes: this.bloco(
        this.dashboardService.totalRetiradasMesAtual(dataInicio, dataFim).pipe(map((r: any) => (Array.isArray(r) ? r.length : 0))),
        0,
      ),
      ultimasRetiradas: this.bloco(
        this.dashboardService.ultimasCincoRetiradas().pipe(map((r: any) => (Array.isArray(r) ? (r as Retirada[]) : []))),
        [] as Retirada[],
      ),
      estoqueAtual: this.bloco(
        this.dashboardService.estoqueAtual().pipe(map((r: any) => (Array.isArray(r) ? (r as Estoque[]) : []))),
        [] as Estoque[],
      ),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((res) => {
        this.totalAssistidos = res.totalAssistidos.dados;
        this.retiradasPorMes = res.retiradasPorMes.dados;
        this.totalRetiradasMes = res.totalRetiradasMes.dados;
        this.ultimasRetiradas = res.ultimasRetiradas.dados;
        this.estoqueAtual = res.estoqueAtual.dados;
        this.maiorQuantidade = Math.max(1, ...this.estoqueAtual.map((i) => Number(i.quantidade) || 0));
        this.erros = {
          totalAssistidos: res.totalAssistidos.erro,
          retiradasPorMes: res.retiradasPorMes.erro,
          totalRetiradasMes: res.totalRetiradasMes.erro,
          ultimasRetiradas: res.ultimasRetiradas.erro,
          estoqueAtual: res.estoqueAtual.erro,
        };
        this.animarKpis();
      });
  }

  // ------------------------------------------------------------ ordem dos blocos

  nomeBloco(bloco: BlocoDashboard): string {
    return NOMES_BLOCOS[bloco];
  }

  rastrearBloco(_: number, bloco: BlocoDashboard): BlocoDashboard {
    return bloco;
  }

  /** Aplica a ordem salva; ausente, inválida ou storage indisponível => mantém a atual. */
  restaurarOrdem(): void {
    const salva = this.lerStorage();
    if (salva) this.ordem = salva;
  }

  /** Soltura do CDK (mouse/toque). */
  soltar(evento: CdkDragDrop<BlocoDashboard[]>): void {
    if (evento.previousIndex === evento.currentIndex) return;
    this.moverPara(evento.previousIndex, evento.currentIndex, false);
  }

  /** Alternativa por teclado na alça: setas movem uma posição; Home/End levam aos extremos. */
  aoTeclarAlca(evento: KeyboardEvent, bloco: BlocoDashboard): void {
    const de = this.ordem.indexOf(bloco);
    const destinos: Record<string, number> = {
      ArrowUp: de - 1,
      ArrowLeft: de - 1,
      ArrowDown: de + 1,
      ArrowRight: de + 1,
      Home: 0,
      End: this.ordem.length - 1,
    };
    if (!(evento.key in destinos)) return;
    evento.preventDefault();
    this.moverBloco(bloco, destinos[evento.key] - de);
  }

  /** Move o bloco `deslocamento` posições (negativo = para cima). Retorna se houve mudança. */
  moverBloco(bloco: BlocoDashboard, deslocamento: number): boolean {
    const de = this.ordem.indexOf(bloco);
    const para = Math.min(Math.max(de + deslocamento, 0), this.ordem.length - 1);
    if (de < 0 || de === para) return false;
    this.moverPara(de, para, true);
    return true;
  }

  restaurarOrdemPadrao(): void {
    this.ordem = [...ORDEM_PADRAO];
    this.salvarStorage();
    this.anuncio = 'Ordem padrão dos blocos restaurada.';
  }

  get ordemEhPadrao(): boolean {
    return this.ordem.every((b, i) => b === ORDEM_PADRAO[i]);
  }

  private moverPara(de: number, para: number, devolverFoco: boolean): void {
    const ordem = [...this.ordem];
    moveItemInArray(ordem, de, para);
    this.ordem = ordem;
    this.salvarStorage();
    const bloco = ordem[para];
    this.anuncio = `${NOMES_BLOCOS[bloco]} movido para a posição ${para + 1} de ${ordem.length}.`;
    // Mover o nó no DOM tira o foco da alça; devolve após a renderização.
    if (devolverFoco && this.isBrowser) {
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-alca="${bloco}"]`)?.focus());
    }
  }

  private lerStorage(): BlocoDashboard[] | null {
    if (!this.isBrowser) return null;
    try {
      const bruto = localStorage.getItem(CHAVE_ORDEM);
      if (!bruto) return null;
      const lida: unknown = JSON.parse(bruto);
      const valida =
        Array.isArray(lida) &&
        lida.length === ORDEM_PADRAO.length &&
        ORDEM_PADRAO.every((b) => lida.includes(b));
      return valida ? (lida as BlocoDashboard[]) : null;
    } catch {
      return null;
    }
  }

  private salvarStorage(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(CHAVE_ORDEM, JSON.stringify(this.ordem));
    } catch {
      /* storage indisponível (modo privado/cota): a ordem vale só nesta sessão */
    }
  }

  // ------------------------------------------------------------ KPIs e estoque

  /** Largura da barra de nível (%), proporcional à maior quantidade; mínimo visível de 4% se > 0. */
  larguraNivel(quantidade: number): number {
    if (!quantidade || quantidade <= 0) return 0;
    return Math.max((quantidade / this.maiorQuantidade) * 100, 4);
  }

  private prefereMenosMovimento(): boolean {
    try {
      return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  /** Count-up dos KPIs; valor final direto no SSR e com prefers-reduced-motion. */
  private animarKpis(): void {
    const alvo = { totalAssistidos: this.totalAssistidos, totalRetiradasMes: this.totalRetiradasMes };
    this.pararContagem();
    if (!this.isBrowser || this.prefereMenosMovimento() || typeof requestAnimationFrame !== 'function') {
      this.kpiExibido = alvo;
      return;
    }
    this.kpiExibido = { totalAssistidos: 0, totalRetiradasMes: 0 };
    let inicio: number | null = null;
    const passo = (agora: number) => {
      inicio ??= agora;
      const t = Math.min((agora - inicio) / DURACAO_CONTAGEM_MS, 1);
      const f = 1 - Math.pow(1 - t, 3); // easeOutCubic
      this.zone.run(() => {
        this.kpiExibido = {
          totalAssistidos: Math.round(alvo.totalAssistidos * f),
          totalRetiradasMes: Math.round(alvo.totalRetiradasMes * f),
        };
      });
      this.quadroContagem = t < 1 ? requestAnimationFrame(passo) : null;
    };
    this.zone.runOutsideAngular(() => (this.quadroContagem = requestAnimationFrame(passo)));
  }

  private pararContagem(): void {
    if (this.quadroContagem !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.quadroContagem);
    }
    this.quadroContagem = null;
  }

  /**
   * Converte a resposta em Bloco. O backend responde 404 quando não há registros
   * (/assistido/total, /retirada/ultimas, /retirada/periodo, /retirada/meses): tratado como vazio.
   * Demais falhas (rede, 5xx) marcam o bloco com erro sem derrubar os outros.
   */
  private bloco<T>(fonte: Observable<T>, vazio: T): Observable<Bloco<T>> {
    return fonte.pipe(
      map((dados) => ({ dados, erro: false })),
      catchError((err: HttpErrorResponse) =>
        of({ dados: vazio, erro: err?.status !== 404 }),
      ),
    );
  }

  private getPeriodoMesAtual(): { dataInicio: string; dataFim: string } {
    const hoje = new Date();

    const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const formatarData = (data: Date): string =>
      data.toISOString().split('T')[0];

    return {
      dataInicio: formatarData(dataInicio),
      dataFim: formatarData(dataFim),
    };
  }
}
