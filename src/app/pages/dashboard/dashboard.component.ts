import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { MonthTranslatePipe } from '../../utils/pipes/month-translate.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MonthTranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  anoAtual = new Date().getFullYear();
  totalAssistidos: number = 120;
  retiradasPorMes = [{ mes: '', total: null }];
  ultimasRetiradas = [
    {
      id: null,
      assistido_id: null,
      nome: '',
      documento: '',
      data_retirada: '',
    },
  ];
  totalRetiradasMes: number = 0;
  estoqueAtual: any = [
    {
      id: null,
      quantidade: null,
      descricao: '',
      data_atualizacao: '',
    },
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    const { dataInicio, dataFim } = this.getPeriodoMesAtual();

    this.dashboardService.totalAssistidosCadastrados().subscribe({
      next: (response: any) => {
        this.totalAssistidos = response.total;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
    this.dashboardService.retiradasPorMes(this.anoAtual.toString()).subscribe({
      next: (response: any) => {
        this.retiradasPorMes = response;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
    this.dashboardService
      .totalRetiradasMesAtual(dataInicio, dataFim)
      .subscribe({
        next: (response: any) => {
          this.totalRetiradasMes = response.length;
        },
        error: (error: any) => {
          console.log(error);
        },
      });
    this.dashboardService.ultimasCincoRetiradas().subscribe({
      next: (response: any) => {
        this.ultimasRetiradas = response;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
    this.dashboardService.estoqueAtual().subscribe({
      next: (response: any) => {
        this.estoqueAtual = response
      },
      error: (err: any) => {
        console.log(err);
      },
    });
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
