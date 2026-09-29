import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import Swal from 'sweetalert2';
import { EstoqueComponent } from './estoque.component';
import { baseUrl } from '../../config/api';

registerLocaleData(localePt, 'pt-BR');

describe('EstoqueComponent', () => {
  let fixture: ComponentFixture<EstoqueComponent>;
  let comp: EstoqueComponent;
  let http: HttpTestingController;
  let el: HTMLElement;
  let swal: jasmine.Spy;

  const lista = [
    { id: 1, descricao: 'Cesta básica', quantidade: 1500, data_atualizacao: '2026-09-01T00:00:00.000Z' },
    { id: 2, descricao: 'Leite', quantidade: 12, data_atualizacao: '2026-09-01T00:00:00.000Z' },
  ];

  const req = (method: string, sufixo: string): TestRequest =>
    http.expectOne((r) => r.method === method && r.url === `${baseUrl}${sufixo}`);
  const render = () => fixture.detectChanges();
  const text = () => (el.textContent ?? '').replace(/\s+/g, ' ');
  const linhas = () => el.querySelectorAll('tbody tr');
  const botao = (rotulo: string, raiz: ParentNode = el) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => (b.textContent ?? '').trim() === rotulo) as
      | HTMLButtonElement
      | undefined;
  const dialogo = (titulo: string) => el.querySelector(`[role="dialog"][aria-labelledby="${titulo}"]`);
  const carregar = (dados: any = lista) => {
    req('GET', '/estoque').flush(dados);
    render();
  };
  const digitar = (seletor: string, valor: string) => {
    const input = el.querySelector<HTMLInputElement>(seletor)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    render();
  };
  const ultimoSwal = () => swal.calls.mostRecent().args;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EstoqueComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EstoqueComponent);
    comp = fixture.componentInstance;
    el = fixture.nativeElement;
    swal = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
    render();
  });

  afterEach(() => http.verify());

  describe('listagem', () => {
    it('mostra loading e depois a tabela com quantidade pt-BR e ações com aria-label', () => {
      expect(el.querySelector('[role="status"]')?.textContent).toContain('Carregando estoque');
      carregar();
      expect(el.querySelector('[role="status"]')).toBeNull();
      expect(linhas().length).toBe(2);
      expect(linhas()[0].querySelector('.est-col-qtd')?.textContent).toContain('1.500');
      expect(linhas()[0].querySelector('.est-col-id')?.textContent).toContain('1');
      const [ajustar, excluir] = Array.from(linhas()[0].querySelectorAll('button'));
      expect(ajustar.getAttribute('aria-label')).toBe('Ajustar quantidade de Cesta básica');
      expect(excluir.getAttribute('aria-label')).toBe('Excluir Cesta básica');
      expect(excluir.classList).toContain('ec-btn--danger');
      expect(el.querySelector('label[for="busca-estoque"]')).not.toBeNull();
      expect(text()).toContain('(2)');
    });

    it('lista vazia: "Nenhum item em estoque"', () => {
      carregar([]);
      expect(text()).toContain('Nenhum item em estoque');
      expect(text()).not.toContain('Nenhum resultado para a busca');
      expect(el.querySelector('table')).toBeNull();
    });

    it('erro na carga desliga o loading, mostra alerta e "Tentar novamente" recarrega', () => {
      req('GET', '/estoque').flush(null, { status: 500, statusText: 'Erro' });
      render();
      expect(comp.isLoading).toBeFalse();
      expect(el.querySelector('[role="status"]')).toBeNull();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar o estoque');
      botao('Tentar novamente')!.click();
      render();
      expect(comp.isLoading).toBeTrue();
      carregar();
      expect(linhas().length).toBe(2);
    });
  });

  describe('busca', () => {
    it('filtra por descrição sem diferenciar maiúsculas, mostra vazio de busca e "Limpar" restaura', () => {
      const debug = spyOn(console, 'log');
      carregar();
      digitar('#busca-estoque', 'LEI');
      expect(linhas().length).toBe(1);
      expect(linhas()[0].textContent).toContain('Leite');
      expect(text()).toContain('(1 de 2)');
      digitar('#busca-estoque', 'arroz');
      expect(text()).toContain('Nenhum resultado para a busca');
      expect(text()).not.toContain('Nenhum item em estoque');
      botao('Limpar')!.click();
      render();
      expect(linhas().length).toBe(2);
      expect(debug).not.toHaveBeenCalled();
    });

    it('recarregar a lista mantém o filtro digitado', () => {
      carregar();
      digitar('#busca-estoque', 'leite');
      comp.carregarEstoque();
      carregar();
      expect(linhas().length).toBe(1);
    });
  });

  describe('adicionar', () => {
    const abrir = () => {
      carregar();
      botao('Adicionar item')!.click();
      render();
    };

    it('abre o modal com labels e valida campos obrigatórios sem requisitar', () => {
      abrir();
      const d = dialogo('titulo-adicionar')!;
      expect(d).not.toBeNull();
      expect(d.querySelector('label[for="add-descricao"]')).not.toBeNull();
      expect(d.querySelector('label[for="add-quantidade"]')).not.toBeNull();
      botao('Adicionar', d)!.click();
      render();
      expect(d.querySelector('[role="alert"]')?.textContent).toContain('Preencha todos os campos!');
      digitar('#add-descricao', 'Arroz');
      botao('Adicionar', d)!.click();
      render();
      expect(d.querySelector('[role="alert"]')?.textContent).toContain('Preencha todos os campos!');
      http.expectNone(`${baseUrl}/estoque`, 'sem POST');
    });

    it('envia {descricao, quantidade numérica}, mostra sucesso, fecha e recarrega', async () => {
      abrir();
      digitar('#add-descricao', 'Arroz');
      digitar('#add-quantidade', '30');
      await fixture.whenStable();
      botao('Adicionar', dialogo('titulo-adicionar')!)!.click();
      const post = req('POST', '/estoque');
      expect(post.request.body).toEqual({ descricao: 'Arroz', quantidade: 30 });
      post.flush({ id: 3, descricao: 'Arroz', quantidade: 30 }, { status: 201, statusText: 'Created' });
      expect(ultimoSwal()).toEqual(['Sucesso!', 'Insumo Arroz adicionado com sucesso!', 'success']);
      carregar([...lista, { id: 3, descricao: 'Arroz', quantidade: 30 }]);
      expect(dialogo('titulo-adicionar')).toBeNull();
      expect(linhas().length).toBe(3);
    });

    it('erro mostra a mensagem da API (não a do HttpClient) e mantém o modal aberto', () => {
      abrir();
      comp.novoItem = { descricao: 'Cesta básica', quantidade: 1 };
      comp.confirmarAdicionar();
      req('POST', '/estoque').flush({ message: 'Item já cadastrado' }, { status: 500, statusText: 'Erro' });
      render();
      expect(ultimoSwal()).toEqual(['Erro!', 'Item já cadastrado', 'error']);
      expect(dialogo('titulo-adicionar')).not.toBeNull();
      expect(comp.isSalvando).toBeFalse();
    });

    it('erro sem corpo (err.error nulo) usa mensagem padrão', () => {
      abrir();
      comp.novoItem = { descricao: 'X', quantidade: 1 };
      comp.confirmarAdicionar();
      req('POST', '/estoque').error(new ProgressEvent('error'));
      expect(ultimoSwal()[1]).toMatch(/Tente novamente/);
      expect(ultimoSwal()[1]).not.toMatch(/Http failure/);
    });
  });

  describe('ajustar', () => {
    const abrir = () => {
      carregar();
      linhas()[1].querySelector<HTMLButtonElement>('button.ec-btn--secondary')!.click();
      render();
      return dialogo('titulo-ajuste')!;
    };

    it('abre com item e quantidade atual, tem Cancelar/Fechar e valida quantidade > 0', () => {
      const d = abrir();
      expect(d.textContent).toContain('Leite');
      expect(d.textContent).toContain('12');
      expect(d.querySelector('label[for="ajuste-quantidade"]')).not.toBeNull();
      expect(d.querySelector('button[aria-label="Fechar"]')).not.toBeNull();
      comp.quantidadeAjuste = 0;
      botao('Adicionar', d)!.click();
      render();
      expect(d.querySelector('[role="alert"]')?.textContent).toContain('Digite um valor válido maior que 0.');
      comp.quantidadeAjuste = -2;
      botao('Subtrair', d)!.click();
      http.expectNone(`${baseUrl}/estoque/ajuste/2`);
      botao('Cancelar', d)!.click();
      render();
      expect(dialogo('titulo-ajuste')).toBeNull();
    });

    it('Adicionar envia quantidade positiva e Subtrair negativa', () => {
      let d = abrir();
      comp.quantidadeAjuste = 5;
      botao('Adicionar', d)!.click();
      const soma = req('POST', '/estoque/ajuste/2');
      expect(soma.request.body).toEqual({ quantidade: 5 });
      soma.flush({ id: 2, quantidade: 17 });
      expect(ultimoSwal()).toEqual(['Sucesso!', 'Estoque ajustado com sucesso.', 'success']);
      render();
      expect(dialogo('titulo-ajuste')).toBeNull();

      d = abrir();
      comp.quantidadeAjuste = 3;
      botao('Subtrair', d)!.click();
      const sub = req('POST', '/estoque/ajuste/2');
      expect(sub.request.body).toEqual({ quantidade: -3 });
      sub.flush({ id: 2, quantidade: 9 });
      carregar();
      expect(dialogo('titulo-ajuste')).toBeNull();
    });

    it('estoque insuficiente: mostra a mensagem da API e mantém o modal aberto', () => {
      const d = abrir();
      comp.quantidadeAjuste = 100;
      botao('Subtrair', d)!.click();
      req('POST', '/estoque/ajuste/2').flush(
        { message: 'Quantidade de Leite(s) insuficiente' },
        { status: 500, statusText: 'Erro' },
      );
      render();
      expect(ultimoSwal()).toEqual(['Erro!', 'Quantidade de Leite(s) insuficiente', 'error']);
      expect(dialogo('titulo-ajuste')).not.toBeNull();
    });

    it('descrição com HTML é exibida como texto (sem injeção)', () => {
      carregar([{ id: 9, descricao: '<img src=x onerror="alert(1)">', quantidade: 1 }]);
      linhas()[0].querySelector<HTMLButtonElement>('button.ec-btn--secondary')!.click();
      render();
      const d = dialogo('titulo-ajuste')!;
      expect(d.querySelector('img')).toBeNull();
      expect(d.textContent).toContain('<img src=x onerror="alert(1)">');
    });
  });

  describe('excluir', () => {
    it('cancelar a confirmação não requisita', async () => {
      carregar();
      linhas()[0].querySelector<HTMLButtonElement>('button.ec-btn--danger')!.click();
      await fixture.whenStable();
      expect(ultimoSwal()[0]).toEqual(jasmine.objectContaining({ title: 'Tem certeza?', showCancelButton: true }));
      http.expectNone(`${baseUrl}/estoque/1`);
    });

    it('confirmar exclui por id e recarrega; erro sem corpo usa mensagem padrão', async () => {
      carregar();
      swal.and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      comp.removerItem(1);
      await fixture.whenStable();
      req('DELETE', '/estoque/1').flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();
      carregar();

      comp.removerItem(2);
      await fixture.whenStable();
      req('DELETE', '/estoque/2').error(new ProgressEvent('error'));
      expect(ultimoSwal()[0]).toEqual(
        jasmine.objectContaining({ title: 'Erro ao excluir', text: jasmine.stringMatching(/Tente novamente/) }),
      );
    });
  });
});
