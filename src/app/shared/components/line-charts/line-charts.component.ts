import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-line-charts',
  standalone: true,
  imports: [NgChartsModule, CommonModule],
  templateUrl: './line-charts.component.html',
  styleUrl: './line-charts.component.css',
})
export class LineChartsComponent implements OnChanges {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @Input() dados: { mes: string; total: number | null }[] = [];

  isBrowser: boolean;

  private readonly mesesFixos: string[] = [
    'janeiro',
    'fevereiro',
    'marco',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];

  private readonly mesesInglesParaPortugues: Record<string, string> = {
    january: 'janeiro',
    february: 'fevereiro',
    march: 'marco',
    april: 'abril',
    may: 'maio',
    june: 'junho',
    july: 'julho',
    august: 'agosto',
    september: 'setembro',
    october: 'outubro',
    november: 'novembro',
    december: 'dezembro',
  };

  private normalizarMes(mesCompleto: string): string {
    let nomeMes = mesCompleto.split(' ')[0];
    nomeMes = nomeMes
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (this.mesesInglesParaPortugues[nomeMes]) {
      nomeMes = this.mesesInglesParaPortugues[nomeMes];
    }

    return nomeMes;
  }

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    animation: false,
    plugins: {
      legend: {
        labels: {
          color: '#007bff',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#007bff',
        },
        grid: {
          color: 'rgba(0, 123, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#007bff',
        },
        grid: {
          color: 'rgba(0, 123, 255, 0.1)',
        },
      },
    },
  };

  public lineChartLegend = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dados'] && this.dados.length > 0) {
      const dadosPorMes: { [mes: string]: number } = {};

      this.dados.forEach((d) => {
        const mes = this.normalizarMes(d.mes);
        dadosPorMes[mes] = d.total ?? 0;
      });

      const newData = this.mesesFixos.map((mes) => dadosPorMes[mes] ?? 0);

      const currentData = this.lineChartData.datasets[0]?.data ?? [];
      const isDifferent =
        JSON.stringify(newData) !== JSON.stringify(currentData);

      if (isDifferent) {
        this.lineChartData = {
          labels: this.mesesFixos.map(this.capitalize),
          datasets: [
            {
              data: newData,
              label: 'Total',
              fill: true,
              tension: 0.5,
              borderColor: '#007bff',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              pointBackgroundColor: '#007bff',
              pointBorderColor: '#007bff',
            },
          ],
        };

        this.chart?.update();
      }
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
