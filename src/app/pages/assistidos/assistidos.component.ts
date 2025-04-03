import { Component, OnInit } from '@angular/core';
import { Assistido } from '../../models/assistido.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistidosService } from '../../services/assistidos.service';
import { DocumentPipe } from "../../utils/pipes/document.pipe";
import { DocumentMaskDirective } from '../../utils/directives/document-mask.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-assistidos',
  imports: [CommonModule, FormsModule, DocumentPipe, DocumentMaskDirective],
  templateUrl: './assistidos.component.html',
  styleUrl: './assistidos.component.css',
})
export class AssistidosComponent implements OnInit {
  constructor(private assistidosService: AssistidosService) {}

  assistidos: Assistido[] = [];
  novoAssistido: Assistido = { id: 0, nome: '', documento: '' };
  atualizarAssistido: Assistido = { id: 0, nome: '', documento: '' };
  assistidosFiltrados: Assistido[] = [];
  searchTerm: string = '';

  isLoading: boolean = false;
  mostrarModal: boolean = false;
  mostrarModalEditar: boolean = false;
  assistidoId: number | null = null


  ngOnInit(): void {
    this.listarAssistidos();
  }

  listarAssistidos(): void {
    this.isLoading = true;
    this.assistidosService.listarAssistidos().subscribe({
      next: (response: any) => {
        this.assistidos = response;
        this.assistidosFiltrados = response;
        this.isLoading = false
      },
      error: (error: any) => {
        console.error(error);
        this.isLoading = false
      },
      complete: () => {
        this.isLoading = false
      }
    });
  }

  cadastrarAssistido(): void {
    this.assistidosService
      .cadastrarAssistido(this.novoAssistido.nome, this.novoAssistido.documento)
      .subscribe({
        next: (response: any) => {
          Swal.fire({
            title: 'Assistido cadastrado!',
            text: 'O cadastro foi realizado com sucesso.',
            icon: 'success',
            theme: "light",
            position: 'center',
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Erro no cadastro',
            text: err.error.message || 'Ocorreu um problema ao cadastrar o Assistido. Tente novamente.',
            icon: 'error',
            theme: "light",
            position: 'center',
          });
        },
        complete: () => {
          this.listarAssistidos();
          this.closeModal()
        },
      });
  }

  editarAssistido(): void {
    this.assistidosService.editarAssistido(this.assistidoId,this.atualizarAssistido.nome, this.atualizarAssistido.documento).subscribe({
      next: (response: any) => {
        Swal.fire({
          title: 'Assistido Atualizado!',
          text: 'Os dados do assistidos foram atualizados com sucesso.',
          icon: 'success',
          theme: "light",
          position: 'center',
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Erro ao atualizar',
          text: err.error.message || 'Ocorreu um problema ao atualizar os dados o Assistido. Tente novamente.',
          icon: 'error',
          theme: "light",
          position: 'center',
        });
      },
      complete: () => {
        this.listarAssistidos();
        this.closeModalEditar()
      },
    });
  }

  excluirAssistido(id: number): void {
    Swal.fire({
      title: "Tem certeza?",
      text: "Essa ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.assistidosService.excluirAssistido(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Assistido excluído com sucesso!',
              text: 'Os dados do assistido foram removidos permanentemente.',
              icon: 'success',
              theme: "light",
              position: 'center',
            }).then(() => this.listarAssistidos());
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Erro ao excluir',
              text: err.error.message || 'Houve um problema ao excluir os dados. Tente novamente.',
              icon: 'error',
              theme: "light",
              position: 'center',
            });
          }
        });
      }
    });
  }
  
  filtrarAssistidos(): void {
    if (this.searchTerm.trim() === '') {
      this.assistidosFiltrados = [...this.assistidos];
    } else {
      this.assistidosFiltrados = this.assistidos.filter(assistido =>
        assistido.nome.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        assistido.documento.includes(this.searchTerm)
      );
    }
  }

  openModal() {
    this.mostrarModal = true;
  }
  
  closeModal() {
    this.mostrarModal = false;
  }
  openModalEditar(id: number) {
    this.mostrarModalEditar = true;
    this.assistidoId = id
  }
  
  closeModalEditar() {
    this.mostrarModalEditar = false;
  }
}
