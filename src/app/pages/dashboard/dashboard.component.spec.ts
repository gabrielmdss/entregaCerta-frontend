import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { baseUrl } from '../../config/api';

registerLocaleData(localePt, 'pt-BR');

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const ano = new Date().getFullYear();
  const retiradas = [
    { id: 1, assistido_id: 1, nome: 'Maria Silva', documento: '12345678901', data_retirada: '2026-09-05T00:00:00.000Z' },
    { id: 2, assistido_id: 2, nome: 'Joao Souza', documento: '123456789', data_retirada: '2026-09-01T00:00:00.000Z' },
  ];
  const estoque = [{ id: 1, quantidade: 42, descricao: 'Cesta', data_atualizacao: '2026-09-01T00:00:00.000Z' }];

  const req = (sufixo: string) =>
    http.expectOne((r) => r.method === 'GET' && r.url.startsWith(`${baseUrl}${sufixo}`));
  const notFound = { status: 404, statusText: 'Not Found' };
  const text = () => (el.textContent ?? '').replace(/\s+/g, ' ');
  const kpis = () => Array.from(el.querySelectorAll('.dash-kpi-value')).map((e) => e.textContent?.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('mantém o loading visível até todas as respostas chegarem', () => {
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    expect(text()).toContain('Carregando dados');

    req('/assistido/total').flush({ total: 3 });
    req(`/retirada/meses/${ano}`).flush([]);
    req('/retirada/periodo/').flush(retiradas);
    req('/retirada/ultimas').flush(retiradas);
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading).toBeTrue();
    expect(el.querySelector('[role="status"]')).not.toBeNull();

    req('/estoque').flush(estoque);
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading).toBeFalse();
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  it('renderiza KPIs, estoque atual e últimas retiradas', () => {
    req('/assistido/total').flush({ total: 1234 });
    req(`/retirada/meses/${ano}`).flush([{ mes: 'September de 2026', total: 2 }]);
    req('/retirada/periodo/').flush(retiradas);
    req('/retirada/ultimas').flush(retiradas);
    req('/estoque').flush(estoque);
    fixture.detectChanges();

    expect(kpis()).toEqual(['1.234', '2']);
    const blocoEstoque = el.querySelector('.dash-estoque')?.textContent ?? '';
    expect(blocoEstoque).toContain('Cesta');
    expect(blocoEstoque).toContain('42');
    expect(text()).toContain('Últimas retiradas');
    const itens = el.querySelectorAll('.dash-retirada');
    expect(itens.length).toBe(2);
    expect(itens[0].textContent).toContain('Maria Silva');
    expect(itens[0].textContent).toContain('123.456.789-01');
    expect(itens[0].textContent).toContain('05/09/2026');
    expect(el.querySelector('app-line-charts')).not.toBeNull();
  });

  it('lista o estoque completo, sem rolagem interna, com link "Gerenciar estoque"', () => {
    const muitos = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      quantidade: 1000 + i,
      descricao: `Item ${i + 1}`,
      data_atualizacao: '2026-09-01T00:00:00.000Z',
    }));
    req('/assistido/total').flush({ total: 1 });
    req(`/retirada/meses/${ano}`).flush([]);
    req('/retirada/periodo/').flush([]);
    req('/retirada/ultimas').flush([]);
    req('/estoque').flush(muitos);
    fixture.detectChanges();

    const itens = el.querySelectorAll('.dash-estoque-item');
    expect(itens.length).toBe(12);
    expect(itens[0].textContent).toContain('Item 1');
    expect(itens[11].textContent).toContain('Item 12');
    expect(itens[11].textContent).toContain('1.011');
    expect(el.querySelector('.dash-scroll')).toBeNull();
    const lista = el.querySelector('.dash-estoque-lista') as HTMLElement;
    expect(getComputedStyle(lista).overflowY).toBe('visible');
    const link = el.querySelector('.dash-estoque a') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Gerenciar estoque');
    expect(link.getAttribute('href')).toBe('/estoque');
  });

  it('trata 404 do backend como vazio, sem item fantasma nem erro', () => {
    req('/assistido/total').flush({ message: 'Nenhum assistido cadastrado' }, notFound);
    req(`/retirada/meses/${ano}`).flush({ message: 'x' }, notFound);
    req('/retirada/periodo/').flush({ message: 'x' }, notFound);
    req('/retirada/ultimas').flush({ message: 'x' }, notFound);
    req('/estoque').flush([]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.dash-retirada').length).toBe(0);
    expect(text()).not.toContain('Documento inválido');
    expect(text()).toContain('Nenhuma retirada registrada.');
    expect(text()).toContain('Nenhum item em estoque.');
    expect(text()).toContain('Nenhuma retirada registrada neste ano.');
    expect(el.querySelector('app-line-charts')).toBeNull();
    expect(el.querySelectorAll('.ec-state--error').length).toBe(0);
    expect(kpis()).toEqual(['0', '0']);
  });

  it('mostra erro apenas no bloco que falhou (5xx)', () => {
    req('/assistido/total').flush({ total: 5 });
    req(`/retirada/meses/${ano}`).flush([]);
    req('/retirada/periodo/').flush([]);
    req('/retirada/ultimas').flush(retiradas);
    req('/estoque').flush({ message: 'erro' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('.dash-estoque')?.textContent).toContain('Não foi possível carregar o estoque');
    expect(el.querySelectorAll('.dash-retirada').length).toBe(2);
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('mostra erro geral com "Tentar novamente" quando todas falham e recarrega', () => {
    const falhar = (s: string) => req(s).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    falhar('/assistido/total');
    falhar(`/retirada/meses/${ano}`);
    falhar('/retirada/periodo/');
    falhar('/retirada/ultimas');
    falhar('/estoque');
    fixture.detectChanges();

    const alerta = el.querySelector('[role="alert"]');
    expect(alerta?.textContent).toContain('Não foi possível carregar');
    (alerta!.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')).not.toBeNull();

    req('/assistido/total').flush({ total: 1 });
    req(`/retirada/meses/${ano}`).flush([]);
    req('/retirada/periodo/').flush([]);
    req('/retirada/ultimas').flush([]);
    req('/estoque').flush([]);
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(kpis()[0]).toBe('1');
  });
});
