import { Component } from '@angular/core';
import { Assistido } from '../../models/assistido.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assistidos',
  imports: [CommonModule,FormsModule],
  templateUrl: './assistidos.component.html',
  styleUrl: './assistidos.component.css'
})
export class AssistidosComponent {
  assistidos: Assistido[] = [
    { id: 1, nome: 'João Silva', documento: '123.456.789-00' },
    { id: 2, nome: 'Maria Souza', documento: '987.654.321-00' },
    { id: 3, nome: 'Ana Lima', documento: '111.222.333-44' },
  ];

  novoAssistido: Assistido = { id: 0, nome: '', documento: '' };

  constructor() {}

  ngOnInit(): void {}

  cadastrarAssistido(): void {
    this.novoAssistido.id = this.assistidos.length + 1;
    this.assistidos.push({ ...this.novoAssistido });
    this.novoAssistido = { id: 0, nome: '', documento: '' };
  }

  excluirAssistido(id: number): void {
    this.assistidos = this.assistidos.filter(a => a.id !== id);
  }
}
