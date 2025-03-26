import { Component, ElementRef, ViewChild } from '@angular/core';
import { Retirada } from '../../models/retirada.interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssistidosService } from '../../services/assistidos.service';
import { Assistido } from '../../models/assistido.interface';
import { RetiradasService } from '../../services/retiradas.service';
import { SelectComponent } from '../../shared/components/select/select.component';

@Component({
  selector: 'app-retiradas',
  imports: [FormsModule, CommonModule, SelectComponent],
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

  mostrarModal: boolean = false;
  retiradaEditada: any = { nome: '', data_retirada: '' };

  retiradas: Retirada[] = [];

  novaRetirada: Retirada = {
    id: 0,
    assistido_id: 0,
    data_retirada: '',
    documento: '',
    nome: '',
  };

  ngOnInit(): void {
    this.obterAssistidos();
    this.obterRetiradas();
  }

  constructor(
    private retiradasService: RetiradasService,
    private assistidosService: AssistidosService
  ) {}

  obterAssistidos(): void {
    this.assistidosService.listarAssistidos().subscribe({
      next: (response: any) => {
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
        this.retiradas = response;
      },
      error: (err: any) => {
        console.log(err);
      },
    });
  }
  registrarRetirada(): void {
    this.retiradasService
      .registrarRetirada(
        this.novaRetirada.assistido_id,
        this.novaRetirada.data_retirada
      )
      .subscribe({
        next: (response: any) => {
          console.log(response);
          alert('Retirada registrada com sucesso');
        },
        error: (err: any) => {
          console.log(err);
          alert('Erro ao registrar retirada');
        },
        complete: () => {
          this.obterRetiradas();
        },
      });
  }
  confirmarAlteracao() {
    this.retiradasService
      .atualizarRetirada(this.retiradaEditada.id, this.retiradaEditada)
      .subscribe({
        next: (response: any) => {
          alert('Alteração concluida com sucesso!');
          console.log(response);
        },
        error: (err: any) => {
          alert('Erro ao realizar alteração!');
          console.log(err);
        },
        complete: () => {
          this.obterRetiradas();
        },
      });
    this.mostrarModal = false;
  }
  filtrarRetiradasPorAssistido(): void {
    if (this.assistidoIdFilter !== null) {
      this.retiradasService
        .selectByAssistidoId(this.assistidoIdFilter)
        .subscribe((retiradas) => {
          this.retiradas = retiradas;
        });
    }
  }
  filtrarRetiradasPorData(): void {
    if (this.dataFilter) {
      this.retiradasService
        .selectByData(this.dataFilter)
        .subscribe((retiradas) => {
          this.retiradas = retiradas;
        });
    }
  }
  filtrarRetiradasPorIntervalo(): void {
    if (this.dataInicialFilter && this.dataFinalFilter) {
      this.retiradasService
        .selectByDataIntervalo(this.dataInicialFilter, this.dataFinalFilter)
        .subscribe((retiradas) => {
          this.retiradas = retiradas;
        });
    }
  }

  limparFiltros(): void {
    this.assistidoIdFilter = null;
    this.dataFilter = null;
    this.dataInicialFilter = null;
    this.dataFinalFilter = null;
    this.searchTerm = '';
    this.obterRetiradas();
  }
  onAssistidoSelecionado(assistido: any) {
    this.assistidoIdFilter = assistido;
  }
  onAssistidoSelecionadoRegistrarRetirada(assistido_id: number) {
    this.novaRetirada.assistido_id = assistido_id;
  }
  openModal(retirada: any) {
    this.retiradaEditada = { ...retirada };
    this.mostrarModal = true;
  }
  closeModal() {
    this.mostrarModal = false;
  }
}
