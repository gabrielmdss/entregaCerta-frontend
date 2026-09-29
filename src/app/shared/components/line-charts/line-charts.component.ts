import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

/** Espelho dos tokens de styles/tokens.css (Chart.js desenha em canvas e não lê CSS vars). */
const CORES = {
  primaria: '#336699',
  primariaSuave: 'rgba(51, 102, 153, 0.12)',
  textoSecundario: '#5B6472',
  borda: '#D8DEE6',
  texto: '#1F2937',
  superficie: '#FFFFFF',
};

/** Rótulos exibidos; a chave 'marco' continua sem acento para a normalização. */
const ROTULOS_MESES: Record<string, string> = { marco: 'Março' };

/** Atraso por ponto na entrada: a linha "desenha" da esquerda para a direita. */
const ATRASO_POR_PONTO_MS = 60;

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

  /** Nomes completos na ordem de mesesFixos (tooltip); o eixo usa a abreviação de 3 letras. */
  private nomesCompletos: string[] = [];

  public lineChartOptions: ChartOptions<'line'> = {};

  public lineChartLegend = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.lineChartOptions = this.criarOpcoes(this.isBrowser && !this.prefereMenosMovimento());
  }

  /** prefers-reduced-motion: sem animação de entrada nem de atualização. */
  private prefereMenosMovimento(): boolean {
    try {
      return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  private criarOpcoes(animar: boolean): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: animar
        ? {
            duration: 700,
            easing: 'easeOutQuart',
            // Entrada escalonada por ponto; atualizações (update) usam só a transição padrão.
            delay: (ctx) =>
              ctx.type === 'data' && ctx.mode === 'default' ? ctx.dataIndex * ATRASO_POR_PONTO_MS : 0,
          }
        : false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: CORES.superficie,
          titleColor: CORES.texto,
          bodyColor: CORES.texto,
          borderColor: CORES.borda,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          bodyFont: { family: 'Inter, system-ui, sans-serif', size: 13, weight: 600 },
          callbacks: {
            title: () => '',
            label: (item: TooltipItem<'line'>) => this.rotuloTooltip(item.dataIndex, Number(item.parsed.y) || 0),
          },
        },
      },
      scales: {
        x: {
          ticks: { color: CORES.textoSecundario, font: { size: 12 }, maxRotation: 0, autoSkipPadding: 8 },
          grid: { display: false },
          border: { color: CORES.borda },
        },
        y: {
          beginAtZero: true,
          ticks: { color: CORES.textoSecundario, precision: 0, font: { size: 12 } },
          grid: { color: CORES.borda },
          border: { display: false, dash: [3, 3] },
        },
      },
    };
  }

  /** Ex.: "Setembro: 14 retiradas" / "Março: 1 retirada". */
  rotuloTooltip(indice: number, total: number): string {
    const mes = this.nomesCompletos[indice] ?? '';
    return `${mes}: ${total} ${total === 1 ? 'retirada' : 'retiradas'}`;
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
        this.nomesCompletos = this.mesesFixos.map((m) => ROTULOS_MESES[m] ?? this.capitalize(m));
        this.lineChartData = {
          labels: this.nomesCompletos.map((m) => m.slice(0, 3)),
          datasets: [
            {
              data: newData,
              label: 'Retiradas',
              fill: true,
              tension: 0.35,
              cubicInterpolationMode: 'monotone',
              borderColor: CORES.primaria,
              borderWidth: 3,
              backgroundColor: CORES.primariaSuave,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: CORES.primaria,
              pointBorderColor: CORES.superficie,
              pointBorderWidth: 2,
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
