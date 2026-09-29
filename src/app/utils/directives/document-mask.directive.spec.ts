import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DocumentMaskDirective } from './document-mask.directive';
import { DocumentPipe } from '../pipes/document.pipe';

@Component({
  imports: [FormsModule, DocumentMaskDirective],
  template: `<input appDocumentMask [(ngModel)]="valor" />`,
})
class HostComponent {
  valor = '';
}

describe('DocumentMaskDirective / DocumentPipe', () => {
  const digitar = async (texto: string) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return { input, modelo: fixture.componentInstance.valor };
  };

  it('mascara 11 dígitos como CPF', async () => {
    const { input, modelo } = await digitar('12345678901');
    // O ngModel recebe o valor do evento ANTES da máscara (DefaultValueAccessor roda antes).
    expect(modelo).toBe('12345678901');
    expect(input.value).toBe('123.456.789-01');
  });

  it('mascara 10 dígitos sem o ponto extra (antes: "12.345.678.-90")', async () => {
    const { input } = await digitar('1234567890');
    expect(input.value).toBe('12.345.678-90');
  });

  it('registra o valor que o ngModel recebe ao digitar (documenta o formato enviado)', async () => {
    const { modelo } = await digitar('123.456.789-01');
    // O valor do modelo é o que o DefaultValueAccessor lê do evento; a máscara não o normaliza.
    expect(typeof modelo).toBe('string');
    expect(modelo.replace(/\D/g, '')).toBe('12345678901');
  });

  const casos: [string, string][] = [
    ['1234567', '123.456-7'],
    ['12345678', '1.234.567-8'],
    ['123456789', '12.345.678-9'],
    ['1234567890', '12.345.678-90'],
    ['12345678901', '123.456.789-01'],
  ];

  for (const [digitos, esperado] of casos) {
    it(`máscara: ${digitos.length} dígitos -> ${esperado}`, async () => {
      const { input } = await digitar(digitos);
      expect(input.value).toBe(esperado);
    });
  }

  it('máscara: <7 e >11 dígitos ficam só com os dígitos', async () => {
    expect((await digitar('12.345-6')).input.value).toBe('123456');
    expect((await digitar('123456789012')).input.value).toBe('123456789012');
  });

  it('pipe: 7 a 11 dígitos válidos; fora disso "Documento inválido"', () => {
    const pipe = new DocumentPipe();
    for (const [digitos, esperado] of casos) {
      expect(pipe.transform(digitos)).toBe(esperado);
    }
    expect(pipe.transform('123.456.789-01')).toBe('123.456.789-01');
    expect(pipe.transform('123456')).toBe('Documento inválido');
    expect(pipe.transform('123456789012')).toBe('Documento inválido');
    expect(pipe.transform('')).toBe('Documento inválido');
  });
});
