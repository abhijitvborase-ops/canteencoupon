import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../src/services/auth.service';
import { HeaderComponent } from '../src/components/shared/header/header.component';
import { SidebarComponent } from '../src/components/shared/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    HeaderComponent,
    RouterOutlet,
    SidebarComponent
  ]
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;

  readonly isAdmin = computed(() => {
    const user = this.currentUser();
    return !!user && (user as any).role === 'admin';
  });

  logout(): void {
    this.authService.logout();
  }
}
