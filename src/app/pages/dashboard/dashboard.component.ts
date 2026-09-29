import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, DocumentPipe, LineChartsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
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

  constructor(private dashboardService: DashboardService) {}

  get todosComErro(): boolean {
    return Object.values(this.erros).every(Boolean);
  }

  ngOnInit(): void {
    this.carregar();
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
        this.erros = {
          totalAssistidos: res.totalAssistidos.erro,
          retiradasPorMes: res.retiradasPorMes.erro,
          totalRetiradasMes: res.totalRetiradasMes.erro,
          ultimasRetiradas: res.ultimasRetiradas.erro,
          estoqueAtual: res.estoqueAtual.erro,
        };
      });
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
