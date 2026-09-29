import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogDirective } from './dialog.directive';

@Component({
  imports: [DialogDirective],
  template: `
    <button id="abrir" (click)="aberto = true">Abrir</button>
    @if (aberto) {
      <div role="dialog" ecDialog (ecDialogClose)="fechados = fechados + 1; aberto = false">
        <button id="a">A</button>
        <input id="b" />
        <button id="c" disabled>C</button>
      </div>
    }
  `,
})
class HostComponent {
  aberto = false;
  fechados = 0;
}

describe('DialogDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let el: HTMLElement;
  const tecla = (alvo: Element, key: string, shiftKey = false) => {
    const ev = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
    alvo.dispatchEvent(ev);
    return ev;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    const abrir = el.querySelector<HTMLButtonElement>('#abrir')!;
    abrir.focus();
    abrir.click();
    fixture.detectChanges();
  });

  afterEach(() => el.remove());

  it('foca o primeiro controle ao abrir', () => {
    expect(document.activeElement?.id).toBe('a');
  });

  it('Esc emite fechar e o foco volta ao elemento que abriu', () => {
    tecla(document.activeElement!, 'Escape');
    fixture.detectChanges();
    expect(fixture.componentInstance.fechados).toBe(1);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement?.id).toBe('abrir');
  });

  it('prende o Tab dentro do modal (ignora desabilitados)', () => {
    el.querySelector<HTMLInputElement>('#b')!.focus();
    const ev = tecla(document.activeElement!, 'Tab');
    expect(ev.defaultPrevented).toBeTrue();
    expect(document.activeElement?.id).toBe('a');
    const ev2 = tecla(document.activeElement!, 'Tab', true);
    expect(ev2.defaultPrevented).toBeTrue();
    expect(document.activeElement?.id).toBe('b');
  });
});
