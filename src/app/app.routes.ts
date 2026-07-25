import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'games',
    canActivate: [authGuard],
    loadComponent: () => import('./features/games/games').then((m) => m.Games),
  },
  {
    path: 'geraetehaus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/geraetehaus/geraetehaus').then((m) => m.Geraetehaus),
  },
  {
    path: 'geraetehaus/katalog',
    canActivate: [authGuard],
    loadComponent: () => import('./features/katalog/katalog').then((m) => m.Katalog),
  },
  {
    path: 'geraetehaus/fahrzeugkatalog',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/fahrzeugkatalog/fahrzeugkatalog').then((m) => m.Fahrzeugkatalog),
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
    path: 'activity',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/activity/activity-setup').then((m) => m.ActivitySetup),
  },
  {
    path: 'activity/play',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/activity/activity-play').then((m) => m.ActivityPlay),
  },
  {
    path: 'editor',
    canActivate: [authGuard],
    loadComponent: () => import('./features/editor/editor').then((m) => m.Editor),
  },
  { path: '**', redirectTo: 'home' },
];
