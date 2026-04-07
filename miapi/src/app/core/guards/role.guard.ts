import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(allowedRoles: string[]): boolean {
    const user = this.authService.getCurrentUser();

    if (user && user.rol && allowedRoles.includes(user.rol)) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
