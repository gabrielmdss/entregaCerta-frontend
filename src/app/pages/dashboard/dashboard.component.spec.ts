import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { CHAVE_ORDEM, DashboardComponent, ORDEM_PADRAO } from './dashboard.component';
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

  /** Por padrão simula prefers-reduced-motion (KPIs com valor final imediato). */
  let reduzirMovimento = true;
  const criar = () => {
    fixture = TestBed.createComponent(DashboardComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };
  const flushTudo = (estoqueResp: object[] = estoque) => {
    req('/assistido/total').flush({ total: 1234 });
    req(`/retirada/meses/${ano}`).flush([{ mes: 'September de 2026', total: 2 }]);
    req('/retirada/periodo/').flush(retiradas);
    req('/retirada/ultimas').flush(retiradas);
    req('/estoque').flush(estoqueResp);
    fixture.detectChanges();
  };
  const ordemDom = () => Array.from(el.querySelectorAll<HTMLElement>('[data-bloco]')).map((b) => b.dataset['bloco']);

  beforeEach(() => {
    reduzirMovimento = true;
    try { localStorage.removeItem(CHAVE_ORDEM); } catch { /* ignore */ }
    const original = window.matchMedia.bind(window);
    spyOn(window, 'matchMedia').and.callFake((q: string) =>
      q.includes('prefers-reduced-motion') ? ({ matches: reduzirMovimento, media: q } as MediaQueryList) : original(q),
    );
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    http = TestBed.inject(HttpTestingController);
    criar();
  });

  afterEach(() => {
    http.verify();
    try { localStorage.removeItem(CHAVE_ORDEM); } catch { /* ignore */ }
  });

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

  describe('interações', () => {
    it('renderiza os blocos na ordem padrão, cada um com alça focável', () => {
      flushTudo();
      expect(ordemDom()).toEqual([...ORDEM_PADRAO]);
      const alcas = el.querySelectorAll<HTMLButtonElement>('button.dash-alca');
      expect(alcas.length).toBe(4);
      expect(alcas[0].getAttribute('aria-label')).toContain('Indicadores, posição 1 de 4');
      expect(alcas[0].getAttribute('aria-describedby')).toBe('dash-dnd-ajuda');
    });

    it('reordena pelo teclado (setas/Home), anuncia e persiste no localStorage', () => {
      flushTudo();
      const alca = (b: string) => el.querySelector<HTMLButtonElement>(`[data-alca="${b}"]`)!;
      alca('indicadores').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(ordemDom()).toEqual(['estoque', 'indicadores', 'grafico', 'ultimas']);
      expect(JSON.parse(localStorage.getItem(CHAVE_ORDEM)!)).toEqual(['estoque', 'indicadores', 'grafico', 'ultimas']);
      expect(el.textContent).toContain('Indicadores movido para a posição 2 de 4.');

      alca('ultimas').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();
      expect(ordemDom()).toEqual(['ultimas', 'estoque', 'indicadores', 'grafico']);

      // Limite: mover o primeiro para cima não muda nada.
      expect(fixture.componentInstance.moverBloco('ultimas', -1)).toBeFalse();
    });

    it('reordena pela soltura do drag & drop (CDK) e persiste', () => {
      flushTudo();
      fixture.componentInstance.soltar({ previousIndex: 2, currentIndex: 0 } as any);
      fixture.detectChanges();
      expect(ordemDom()).toEqual(['grafico', 'indicadores', 'estoque', 'ultimas']);
      expect(JSON.parse(localStorage.getItem(CHAVE_ORDEM)!)).toEqual(['grafico', 'indicadores', 'estoque', 'ultimas']);
    });

    it('restaura a ordem salva e permite voltar à ordem padrão', () => {
      localStorage.setItem(CHAVE_ORDEM, JSON.stringify(['ultimas', 'grafico', 'estoque', 'indicadores']));
      fixture.componentInstance.restaurarOrdem();
      flushTudo();
      expect(ordemDom()).toEqual(['ultimas', 'grafico', 'estoque', 'indicadores']);

      const restaurar = el.querySelector<HTMLButtonElement>('.dash-restaurar')!;
      expect(restaurar.textContent).toContain('Restaurar ordem padrão');
      restaurar.click();
      fixture.detectChanges();
      expect(ordemDom()).toEqual([...ORDEM_PADRAO]);
      expect(el.querySelector('.dash-restaurar')).toBeNull();
      expect(JSON.parse(localStorage.getItem(CHAVE_ORDEM)!)).toEqual([...ORDEM_PADRAO]);
    });

    it('ignora ordem salva inválida (JSON quebrado, blocos faltando ou desconhecidos)', () => {
      for (const bruto of ['{quebrado', '["estoque"]', '["a","b","c","d"]']) {
        localStorage.setItem(CHAVE_ORDEM, bruto);
        fixture.componentInstance.restaurarOrdem();
        expect(fixture.componentInstance.ordem).toEqual([...ORDEM_PADRAO]);
      }
      flushTudo();
    });

    it('não quebra quando o localStorage está indisponível', () => {
      spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');
      spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
      expect(() => fixture.componentInstance.restaurarOrdem()).not.toThrow();
      flushTudo();
      expect(() => fixture.componentInstance.moverBloco('grafico', 1)).not.toThrow();
      fixture.detectChanges();
      expect(ordemDom()).toEqual(['indicadores', 'estoque', 'ultimas', 'grafico']);
    });

    it('barra de nível proporcional à maior quantidade; quantidade 0 em destaque de perigo', () => {
      flushTudo([
        { id: 1, quantidade: 50, descricao: 'Cesta', data_atualizacao: '2026-09-01T00:00:00.000Z' },
        { id: 2, quantidade: 25, descricao: 'Arroz', data_atualizacao: '2026-09-01T00:00:00.000Z' },
        { id: 3, quantidade: 0, descricao: 'Feijão', data_atualizacao: '2026-09-01T00:00:00.000Z' },
      ]);
      const barras = Array.from(el.querySelectorAll<HTMLElement>('.dash-nivel-barra')).map((b) => b.style.width);
      expect(barras).toEqual(['100%', '50%', '0%']);
      const itens = el.querySelectorAll('.dash-estoque-item');
      expect(itens[2].classList).toContain('dash-estoque-item--zerado');
      expect(itens[2].textContent).toContain('(sem estoque)');
      expect(itens[0].classList).not.toContain('dash-estoque-item--zerado');
    });

    it('count-up: com movimento anima de 0 até o valor final', async () => {
      flushTudo(); // responde as requisições da instância criada no beforeEach
      reduzirMovimento = false;
      fixture.destroy();
      criar();
      flushTudo();
      expect(Number((kpis()[0] ?? '').replace(/\./g, ''))).toBeLessThan(1234);
      await new Promise((r) => setTimeout(r, 900));
      fixture.detectChanges();
      expect(kpis()).toEqual(['1.234', '2']);
    });

    it('count-up: com prefers-reduced-motion exibe o valor final imediatamente', () => {
      flushTudo();
      expect(kpis()).toEqual(['1.234', '2']);
    });
  });
});
