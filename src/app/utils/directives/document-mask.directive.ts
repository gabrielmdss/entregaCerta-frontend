import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';

@Directive({
  selector: '[appDocumentMask]',
  standalone: true

})
export class DocumentMaskDirective {

  
  private maskCpfRg(value: string): string {
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } 
    else if (value.length === 10) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3.-$4');
    }
    return value;
  }
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    let inputValue = event.target.value.replace(/\D/g, ''); 
    inputValue = this.maskCpfRg(inputValue); 
    this.el.nativeElement.value = inputValue;
  }
}
