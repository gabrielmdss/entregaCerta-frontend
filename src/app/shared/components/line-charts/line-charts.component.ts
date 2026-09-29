import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

/** Espelho dos tokens de styles/tokens.css (Chart.js desenha em canvas e não lê CSS vars). */
const CORES = {
  primaria: '#336699',
  primariaSuave: 'rgba(51, 102, 153, 0.12)',
  textoSecundario: '#5B6472',
  borda: '#D8DEE6',
};

/** Rótulos exibidos; a chave 'marco' continua sem acento para a normalização. */
const ROTULOS_MESES: Record<string, string> = { marco: 'Março' };

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
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: CORES.textoSecundario },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: CORES.textoSecundario, precision: 0 },
        grid: { color: CORES.borda },
      },
    },
  };

  public lineChartLegend = false;

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
          labels: this.mesesFixos.map((m) => ROTULOS_MESES[m] ?? this.capitalize(m)),
          datasets: [
            {
              data: newData,
              label: 'Retiradas',
              fill: true,
              tension: 0.35,
              cubicInterpolationMode: 'monotone',
              borderColor: CORES.primaria,
              backgroundColor: CORES.primariaSuave,
              pointBackgroundColor: CORES.primaria,
              pointBorderColor: CORES.primaria,
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
