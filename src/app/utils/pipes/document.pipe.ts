import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formata um documento (CPF ou RG) a partir dos seus dígitos.
 * - 11 dígitos: padrão CPF `xxx.xxx.xxx-xx` (um RG de 11 dígitos é indistinguível
 *   de um CPF, pois não há campo de tipo de documento no contrato).
 * - 10 dígitos: RG `xx.xxx.xxx-xx`.
 * - 7 a 9 dígitos: RG com o último dígito como verificador (`123.456-7`,
 *   `1.234.567-8`, `12.345.678-9`).
 * Fora de 7–11 dígitos retorna `null`.
 */
export function formatDocumento(digitos: string): string | null {
  const n = digitos.length;
  if (n === 11) return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (n >= 7 && n <= 10) {
    const dv = n === 10 ? 2 : 1;
    const corpo = digitos.slice(0, n - dv).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${corpo}-${digitos.slice(n - dv)}`;
  }
  return null;
}

@Pipe({
  name: 'documentTranslate',
  standalone: true
})
export class DocumentPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return 'Documento inválido';
    return formatDocumento(value.replace(/\D/g, '')) ?? 'Documento inválido';
  }
}
