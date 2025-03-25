import { Component, OnInit } from '@angular/core';
import { Assistido } from '../../models/assistido.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistidosService } from '../../services/assistidos.service';

@Component({
  selector: 'app-assistidos',
  imports: [CommonModule, FormsModule],
  templateUrl: './assistidos.component.html',
  styleUrl: './assistidos.component.css',
})
export class AssistidosComponent implements OnInit {
  constructor(private assistidosService: AssistidosService) {}

  assistidos: Assistido[] = [];
  novoAssistido: Assistido = { id: 0, nome: '', documento: '' };
  assistidosFiltrados: Assistido[] = [];
  searchTerm: string = '';

  ngOnInit(): void {
    this.listarAssistidos();
  }

  listarAssistidos(): void {
    this.assistidosService.listarAssistidos().subscribe({
      next: (response: any) => {
        console.log(response);
        this.assistidos = response;
        this.assistidosFiltrados = response;
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }

  cadastrarAssistido(): void {
    this.assistidosService
      .cadastrarAssistido(this.novoAssistido.nome, this.novoAssistido.documento)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          alert('Assistido cadastrado com sucesso');
        },
        error: (err: any) => {
          console.log(err);
          alert(err.error.message);
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
}
