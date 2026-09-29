import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ItemNav {
  rota: string;
  rotulo: string;
  icone: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [NgFor, RouterLink, RouterLinkActive],
})
export class HeaderComponent {
  readonly itens: ItemNav[] = [
    { rota: '/dashboard', rotulo: 'Dashboard', icone: 'fa-table-columns' },
    { rota: '/assistidos', rotulo: 'Assistidos', icone: 'fa-handshake' },
    { rota: '/retiradas', rotulo: 'Retiradas', icone: 'fa-box-archive' },
    { rota: '/estoque', rotulo: 'Estoque', icone: 'fa-boxes-stacked' },
  ];
}
