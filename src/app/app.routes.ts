import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  { path: 'login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  { path: 'signup', loadComponent: () => import('./features/auth/signup').then((m) => m.Signup) },
  {
    path: 'select',
    canActivate: [authGuard],
    loadComponent: () => import('./features/select/select').then((m) => m.Select),
  },
  {
    path: 'play',
    canActivate: [authGuard],
    loadComponent: () => import('./features/play/play').then((m) => m.Play),
  },
  {
    path: 'editor',
    canActivate: [authGuard],
    loadComponent: () => import('./features/editor/editor').then((m) => m.Editor),
  },
  { path: '**', redirectTo: 'home' },
];
