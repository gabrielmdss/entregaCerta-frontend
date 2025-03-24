import { Component } from '@angular/core';
import { Retirada } from '../../models/retirada.interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-retiradas',
  imports: [FormsModule, CommonModule],
  templateUrl: './retiradas.component.html',
  styleUrl: './retiradas.component.css',
})
export class RetiradasComponent {
  retiradas: Retirada[] = [
    { id: 1, assistido: 'João Silva', data: '2024-03-10' },
    { id: 2, assistido: 'Maria Souza', data: '2024-03-12' },
  ];

  novaRetirada: Retirada = { id: 0, assistido: '', data: '' };

  constructor() {}

  ngOnInit(): void {}

  registrarRetirada(): void {
    this.novaRetirada.id = this.retiradas.length + 1;
    this.retiradas.push({ ...this.novaRetirada });
    this.novaRetirada = { id: 0, assistido: '', data: '' };
  }
}
