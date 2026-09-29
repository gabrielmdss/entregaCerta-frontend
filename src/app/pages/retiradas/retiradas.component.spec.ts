import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import Swal from 'sweetalert2';
import { RetiradasComponent } from './retiradas.component';
import { baseUrl } from '../../config/api';

registerLocaleData(localePt, 'pt-BR');

describe('RetiradasComponent', () => {
  let fixture: ComponentFixture<RetiradasComponent>;
  let comp: RetiradasComponent;
  let http: HttpTestingController;
  let el: HTMLElement;

  const ret = (id: number, assistido_id = 1, nome = 'Maria Silva', dia = 10) => ({
    id,
    assistido_id,
    nome,
    documento: '12345678901',
    data_retirada: `2026-09-${String(dia).padStart(2, '0')}T00:00:00.000Z`,
  });
  const muitas = (n: number) => Array.from({ length: n }, (_, i) => ret(i + 1, 1, 'Maria Silva', (i % 28) + 1));
  const assistidos = [
    { id: 1, nome: 'Maria Silva', documento: '12345678901' },
    { id: 2, nome: 'Joao Souza', documento: '123456789' },
  ];
  const notFound = { status: 404, statusText: 'Not Found' };

  const get = (sufixo: string): TestRequest =>
    http.expectOne((r) => r.method === 'GET' && r.url === `${baseUrl}${sufixo}`);
  const text = () => (el.textContent ?? '').replace(/\s+/g, ' ');
  const itens = () => el.querySelectorAll('.ret-item');
  const botao = (rotulo: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => (b.textContent ?? '').trim() === rotulo) as
      | HTMLButtonElement
      | undefined;
  const render = () => fixture.detectChanges();

  /** Responde a página + total da listagem paginada. */
  const carregar = (lista: any[], total: number, pagina = 1, tamanho = 10) => {
    get(`/retirada/paginas/${pagina}/${tamanho}`).flush(lista);
    get('/retirada/total').flush(total);
    render();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RetiradasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RetiradasComponent);
    comp = fixture.componentInstance;
    el = fixture.nativeElement;
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
    render();
    get('/assistido').flush(assistidos);
  });

  afterEach(() => http.verify());

  it('mostra loading e calcula o total de páginas com o total chegando antes da lista (D2)', () => {
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    get('/retirada/total').flush(12);
    render();
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    get('/retirada/paginas/1/10').flush(muitas(10));
    render();
    expect(el.querySelector('[role="status"]')).toBeNull();
    expect(itens().length).toBe(10);
    expect(text()).toContain('Página 1 de 2');
    expect(botao('Próxima')?.disabled).toBeFalse();
    expect(botao('Anterior')?.disabled).toBeTrue();
  });

  it('calcula o total de páginas com a lista chegando antes do total (D2)', () => {
    get('/retirada/paginas/1/10').flush(muitas(10));
    render();
    expect(text()).not.toContain('Página 1 de 0');
    get('/retirada/total').flush(12);
    render();
    expect(text()).toContain('Página 1 de 2');
  });

  it('renderiza nome, documento formatado e data dd/MM/yyyy em UTC', () => {
    carregar([ret(1, 1, 'Maria Silva', 5)], 1);
    const item = itens()[0];
    expect(item.querySelector('.ret-item-nome')?.textContent).toContain('Maria Silva');
    expect(item.textContent).toContain('123.456.789-01');
    expect(item.textContent).toContain('05/09/2026');
    expect(text()).toContain('Página 1 de 1');
    expect(botao('Próxima')?.disabled).toBeTrue();
  });

  it('sem registros: mensagem de vazio, sem "Página 1 de 0" nem "Próxima" habilitado (D2)', () => {
    carregar([], 0);
    expect(text()).toContain('Nenhuma retirada encontrada');
    expect(text()).not.toContain('Página 1 de 0');
    expect(botao('Próxima')).toBeUndefined();
  });

  it('erro de rede na lista mostra estado de erro e permite tentar novamente', () => {
    const total = get('/retirada/total');
    get('/retirada/paginas/1/10').flush('x', { status: 500, statusText: 'Erro' });
    expect(total.cancelled).toBeTrue();
    render();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar as retiradas');
    botao('Tentar novamente')!.click();
    carregar([ret(1)], 1);
    expect(itens().length).toBe(1);
  });

  it('navega até a última página e mudar o tamanho volta à página 1', () => {
    carregar(muitas(10), 12, 1, 10);
    botao('Próxima')!.click();
    carregar(muitas(2), 12, 2, 10);
    expect(text()).toContain('Página 2 de 2');
    expect(botao('Próxima')?.disabled).toBeTrue();

    comp.changePageSize(20);
    carregar(muitas(12), 12, 1, 20);
    expect(comp.currentPage).toBe(1);
    expect(text()).toContain('Página 1 de 1');
  });

  it('filtro por assistido sem seleção mostra aviso e não prende o loading (D4)', () => {
    carregar(muitas(3), 3);
    comp.aplicarFiltros();
    render();
    expect(comp.isLoading).toBeFalse();
    expect(text()).toContain('Selecione um assistido ou informe um intervalo de datas.');
    expect(itens().length).toBe(3);
    http.expectNone((r) => r.url.includes('/retirada/assistido/'));
  });

  it('filtro por assistido pagina no cliente e abre Detalhes só com os dados do assistido (D3/D4)', () => {
    carregar(muitas(10), 30);
    comp.onAssistidoSelecionado(2);
    comp.aplicarFiltros();
    render();
    expect(comp.mostrarModalDetalhesAssistido).toBeFalse();

    const doB = Array.from({ length: 12 }, (_, i) => ret(100 + i, 2, 'Joao Souza', 28 - i));
    get('/retirada/assistido/2').flush(doB);
    get('/assistido/2').flush({
      id: 2,
      nome: 'Joao Souza',
      documento: '123456789',
      data_nascimento: '1985-03-12T00:00:00.000Z',
      imagem: null,
    });
    render();

    expect(comp.isLoading).toBeFalse();
    const modal = el.querySelector('[role="dialog"][aria-labelledby="titulo-detalhes"]')!;
    expect(modal).not.toBeNull();
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.textContent).toContain('Joao Souza');
    expect(modal.textContent).toContain('12/03/1985');
    expect(modal.querySelectorAll('.ret-ultimas li').length).toBe(4);
    expect(modal.querySelector('.ret-ultimas li')?.textContent).toContain('28/09/2026');

    comp.closeModalDetalhesAssistido();
    render();
    expect(text()).toContain('(12)');
    expect(itens().length).toBe(10);
    expect(text()).toContain('Página 1 de 2');
    botao('Próxima')!.click(); // paginação local: nenhuma requisição nova (verify no afterEach)
    render();
    expect(itens().length).toBe(2);
    expect(Array.from(itens()).every((i) => i.textContent!.includes('Joao Souza'))).toBeTrue();
    expect(text()).toContain('Página 2 de 2');
  });

  it('filtro por assistido sem retiradas (404) mostra estado vazio', () => {
    carregar(muitas(3), 3);
    comp.onAssistidoSelecionado(2);
    comp.aplicarFiltros();
    get('/retirada/assistido/2').flush({ message: 'Retirada não encontrada' }, notFound);
    get('/assistido/2').flush({ id: 2, nome: 'Joao Souza', documento: '123456789' });
    render();
    expect(comp.isLoading).toBeFalse();
    expect(el.querySelector('[aria-labelledby="titulo-detalhes"]')?.textContent).toContain('Nenhuma retirada registrada.');
    comp.closeModalDetalhesAssistido();
    render();
    expect(text()).toContain('Nenhuma retirada encontrada');
    expect(botao('Próxima')).toBeUndefined();
  });

  it('filtro por intervalo pagina o resultado; intervalo vazio (404) mostra vazio (D3)', () => {
    carregar(muitas(10), 30);
    comp.changePageSize(5);
    carregar(muitas(5), 30, 1, 5);
    comp.dataInicialFilter = '2026-03-01';
    comp.dataFinalFilter = '2026-06-30';
    comp.aplicarFiltros();
    get('/retirada/periodo/2026-03-01/2026-06-30').flush(muitas(7));
    render();
    expect(itens().length).toBe(5);
    expect(text()).toContain('(7)');
    expect(text()).toContain('Página 1 de 2');
    botao('Próxima')!.click();
    render();
    expect(itens().length).toBe(2);
    expect(text()).toContain('Página 2 de 2');

    comp.dataInicialFilter = '2020-01-01';
    comp.dataFinalFilter = '2020-01-31';
    comp.aplicarFiltros();
    get('/retirada/periodo/2020-01-01/2020-01-31').flush(
      { message: 'Nenhuma retirada encontrada no intervalo especificado.' },
      notFound,
    );
    render();
    expect(comp.currentPage).toBe(1);
    expect(text()).toContain('Nenhuma retirada encontrada');
    expect(botao('Próxima')).toBeUndefined();
  });

  it('intervalo incompleto não requisita; 400 do backend no intervalo mostra a mensagem sem trocar a lista', () => {
    carregar(muitas(3), 3);
    comp.dataInicialFilter = '2026-09-01';
    comp.aplicarFiltros();
    render();
    expect(text()).toContain('Informe a data inicial e a data final.');
    http.expectNone((r) => r.url.includes('/retirada/periodo/'));
    comp.dataFinalFilter = '2026-09-30';
    comp.aplicarFiltros();
    get('/retirada/periodo/2026-09-01/2026-09-30').flush(
      { message: 'Datas inválidas.' },
      { status: 400, statusText: 'Bad Request' },
    );
    render();
    expect(comp.isLoading).toBeFalse();
    expect(comp.filtroAtivo).toBeNull();
    expect(text()).toContain('Datas inválidas.');
    expect(itens().length).toBe(3);
  });

  it('limpar filtros volta à página 1, remove o filtro e limpa a seleção do assistido (B6)', async () => {
    carregar(muitas(10), 30);
    botao('Próxima')!.click();
    carregar(muitas(10), 30, 2, 10);
    comp.onAssistidoSelecionado(1);
    render();
    await fixture.whenStable();
    render();
    expect(el.querySelector('.ret-filtros app-select .ng-value')?.textContent).toContain('Maria Silva');
    comp.dataInicialFilter = '2026-01-01';
    comp.dataFinalFilter = '2026-12-31';
    comp.aplicarFiltros();
    get('/retirada/assistido/1').flush(muitas(3));
    get('/assistido/1').flush({ id: 1, nome: 'Maria Silva', documento: '12345678901' });
    comp.closeModalDetalhesAssistido();
    render();
    expect(comp.filtroAtivo).toBe('combinado');

    botao('Limpar filtros')!.click();
    carregar(muitas(10), 30, 1, 10);
    await fixture.whenStable();
    render();
    expect(comp.currentPage).toBe(1);
    expect(comp.filtroAtivo).toBeNull();
    expect(comp.assistidoIdFilter).toBeNull();
    expect(comp.dataInicialFilter).toBeNull();
    expect(el.querySelector('.ret-filtros app-select .ng-value')).toBeNull();
    expect(text()).toContain('Página 1 de 3');
  });

  it('registrar envia o payload e recarrega a lista e o total', () => {
    carregar(muitas(10), 10);
    expect(text()).toContain('Página 1 de 1');
    botao('Registrar retirada')!.click();
    render();
    expect(el.querySelector('[role="dialog"][aria-labelledby="titulo-registrar"]')).not.toBeNull();
    comp.onAssistidoSelecionadoRegistrarRetirada(2);
    comp.novaRetirada.data_retirada = '2026-09-20';
    comp.registrarRetirada();
    const post = http.expectOne(`${baseUrl}/retirada`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ assistido_id: 2, data_retirada: '2026-09-20' });
    post.flush({ id: 99 }, { status: 201, statusText: 'Created' });
    carregar(muitas(10), 11);
    expect(comp.mostrarModalRegistrar).toBeFalse();
    expect(comp.totalRetiradas).toBe(11);
    expect(text()).toContain('(11)');
    expect(text()).toContain('Página 1 de 2');
  });

  it('Registrar: o app-select reflete o assistido escolhido e volta vazio ao reabrir o modal', async () => {
    carregar(muitas(10), 10);
    const valorSelect = () =>
      el.querySelector('[aria-labelledby="titulo-registrar"] app-select .ng-value')?.textContent ?? null;
    botao('Registrar retirada')!.click();
    render();
    comp.onAssistidoSelecionadoRegistrarRetirada(2);
    render();
    await fixture.whenStable();
    render();
    expect(valorSelect()).toContain('Joao Souza');

    botao('Cancelar')!.click();
    render();
    expect(comp.novaRetirada.assistido_id).toBe(0);
    botao('Registrar retirada')!.click();
    render();
    await fixture.whenStable();
    render();
    expect(el.querySelector('[aria-labelledby="titulo-registrar"]')).not.toBeNull();
    expect(valorSelect()).toBeNull();
  });

  it('erro ao registrar sem corpo (err.error nulo) não quebra e usa mensagem padrão', () => {
    carregar([], 0);
    comp.openModalRegistrar(comp.novaRetirada);
    comp.registrarRetirada();
    http.expectOne(`${baseUrl}/retirada`).error(new ProgressEvent('error'));
    expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ title: 'Erro ao retirar', text: jasmine.stringMatching(/Tente novamente/) }),
    );
    expect(comp.mostrarModalRegistrar).toBeFalse();
  });

  it('Alterar: data em yyyy-MM-dd, assistido pré-selecionado e PUT com assistido_id/data (D1)', async () => {
    carregar([ret(7, 1, 'Maria Silva', 21)], 1);
    botao('Alterar')!.click();
    render();
    await fixture.whenStable();
    render();
    const modal = el.querySelector('[role="dialog"][aria-labelledby="titulo-alterar"]')!;
    expect(modal).not.toBeNull();
    expect(modal.querySelector<HTMLInputElement>('#alterar-data')!.value).toBe('2026-09-21');
    expect(modal.querySelector('app-select .ng-value')?.textContent).toContain('Maria Silva');
    expect(modal.querySelector('input#nome')).toBeNull();
    expect(botao('Salvar')).toBeDefined();
    expect(botao('Cadastrar')).toBeUndefined();

    comp.onAssistidoSelecionadoAlterarRetirada(2);
    botao('Salvar')!.click();
    const put = http.expectOne(`${baseUrl}/retirada/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ assistido_id: 2, data_retirada: '2026-09-21' });
    put.flush({ id: 7, assistido_id: 2 });
    carregar([ret(7, 2, 'Joao Souza', 21)], 1);
    expect(comp.mostrarModal).toBeFalse();
    expect(itens()[0].textContent).toContain('Joao Souza');
  });

  describe('filtros combinados (botão único "Filtrar")', () => {
    /** Retirada com data ISO arbitrária (UTC). */
    const em = (id: number, iso: string) => ({ ...ret(id, 2, 'Joao Souza'), data_retirada: iso });

    it('assistido + intervalo: busca por assistido, filtra no cliente e pagina o resultado', () => {
      carregar(muitas(3), 3);
      comp.changePageSize(5);
      carregar(muitas(3), 3, 1, 5);
      comp.onAssistidoSelecionado(2);
      comp.dataInicialFilter = '2026-09-01';
      comp.dataFinalFilter = '2026-09-30';
      botao('Filtrar')!.click();
      http.expectNone((r) => r.url.includes('/retirada/periodo/'));
      const doB = [
        ...Array.from({ length: 7 }, (_, i) => em(200 + i, `2026-09-${String(20 - i).padStart(2, '0')}T12:00:00.000Z`)),
        em(300, '2026-08-31T23:59:59.999Z'),
        em(301, '2026-10-01T00:00:00.000Z'),
      ];
      get('/retirada/assistido/2').flush(doB);
      get('/assistido/2').flush({ id: 2, nome: 'Joao Souza', documento: '123456789' });
      render();
      // Detalhes continua abrindo e mostra o histórico do assistido (sem recorte do período).
      expect(comp.mostrarModalDetalhesAssistido).toBeTrue();
      expect(comp.ultimasRetiradasAssistido.length).toBe(4);
      comp.closeModalDetalhesAssistido();
      render();
      expect(comp.filtroAtivo).toBe('combinado');
      expect(text()).toContain('(7)');
      expect(text()).toContain('Filtrado por assistido Joao Souza e período de 01/09/2026 a 30/09/2026.');
      expect(itens().length).toBe(5);
      expect(text()).toContain('Página 1 de 2');
      botao('Próxima')!.click();
      render();
      expect(itens().length).toBe(2);
    });

    it('limites inclusivos por dia UTC (igual ao backend: início 00:00Z e fim 23:59:59.999Z)', () => {
      carregar([], 0);
      comp.onAssistidoSelecionado(2);
      comp.dataInicialFilter = '2026-09-10';
      comp.dataFinalFilter = '2026-09-12';
      comp.aplicarFiltros();
      get('/retirada/assistido/2').flush([
        em(1, '2026-09-09T23:59:59.999Z'),
        em(2, '2026-09-10T00:00:00.000Z'),
        em(3, '2026-09-12T23:59:59.999Z'),
        em(4, '2026-09-13T00:00:00.000Z'),
      ]);
      get('/assistido/2').flush({ id: 2, nome: 'Joao Souza', documento: '123456789' });
      render();
      expect(comp.resultadoFiltro.map((r) => r.id)).toEqual([2, 3]);
    });

    it('combinação sem resultado no período mostra vazio, sem paginação', () => {
      carregar(muitas(3), 3);
      comp.onAssistidoSelecionado(2);
      comp.dataInicialFilter = '2020-01-01';
      comp.dataFinalFilter = '2020-01-31';
      comp.aplicarFiltros();
      get('/retirada/assistido/2').flush([em(1, '2026-09-10T00:00:00.000Z')]);
      get('/assistido/2').flush({ id: 2, nome: 'Joao Souza', documento: '123456789' });
      comp.closeModalDetalhesAssistido();
      render();
      expect(comp.isLoading).toBeFalse();
      expect(text()).toContain('Nenhuma retirada encontrada');
      expect(text()).toContain('Filtrado por assistido Joao Souza e período');
      expect(botao('Próxima')).toBeUndefined();
    });

    it('somente intervalo usa /retirada/periodo; somente assistido usa /retirada/assistido', () => {
      carregar([], 0);
      comp.dataInicialFilter = '2026-09-01';
      comp.dataFinalFilter = '2026-09-30';
      comp.aplicarFiltros();
      get('/retirada/periodo/2026-09-01/2026-09-30').flush(muitas(2));
      render();
      expect(comp.filtroAtivo).toBe('intervalo');
      expect(text()).toContain('Filtrado por período de 01/09/2026 a 30/09/2026.');

      comp.dataInicialFilter = null;
      comp.dataFinalFilter = null;
      comp.onAssistidoSelecionado(1);
      comp.aplicarFiltros();
      get('/retirada/assistido/1').flush(muitas(3));
      get('/assistido/1').flush({ id: 1, nome: 'Maria Silva', documento: '12345678901' });
      render();
      expect(comp.filtroAtivo).toBe('assistido');
      expect(comp.resultadoFiltro.length).toBe(3);
    });

    it('validação: sem filtro, só uma data e início > fim não requisitam nada', () => {
      carregar(muitas(3), 3);
      comp.aplicarFiltros();
      render();
      expect(text()).toContain('Selecione um assistido ou informe um intervalo de datas.');
      comp.onAssistidoSelecionado(2);
      comp.dataInicialFilter = '2026-09-01';
      comp.aplicarFiltros();
      render();
      expect(text()).toContain('Informe a data inicial e a data final.');
      comp.dataFinalFilter = '2026-08-01';
      comp.aplicarFiltros();
      render();
      expect(text()).toContain('A data inicial não pode ser posterior à data final.');
      expect(comp.isLoading).toBeFalse();
      expect(comp.filtroAtivo).toBeNull();
      expect(itens().length).toBe(3);
      // data inicial == final é válida (um único dia)
      comp.dataFinalFilter = '2026-09-01';
      comp.aplicarFiltros();
      get('/retirada/assistido/2').flush([]);
      get('/assistido/2').flush({ id: 2, nome: 'Joao Souza', documento: '123456789' });
      expect(comp.filtroAtivo).toBe('combinado');
    });

    it('limpar filtros após combinação limpa tudo e volta à página 1 da lista completa', () => {
      carregar(muitas(10), 30);
      comp.onAssistidoSelecionado(2);
      comp.dataInicialFilter = '2026-09-01';
      comp.dataFinalFilter = '2026-09-30';
      comp.aplicarFiltros();
      get('/retirada/assistido/2').flush(muitas(12));
      get('/assistido/2').flush({ id: 2, nome: 'Joao Souza', documento: '123456789' });
      comp.closeModalDetalhesAssistido();
      render();
      botao('Próxima')!.click();
      render();
      expect(comp.currentPage).toBe(2);
      botao('Limpar filtros')!.click();
      carregar(muitas(10), 30);
      expect(comp.currentPage).toBe(1);
      expect(comp.filtroAtivo).toBeNull();
      expect(comp.filtroAplicado).toEqual({ assistidoId: null, inicio: null, fim: null });
      expect(comp.assistidoIdFilter).toBeNull();
      expect(comp.dataInicialFilter).toBeNull();
      expect(comp.dataFinalFilter).toBeNull();
      expect(text()).not.toContain('Filtrado por');
      expect(text()).toContain('Página 1 de 3');
    });
  });
});
