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
}
