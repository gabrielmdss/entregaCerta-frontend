import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  NgSelectComponent,
  NgSelectConfig,
} from '@ng-select/ng-select';
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
  @Input() notFoundText: string = 'Custom not found'
  @Input() items: any[] = [];
  @Input() bindLabel: string = '';
  @Input() bindValue: string = '';
  @Output() selectChange = new EventEmitter<any>();

  selectedValue: any = null

  constructor(private config: NgSelectConfig){
    this.config.notFoundText = this.notFoundText;
  }

  onSelectChange(value: any): void {
    this.selectChange.emit(value);
  }
}
