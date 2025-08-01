import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DocumentPipe } from '../../utils/pipes/document.pipe';
import { LineChartsComponent } from '../../shared/components/line-charts/line-charts.component';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { FooterComponent } from "../../shared/components/footer/footer.component";


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DocumentPipe, LineChartsComponent, HeaderComponent, FooterComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  anoAtual = new Date().getFullYear();
  totalAssistidos: number = 0;
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

  isLoading: boolean = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    const { dataInicio, dataFim } = this.getPeriodoMesAtual();

    this.isLoading = true
    this.obterTotalDeAssistidos()
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
        this.estoqueAtual = response;
      },
      error: (err: any) => {
        console.log(err);
      },
    });
    this.isLoading = false
  }

  obterTotalDeAssistidos(): void {
    this.dashboardService.totalAssistidosCadastrados().subscribe({
      next: (response: any) => {
        this.totalAssistidos = response.total;

      },
      error: (error: any) => {
        console.log(error);
      }
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
