import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // ✅ Con sesiones: incluir credenciales (cookies) automáticamente
    // Obtener CSRF token de la cookie (Django lo pone en csrftoken)
    const csrfToken = this.getCsrfToken();
    
    // Clonar la solicitud con credenciales
    let clonedRequest = request.clone({
      withCredentials: true,  // Permitir envío de cookies de sesión
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
    
    // Si hay CSRF token y NO es una solicitud GET, incluirlo en el header X-CSRFToken
    if (csrfToken && request.method !== 'GET') {
      clonedRequest = clonedRequest.clone({
        setHeaders: {
          'X-CSRFToken': csrfToken
        }
      });
      console.log('🔐 CSRF token enviado en header X-CSRFToken para:', request.method, clonedRequest.url.split('/').pop());
    } else if (!csrfToken && request.method !== 'GET') {
      console.warn('⚠️ NO hay CSRF token en cookies para:', request.method, request.url.split('/').pop());
    }

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejo de errores de autenticación
        if (error.status === 401 || error.status === 403) {
          console.error('❌ Error 401/403 - Sesión inválida o sin permisos');
          console.error('   URL:', error.url);
          console.error('   Status:', error.status);
          console.error('   Detalle:', error.error?.detail || error.error?.error || error.message);
          console.error('   CSRF token en cookie:', !!csrfToken);
          
          // Limpiar sesión
          this.authService.logout();
          this.router.navigate(['/login']);
          
          // Mostrar alerta al usuario
          alert('⚠️ Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión de nuevo.');
        } else if (error.status === 0) {
          console.error('❌ Error de conexión - El servidor no está disponible');
          alert('🔌 No se puede conectar al servidor. Verifica que Django esté ejecutándose en http://localhost:8000');
        } else {
          console.error('❌ Error HTTP:', {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.detail || error.message
          });
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el CSRF token desde la cookie
   */
  private getCsrfToken(): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
}
