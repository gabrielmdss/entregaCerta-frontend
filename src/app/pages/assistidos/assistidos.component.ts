import { Component, OnInit } from '@angular/core';
import { Assistido } from '../../models/assistido.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistidosService } from '../../services/assistidos.service';
import { DocumentPipe } from "../../utils/pipes/document.pipe";
import { DocumentMaskDirective } from '../../utils/directives/document-mask.directive';

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
          alert('Assistido cadastrado com sucesso');
        },
        error: (err: any) => {
          console.log(err);
          alert(err.error.message);
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
        alert('Assistido atualizado com sucesso');
      },
      error: (err: any) => {
        console.log(err);
        alert('Erro ao atualizar assistido');
      },
      complete: () => {
        this.listarAssistidos();
      },
    });
  }
  excluirAssistido(id: number): void {
    this.assistidosService.excluirAssistido(id).subscribe({
      next: (response: any) => {
        alert('Assistido excluido com sucesso');
      },
      error: (err: any) => {
        console.log(err);
        alert('Erro ao excluir assistido');
      },
      complete: () => {
        this.listarAssistidos();
      },
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
