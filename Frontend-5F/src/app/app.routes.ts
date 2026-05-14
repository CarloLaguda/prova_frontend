import { Routes } from '@angular/router';
import { Automobilista } from './automobilista/automobilista';
import { Perito } from './perito/perito';
import { Assicurazione } from './assicurazione/assicurazione';
import { Login } from './login/login';
import { RegistraClienteComponent } from './signup/signup';
import { NuovoSinistroComponent } from './nuovo-sinistro/nuovo-sinistro.component';
import { ListaVeicoli } from './lista-veicoli/lista-veicoli';
import { GestioneRimborsiInterventi } from './gestione-rimborsi-interventi/gestione-rimborsi-interventi';

export const routes: Routes = [
    {path: "automobilista", component: Automobilista},
    {path: "perito", component: Perito},
    {path: "assicurazione", component: Assicurazione},
    {path: "signin", component: Login},
    {path: "signup", component: RegistraClienteComponent},
    {path: "nuovo-sinistro", component: NuovoSinistroComponent},
    {path: "veicoli", component: ListaVeicoli},
    { path: 'gestione-rimborsi-interventi', component: GestioneRimborsiInterventi },
    {path: "", redirectTo: "signin", pathMatch: "full"}, 
    {path: "**", redirectTo: "signin"}
];