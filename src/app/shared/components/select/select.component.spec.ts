import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';

@Component({
  imports: [SelectComponent],
  template: `
    <app-select id="controlado" [items]="items" bindLabel="nome" bindValue="id" [value]="valor"
      (selectChange)="emitido = $event"></app-select>
    <app-select id="livre" [items]="items" bindLabel="nome" bindValue="id"></app-select>
  `,
})
class HostComponent {
  items = [
    { id: 1, nome: 'Maria Silva' },
    { id: 2, nome: 'Joao Souza' },
  ];
  valor: number | null = null;
  emitido: any = 'nada';
}

describe('SelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let el: HTMLElement;

  const exibido = (id: string) => el.querySelector(`#${id} .ng-value`)?.textContent?.trim() ?? null;
  const estabilizar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostComponent);
    el = fixture.nativeElement;
    await estabilizar();
  });

  it('sem [value] mantém o comportamento anterior (nada selecionado)', () => {
    expect(exibido('livre')).toBeNull();
    expect(exibido('controlado')).toBeNull();
  });

  it('[value] pré-seleciona e, ao voltar para null, limpa o valor exibido', async () => {
    fixture.componentInstance.valor = 2;
    await estabilizar();
    expect(exibido('controlado')).toContain('Joao Souza');

    fixture.componentInstance.valor = null;
    await estabilizar();
    expect(exibido('controlado')).toBeNull();
    expect(fixture.componentInstance.emitido).toBe('nada'); // limpar pelo pai não emite selectChange
  });

  it('emite selectChange com o bindValue ao escolher uma opção', async () => {
    const select = fixture.debugElement.children[0].componentInstance as SelectComponent;
    select.selectedValue = 1;
    select.onSelectChange(select.selectedValue);
    expect(fixture.componentInstance.emitido).toBe(1);
  });
});
