import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Estoque } from '../../models/estoque.interface';
import { EstoqueService } from '../../services/estoque.service';

@Component({
  selector: 'app-estoque',
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css',
})
export class EstoqueComponent implements OnInit {
  estoque: Estoque[] = [];
  isLoading: boolean = false;

  constructor(private estoqueService: EstoqueService) {}

  ngOnInit(): void {
    this.carregarEstoque();
  }

  carregarEstoque(): void {
    this.isLoading = true;
    this.estoqueService.selectAll().subscribe({
      next: (dados) => {
        this.estoque = dados;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  adicionarItem(): void {
    const descricao = prompt('Descrição do item:');
    const quantidade = prompt('Quantidade inicial:');

    if (descricao && quantidade) {
      this.estoqueService.insert(descricao, +quantidade).subscribe({
        next: (response: Estoque) => {
          alert(`Insumo ${response.descricao} adicionado com sucesso!`);
        },
        error: (err: any) => {
          alert(err.message);
          console.error(err);
        },
        complete: () => {
          this.carregarEstoque();
        },
      });
    }
  }

  ajustarQuantidade(id: number): void {
    const item = this.estoque.find((i) => i.id === id);
    if (!item) return;

    const input = prompt(
      `Item: ${item.descricao}\nQuantidade atual: ${item.quantidade}\n\nInforme o valor a ajustar (use '-' para subtrair):`
    );
    const quantidade = parseInt(input || '0', 10);

    if (!isNaN(quantidade) && quantidade !== 0) {
      this.estoqueService.adjustStock(id, quantidade).subscribe({
        next: (response: any) => {
          alert('Estoque ajustado com sucesso');
          console.log(response);
        },
        error: (err: any) => {
          alert(err.error.message);
          console.error(err);
        },
        complete: () => {
          this.carregarEstoque();
        },
      });
    } else {
      alert('Valor inválido. Tente novamente.');
    }
  }

  removerItem(id: number): void {
    if (confirm('Deseja remover este item?')) {
      this.estoqueService.delete(id).subscribe({
        next: (response: any) => {
          alert('Item excluido com sucesso!');
          console.log(response);
        },
        error: (err: any) => {
          alert(err.error.message);
          console.error(err);
        },
        complete: () => this.carregarEstoque(),
      });
    }
  }
}
