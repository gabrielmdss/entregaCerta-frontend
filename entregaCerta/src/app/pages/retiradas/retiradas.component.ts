import { Component } from '@angular/core';
import { Retirada } from '../../models/retirada.interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssistidosService } from '../../services/assistidos.service';
import { Assistido } from '../../models/assistido.interface';
import { RetiradasService } from '../../services/retiradas.service';

@Component({
  selector: 'app-retiradas',
  imports: [FormsModule, CommonModule],
  templateUrl: './retiradas.component.html',
  styleUrl: './retiradas.component.css',
})
export class RetiradasComponent {
  assistidos: Assistido[] = [];
  filteredAssistidos: Assistido[] = [];
  searchTerm: string = '';
  assistidoIdFilter: number | null = null;
  dataFilter: string | null = null;
  dataInicialFilter: string | null = null;
  dataFinalFilter: string | null = null;
  constructor(
    private retiradasService: RetiradasService,
    private assistidosService: AssistidosService
  ) {}

  retiradas: Retirada[] = [
  ];

  novaRetirada: Retirada = { id: 0, assistido_id: 0, data_retirada: '', documento: '', nome: ''};

  ngOnInit(): void {
    this.obterAssistidos()
    this.obterRetiradas();
  }
  obterAssistidos():void {
    this.assistidosService.listarAssistidos().subscribe({
      next: (response: any) => {
        console.log(response);
        this.assistidos = response;
        this.filteredAssistidos = response;
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {},
    });
  }
  obterRetiradas(): void {
    this.retiradasService.listarRetiradas().subscribe({
      next: (response: any) => {
        this.retiradas = response
        console.log(response)
      },
      error: (err: any) => {
        console.log(err)
      }
    });
  }

  registrarRetirada(): void {
    this.retiradasService.registrarRetirada(this.novaRetirada.assistido_id, this.novaRetirada.data_retirada).subscribe({
      next: (response: any) => {
        console.log(response)
      },
      error: (err: any) => {
        console.log(err)
      },
      complete: () => {
        this.obterRetiradas();
      }
    })
  }

  filterAssistidos(): void {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredAssistidos = this.assistidos.filter((assistido) =>
      assistido.nome.toLowerCase().includes(searchTermLower)
    );
  }

  carregarRetiradas(): void {
    this.retiradasService.listarRetiradas().subscribe((retiradas) => {
      this.retiradas = retiradas;
    });
  }

  filtrarRetiradasPorAssistido(): void {
    if (this.assistidoIdFilter !== null) {
      this.retiradasService.selectByAssistidoId(this.assistidoIdFilter).subscribe((retiradas) => {
        this.retiradas = retiradas;
      });
    }
  }

  filtrarRetiradasPorData(): void {
    if (this.dataFilter) {
      this.retiradasService.selectByData(this.dataFilter).subscribe((retiradas) => {
        this.retiradas = retiradas;
      });
    }
  }

  filtrarRetiradasPorIntervalo(): void {
    if (this.dataInicialFilter && this.dataFinalFilter) {
      this.retiradasService.selectByDataIntervalo(this.dataInicialFilter, this.dataFinalFilter).subscribe((retiradas) => {
        this.retiradas = retiradas;
      });
    }
  }

  contarRetiradasPorAssistido(): void {
    if (this.assistidoIdFilter !== null) {
      this.retiradasService.countanysByAssistido(this.assistidoIdFilter).subscribe((count) => {
        console.log(`Total de retiradas para o assistido: ${count}`);
      });
    }
  }
  editarRetirada(retirada: Retirada): void {
    this.novaRetirada.assistido_id = retirada.assistido_id;
    this.novaRetirada.data_retirada = retirada.data_retirada;
  }

  limparFiltros(): void {
    this.assistidoIdFilter = null;
    this.dataFilter = null;
    this.dataInicialFilter = null;
    this.dataFinalFilter = null;
    this.searchTerm = '';
    this.carregarRetiradas();
  }
}
