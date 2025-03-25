import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AssistidosComponent } from './pages/assistidos/assistidos.component';
import { RetiradasComponent } from './pages/retiradas/retiradas.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'assistidos', component: AssistidosComponent },
  { path: 'retiradas', component: RetiradasComponent },
  { path: '**', redirectTo: 'dashboard' },
];
