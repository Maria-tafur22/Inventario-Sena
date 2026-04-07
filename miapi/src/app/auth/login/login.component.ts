import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  // Form data
  username: string = '';
  password: string = '';
  
  // UI state
  loading: boolean = false;
  error: string = '';
  success: string = '';
  showPassword: boolean = false;
  usernameError: string = '';
  passwordError: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, ir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Valida el username en tiempo real
   */
  validateUsername(): void {
    this.usernameError = '';
    if (!this.username || this.username.trim() === '') {
      this.usernameError = 'Usuario requerido';
      return;
    }
    if (this.username.trim().length < 3) {
      this.usernameError = 'Mínimo 3 caracteres';
      return;
    }
  }

  /**
   * Valida la contraseña en tiempo real
   */
  validatePassword(): void {
    this.passwordError = '';
    if (!this.password) {
      this.passwordError = 'Contraseña requerida';
      return;
    }
    if (this.password.length < 1) {
      this.passwordError = 'Ingresa tu contraseña';
      return;
    }
  }

  /**
   * Verifica si el formulario es válido
   */
  isFormValid(): boolean {
    const usernameValid = !!this.username && this.username.trim().length >= 3;
    const passwordValid = !!this.password && this.password.length > 0;
    return !!(usernameValid && passwordValid);
  }

  /**
   * Realiza la autenticación contra el backend
   */
  login(): void {
    // Limpiar mensajes previos
    this.error = '';
    this.success = '';
    this.validateUsername();
    this.validatePassword();

    // Validar que el formulario sea válido
    if (!this.isFormValid()) {
      if (!this.usernameError) this.usernameError = 'Usuario requerido';
      if (!this.passwordError) this.passwordError = 'Contraseña requerida';
      return;
    }

    // Iniciar proceso de login
    this.loading = true;

    // Obtener CSRF token - esperar a que se establezca la cookie
    this.authService.obtenerCsrfToken()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ CSRF token obtenido');
          
          // Pequeña pausa para asegurar que la cookie está establecida
          setTimeout(() => {
            // Ahora hacer login
            this.authService
              .login(this.username.trim(), this.password)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response: any) => {
                  this.success = '✅ Autenticación exitosa. Redirigiendo al dashboard...';
                  console.log('✅ Login exitoso:', response.username, 'rol:', response.rol);
                  
                  // Ir directamente al dashboard
                  setTimeout(() => {
                    this.loading = false;
                    this.router.navigate(['/dashboard']);
                  }, 300);
                },
                error: (err: any) => {
                  this.loading = false;
                  this.handleLoginError(err);
                }
              });
          }, 100);  // 100ms de pausa para establecer la cookie
        },
        error: (err) => {
          this.loading = false;
          this.error = '⚠️ Error de conexión. Verifica que Django esté corriendo en http://localhost:8000';
          console.error('❌ Error obteniendo CSRF token:', err);
        }
      });
  }


  /**
   * Maneja errores de autenticación
   */
  private handleLoginError(err: any): void {
    // Limpiar éxito si hay error
    this.success = '';

    // Mapear errores por código HTTP
    if (err.status === 0) {
      this.error = '🔌 Sin conexión al servidor. ¿Django está corriendo?';
    } else if (err.status === 400) {
      const detail = err.error?.detail || '';
      if (detail.toLowerCase().includes('username')) {
        this.error = '❌ Usuario no existe en el sistema';
      } else if (detail.toLowerCase().includes('password')) {
        this.error = '❌ Contraseña incorrecta';
      } else {
        this.error = detail || '❌ Datos inválidos';
      }
    } else if (err.status === 401) {
      this.error = '❌ Credenciales inválidas';
    } else if (err.status === 403) {
      this.error = '🚫 Acceso denegado';
    } else if (err.status === 404) {
      this.error = '❌ Usuario no encontrado';
    } else if (err.status === 429) {
      this.error = '⏱️ Demasiados intentos. Espera e intenta después';
    } else if (err.status >= 500) {
      this.error = '⚠️ Error en el servidor. Intenta más tarde';
    } else {
      this.error = `❌ Error: ${err.error?.detail || err.statusText || 'Desconocido'}`;
    }
  }

  /**
   * Alterna visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Maneja Enter en los inputs
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.loading && this.isFormValid()) {
      event.preventDefault();
      this.login();
    }
  }

  /**
   * Limpia el formulario
   */
  resetForm(): void {
    this.username = '';
    this.password = '';
    this.error = '';
    this.success = '';
    this.usernameError = '';
    this.passwordError = '';
    this.showPassword = false;
  }
}

