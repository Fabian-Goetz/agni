import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
  { path: 'select', loadComponent: () => import('./features/select/select').then((m) => m.Select) },
  { path: 'play', loadComponent: () => import('./features/play/play').then((m) => m.Play) },
  { path: 'editor', loadComponent: () => import('./features/editor/editor').then((m) => m.Editor) },
  { path: '**', redirectTo: 'home' },
];
