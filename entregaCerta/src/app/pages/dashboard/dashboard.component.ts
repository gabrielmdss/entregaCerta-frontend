import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  totalAssistidos: number = 120;
  totalRetiradasMes: number = 45;

  retiradasPorMes = [
    { mes: 'Janeiro de 2024', total: 30 },
    { mes: 'Fevereiro de 2024', total: 45 },
    { mes: 'Março de 2024', total: 50 },
  ];

  ultimasRetiradas = [
    { id: 1, nome: 'João Silva', data: '2024-03-10' },
    { id: 2, nome: 'Maria Souza', data: '2024-03-12' },
    { id: 3, nome: 'Ana Lima', data: '2024-03-15' },
  ];

  constructor() {}

  ngOnInit(): void {}
}
