import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { MonthTranslatePipe } from '../../utils/pipes/month-translate.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MonthTranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  anoAtual = new Date().getFullYear();
  totalAssistidos: number = 120;
  retiradasPorMes = [
    { mes: 'Janeiro de 2024', total: 30 },
    { mes: 'Fevereiro de 2024', total: 45 },
    { mes: 'Março de 2024', total: 50 },
  ];

  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    const { dataInicio, dataFim } = this.getPeriodoMesAtual();

    this.dashboardService.totalAssistidosCadastrados().subscribe({
      next: (response: any) => {
        this.totalAssistidos = response.total;
      },
      error: (error: any) => {
        console.log(error)
      }
    });
    this.dashboardService.retiradasPorMes(this.anoAtual.toString()).subscribe({
      next: (response: any) => {
        this.retiradasPorMes = response;
      },
      error: (error: any) => {
        console.log(error)
      }
    });
    this.dashboardService.totalRetiradasMesAtual(dataInicio, dataFim).subscribe({
      next: (response: any) => {
        this.totalRetiradasMes = response.length;
      },
      error: (error: any) => {
        console.log(error)
      }
    });

  }
  

  totalRetiradasMes: number = 45;

 

  ultimasRetiradas = [
    { id: 1, nome: 'João Silva', data: '2024-03-10' },
    { id: 2, nome: 'Maria Souza', data: '2024-03-12' },
    { id: 3, nome: 'Ana Lima', data: '2024-03-15' },
  ];

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
