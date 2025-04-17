import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Estoque } from '../../models/estoque.interface';
import { EstoqueService } from '../../services/estoque.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-estoque',
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css',
})
export class EstoqueComponent implements OnInit {
  estoque: Estoque[] = [];
  estoqueFiltrados: Estoque[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  constructor(private estoqueService: EstoqueService) {}

  ngOnInit(): void {
    this.carregarEstoque();
  }

  carregarEstoque(): void {
    this.isLoading = true;
    this.estoqueService.selectAll().subscribe({
      next: (dados) => {
        this.estoque = dados;
        this.estoqueFiltrados = dados;
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
    Swal.fire({
      title: 'Adicionar item',
      html: `
        <input id="descricao" class="swal2-input" placeholder="Descrição do item">
        <input id="quantidade" type="number" class="swal2-input" placeholder="Quantidade inicial">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const descricao = (
          document.getElementById('descricao') as HTMLInputElement
        ).value;
        const quantidade = (
          document.getElementById('quantidade') as HTMLInputElement
        ).value;

        if (!descricao || !quantidade) {
          Swal.showValidationMessage('Preencha todos os campos!');
          return false;
        }
        return { descricao, quantidade: +quantidade };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.estoqueService
          .insert(result.value.descricao, result.value.quantidade)
          .subscribe({
            next: (response: Estoque) => {
              Swal.fire(
                'Sucesso!',
                `Insumo ${response.descricao} adicionado com sucesso!`,
                'success'
              );
              this.carregarEstoque();
            },
            error: (err: any) => {
              Swal.fire('Erro!', err.message, 'error');
              console.error(err);
            },
          });
      }
    });
  }

  ajustarQuantidade(id: number): void {
    const item = this.estoque.find((i) => i.id === id);
    if (!item) return;
    Swal.fire({
      title: 'Ajustar Estoque',
      html: `
        <p><strong>Item:</strong> ${item.descricao}</p>
        <p><strong>Quantidade atual:</strong> ${item.quantidade}</p>
        <input id="quantidade" type="text" class="swal2-input" placeholder="Informe o valor a ajustar (use '-' para subtrair)">
      `,
      showCancelButton: true,
      confirmButtonText: 'Ajustar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const quantidade = parseInt(
          (document.getElementById('quantidade') as HTMLInputElement).value,
          10
        );

        if (isNaN(quantidade) || quantidade === 0) {
          Swal.showValidationMessage('Digite um valor válido diferente de 0.');
          return false;
        }

        return { quantidade };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.estoqueService.adjustStock(id, result.value.quantidade).subscribe({
          next: (response: any) => {
            Swal.fire('Sucesso!', 'Estoque ajustado com sucesso.', 'success');
            console.log(response);
            this.carregarEstoque();
          },
          error: (err: any) => {
            Swal.fire('Erro!', err.error.message, 'error');
            console.error(err);
          },
        });
      }
    });
  }

  removerItem(id: number): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.estoqueService.delete(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Insumo excluído com sucesso!',
              text: 'O insumo foi removido permanentemente.',
              icon: 'success',
              theme: 'light',
              position: 'center',
            }).then(() => this.carregarEstoque());
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Erro ao excluir',
              text:
                err.error.message ||
                'Houve um problema ao excluir os dados. Tente novamente.',
              icon: 'error',
              theme: 'light',
              position: 'center',
            });
          },
        });
      }
    });
  }

  filtrarEstoque(): void {
    console.log('Filtrar Estoque iniciado');
    console.log(this.searchTerm);
    debugger;
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.estoqueFiltrados = [...this.estoque];
    } else {
      this.estoqueFiltrados = this.estoque.filter((item) =>
        item.descricao.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }
}
