import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Inserisci email e password.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          const role = String(res.user.ruolo ?? '').toLowerCase();
          const routeMap: Record<string, string> = {
            automobilista: '/automobilista',
            perito: '/perito',
            assicuratore: '/assicurazione',
            assicurazione: '/assicurazione',
          };
          const route = routeMap[role] ?? '/';
          this.router.navigate([route]);
          console.log(res.user)
        } else {
          this.loading = false;
          this.errorMessage = 'Credenziali non valide. Riprova.';
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Credenziali non valide. Riprova.';
        this.cdr.detectChanges();
      }
    });
  }
}