import { Component } from '@angular/core';
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
  isLoading: boolean = false;

  mostrarModal: boolean = false;
  mostrarModalRegistrar: boolean = false;
  retiradaEditada: any = { nome: '', data_retirada: '' };

  retiradas: Retirada[] = [];

  totalRetiradas: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 0;
  itemsPerPageOptions: number[] = [5, 10, 20, 50];
  selectedPageSize: number = 10;

  novaRetirada: Retirada = {
    id: 0,
    assistido_id: 0,
    data_retirada: '',
    documento: '',
    nome: '',
  };

  ngOnInit(): void {
    this.obterAssistidos();
    this.obterQuantidadeRetiradas();
    this.obterRetiradas(this.currentPage, this.selectedPageSize);
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
        this.filteredAssistidos = response.map((assistido: any) => ({
          ...assistido,
          nome_completo: `${assistido.nome} - ${assistido.documento}`,
        }));
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {},
    });
  }
  obterRetiradas(page: number, pageSize: number): void {
    this.isLoading = true;
    this.retiradasService.listarRetiradas(page, pageSize).subscribe({
      next: (response: any) => {
        this.retiradas = response;
        this.totalPages = Math.ceil(this.totalRetiradas / pageSize);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        console.log(err);
      },
      complete: () => {
        this.isLoading = false;
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
          alert('Retirada registrada com sucesso');
        },
        error: (err: any) => {
          console.log(err);
          alert('Erro ao registrar retirada');
        },
        complete: () => {
          this.obterRetiradas(this.currentPage, this.selectedPageSize);
          this.mostrarModalRegistrar = false;
        },
      });
  }
  confirmarAlteracao() {
    this.retiradasService
      .atualizarRetirada(this.retiradaEditada.id, this.retiradaEditada)
      .subscribe({
        next: (response: any) => {
          alert('Alteração concluida com sucesso!');
        },
        error: (err: any) => {
          alert('Erro ao realizar alteração!');
          console.log(err);
        },
        complete: () => {
          this.obterRetiradas(this.currentPage, this.selectedPageSize);
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
    this.obterRetiradas(this.currentPage, this.selectedPageSize);
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
  openModalRegistrar(retirada: any) {
    this.retiradaEditada = { ...retirada };
    this.mostrarModalRegistrar = true;
  }
  obterQuantidadeRetiradas(): void {
    this.retiradasService.obterQuantidadeRetiradas().subscribe({
      next: (total: number) => {
        this.totalRetiradas = total;
      },
      error: (err: any) => {
        console.log('Erro ao obter quantidade de retiradas:', err);
      },
    });
  }

  closeModal() {
    this.mostrarModal = false;
  }
  closeModalRegistrar() {
    this.mostrarModalRegistrar = false;
  }
  changePage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.obterRetiradas(this.currentPage, this.selectedPageSize);
    }
  }
  changePageSize(size: number): void {
    this.selectedPageSize = size;
    this.pageSize = size;
    this.obterRetiradas(this.currentPage, this.selectedPageSize);
  }
}
