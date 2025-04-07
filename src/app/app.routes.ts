import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AssistidosComponent } from './pages/assistidos/assistidos.component';
import { RetiradasComponent } from './pages/retiradas/retiradas.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'assistidos', component: AssistidosComponent },
      { path: 'retiradas', component: RetiradasComponent },
      { path: 'estoque', component: EstoqueComponent },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'cadastro', component: LoginComponent },
      { path: 'recuperar-senha', component: LoginComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
