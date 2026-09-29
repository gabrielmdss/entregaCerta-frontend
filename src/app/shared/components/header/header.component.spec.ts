import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';

@Component({ template: '' })
class VazioComponent {}

describe('HeaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: VazioComponent },
          { path: 'assistidos', component: VazioComponent },
          { path: 'retiradas', component: VazioComponent },
          { path: 'estoque', component: VazioComponent },
        ]),
      ],
    });
  });

  it('exibe os 4 links de navegação no header e na tab bar', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const desktop = Array.from(el.querySelectorAll<HTMLAnchorElement>('.desktop-header nav a'));
    const mobile = Array.from(el.querySelectorAll<HTMLAnchorElement>('.mobile-tab-nav a'));
    const esperado = ['/dashboard', '/assistidos', '/retiradas', '/estoque'];
    expect(desktop.map((a) => a.getAttribute('href'))).toEqual(esperado);
    expect(mobile.map((a) => a.getAttribute('href'))).toEqual(esperado);
    expect(desktop.map((a) => a.textContent?.trim())).toEqual(['Dashboard', 'Assistidos', 'Retiradas', 'Estoque']);
  });

  it('marca a rota ativa com classe "active" e aria-current="page"', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/retiradas');
    await fixture.whenStable();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const ativos = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.active'));
    expect(ativos.length).toBe(2); // header desktop + tab bar
    ativos.forEach((a) => {
      expect(a.getAttribute('href')).toBe('/retiradas');
      expect(a.getAttribute('aria-current')).toBe('page');
    });
    const inativo = el.querySelector<HTMLAnchorElement>('.desktop-header a.nav-link[href="/dashboard"]');
    expect(inativo?.classList.contains('active')).toBeFalse();
    expect(inativo?.hasAttribute('aria-current')).toBeFalse();
  });
});
