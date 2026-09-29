import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Estoque } from '../../models/estoque.interface';
import { EstoqueService } from '../../services/estoque.service';
import { DialogDirective } from '../../shared/directives/dialog.directive';

/** Mensagem da API com fallback seguro (err.error pode ser nulo, string ou objeto). */
function mensagemErro(err: any, fallback: string): string {
  const msg = err?.error?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

@Component({
  selector: 'app-estoque',
  imports: [CommonModule, FormsModule, DialogDirective],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css',
})
export class EstoqueComponent implements OnInit {
  estoque: Estoque[] = [];
  estoqueFiltrados: Estoque[] = [];
  isLoading: boolean = false;
  /** Falha ao carregar a lista (rede/5xx). */
  erroLista: boolean = false;
  searchTerm: string = '';

  /** Modal "Adicionar item". */
  mostrarModalAdicionar: boolean = false;
  novoItem: { descricao: string; quantidade: number | null } = { descricao: '', quantidade: null };
  erroAdicionar: string = '';

  /** Modal "Ajustar quantidade". */
  itemAjuste: Estoque | null = null;
  quantidadeAjuste: number | null = null;
  erroAjuste: string = '';

  /** Requisição de inclusão/ajuste em andamento (evita envio duplo). */
  isSalvando: boolean = false;

  constructor(private estoqueService: EstoqueService) {}

  ngOnInit(): void {
    this.carregarEstoque();
  }

  carregarEstoque(): void {
    this.isLoading = true;
    this.erroLista = false;
    this.estoqueService
      .selectAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (dados: any) => {
          this.estoque = Array.isArray(dados) ? dados : [];
          this.filtrarEstoque();
        },
        error: () => {
          this.estoque = [];
          this.estoqueFiltrados = [];
          this.erroLista = true;
        },
      });
  }

  // ---- Adicionar ----

  adicionarItem(): void {
    this.novoItem = { descricao: '', quantidade: null };
    this.erroAdicionar = '';
    this.mostrarModalAdicionar = true;
  }

  fecharModalAdicionar(): void {
    this.mostrarModalAdicionar = false;
  }

  /** Mesma validação de antes (campos obrigatórios) e mesmo payload: insert(descricao, +quantidade). */
  confirmarAdicionar(): void {
    if (this.isSalvando) return;
    const descricao = this.novoItem.descricao;
    const quantidade = this.novoItem.quantidade;
    if (!descricao || quantidade === null || quantidade === undefined || String(quantidade) === '') {
      this.erroAdicionar = 'Preencha todos os campos!';
      return;
    }
    this.erroAdicionar = '';
    this.isSalvando = true;
    this.estoqueService
      .insert(descricao, +quantidade)
      .pipe(finalize(() => (this.isSalvando = false)))
      .subscribe({
        next: (response: Estoque) => {
          Swal.fire('Sucesso!', `Insumo ${response?.descricao ?? descricao} adicionado com sucesso!`, 'success');
          this.fecharModalAdicionar();
          this.carregarEstoque();
        },
        // O modal continua aberto com os dados digitados, para o usuário corrigir.
        error: (err: any) => {
          Swal.fire('Erro!', mensagemErro(err, 'Não foi possível adicionar o item. Tente novamente.'), 'error');
        },
      });
  }

  // ---- Ajustar ----

  ajustarQuantidade(id: number): void {
    const item = this.estoque.find((i) => i.id === id);
    if (!item) return;
    this.itemAjuste = item;
    this.quantidadeAjuste = null;
    this.erroAjuste = '';
  }

  fecharModalAjuste(): void {
    this.itemAjuste = null;
  }

  /** sinal = 1 (Adicionar) ou -1 (Subtrair); payload adjustStock(id, ±qtd) como antes. */
  confirmarAjuste(sinal: 1 | -1): void {
    if (!this.itemAjuste || this.isSalvando) return;
    const qtd = parseInt(String(this.quantidadeAjuste ?? ''), 10);
    if (isNaN(qtd) || qtd <= 0) {
      this.erroAjuste = 'Digite um valor válido maior que 0.';
      return;
    }
    this.erroAjuste = '';
    this.isSalvando = true;
    this.estoqueService
      .adjustStock(this.itemAjuste.id, sinal * qtd)
      .pipe(finalize(() => (this.isSalvando = false)))
      .subscribe({
        next: () => {
          Swal.fire('Sucesso!', 'Estoque ajustado com sucesso.', 'success');
          this.fecharModalAjuste();
          this.carregarEstoque();
        },
        // Ex.: "Quantidade de X(s) insuficiente" (validação do backend); o modal continua aberto.
        error: (err: any) => {
          Swal.fire('Erro!', mensagemErro(err, 'Não foi possível ajustar o estoque. Tente novamente.'), 'error');
        },
      });
  }

  // ---- Excluir ----

  removerItem(id: number): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-danger)',
      cancelButtonColor: 'var(--color-neutral)',
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
              text: mensagemErro(err, 'Houve um problema ao excluir os dados. Tente novamente.'),
              icon: 'error',
              theme: 'light',
              position: 'center',
            });
          },
        });
      }
    });
  }

  // ---- Busca ----

  filtrarEstoque(): void {
    const termo = (this.searchTerm ?? '').trim().toLowerCase();
    this.estoqueFiltrados =
      termo === ''
        ? [...this.estoque]
        : this.estoque.filter((item) => (item.descricao ?? '').toLowerCase().includes(termo));
  }

  limparBusca(): void {
    this.searchTerm = '';
    this.filtrarEstoque();
  }
}
