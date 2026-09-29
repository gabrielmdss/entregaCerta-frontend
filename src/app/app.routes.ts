import { Routes } from '@angular/router';

// Páginas carregadas sob demanda (loadComponent): mesmos paths/redirects de antes; o bundle
// inicial fica só com o shell, e cada tela vira um chunk próprio (prerender/SSR inalterados).
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'assistidos',
    loadComponent: () => import('./pages/assistidos/assistidos.component').then((m) => m.AssistidosComponent),
  },
  {
    path: 'retiradas',
    loadComponent: () => import('./pages/retiradas/retiradas.component').then((m) => m.RetiradasComponent),
  },
  {
    path: 'estoque',
    loadComponent: () => import('./pages/estoque/estoque.component').then((m) => m.EstoqueComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
