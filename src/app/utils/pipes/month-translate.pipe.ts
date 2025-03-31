import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monthTranslate',
  standalone: true,
})
export class MonthTranslatePipe implements PipeTransform {
  private meses: { [key: string]: string } = {
    January: 'Janeiro',
    February: 'Fevereiro',
    March: 'Março',
    April: 'Abril',
    May: 'Maio',
    June: 'Junho',
    July: 'Julho',
    August: 'Agosto',
    September: 'Setembro',
    October: 'Outubro',
    November: 'Novembro',
    December: 'Dezembro',
  };

  transform(value: string): string {
    if (!value) return 'Mês inválido';

    const [month] = value.split(' de ').map((str) => str.trim());

    if (!month) return 'Formato inválido';

    const mesTraduzido = this.meses[month] || month;

    return mesTraduzido.charAt(0).toUpperCase() + mesTraduzido.slice(1).toLowerCase();
  }
}
