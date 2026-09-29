import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  imports: [
    NgSelectComponent,
    FormsModule,
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
})
export class SelectComponent {
  @Input() notFoundText: string = 'Nenhum resultado encontrado';
  @Input() items: any[] = [];
  @Input() bindLabel: string = '';
  @Input() bindValue: string = '';
  /** Opcional: rótulo acessível do campo (ligado ao <label> externo por id). */
  @Input() labelForId: string | null = null;
  /**
   * Opcional: onde anexar o painel do dropdown (ex.: "body" dentro de modais com overflow,
   * para o painel não ser cortado). Sem valor, mantém o comportamento anterior (inline).
   */
  @Input() appendTo: string | undefined = undefined;
  /**
   * Opcional: valor selecionado controlado pelo pai (pré-seleção e limpeza, ex. "Limpar filtros").
   * Usos que não passam [value] continuam com o estado interno de antes.
   */
  @Input() set value(v: any) {
    this.selectedValue = v ?? null;
  }
  @Output() selectChange = new EventEmitter<any>();

  selectedValue: any = null

  // notFoundText é repassado ao ng-select pelo template. Antes era copiado para o
  // NgSelectConfig global no construtor, quando o @Input ainda não tinha valor.

  onSelectChange(value: any): void {
    this.selectChange.emit(value);
  }
}
