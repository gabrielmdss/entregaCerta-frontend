import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'documentTranslate',
  standalone: true
})
export class DocumentPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return 'Documento inválido';

    const cleanedValue = value.replace(/\D/g, '');

    if (cleanedValue.length === 11) {
      return this.formatCpf(cleanedValue);
    } else if (cleanedValue.length >= 7 && cleanedValue.length <= 9) {
      return this.formatRg(cleanedValue);
    }

    return 'Documento inválido';
  }

  private formatCpf(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private formatRg(rg: string): string {
    return rg.replace(/^(\d{2})(\d{3})(\d{3})([0-9Xx]?)$/, '$1.$2.$3-$4');
  }
}
