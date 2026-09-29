import { Directive, ElementRef, HostListener } from '@angular/core';
import { formatDocumento } from '../pipes/document.pipe';

/** Máscara visual de CPF/RG (7 a 11 dígitos); fora dessa faixa exibe só os dígitos. */
@Directive({
  selector: '[appDocumentMask]',
  standalone: true
})
export class DocumentMaskDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const digitos = event.target.value.replace(/\D/g, '');
    this.el.nativeElement.value = formatDocumento(digitos) ?? digitos;
  }
}
