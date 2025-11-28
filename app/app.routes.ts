import { inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../src/services/auth.service';
import { LoginComponent } from '../src/components/login/login.component';
import { AdminDashboardComponent } from '../src/components/admin-dashboard/admin-dashboard.component';
import { EmployeeDashboardComponent } from '../src/components/user-dashboard/user-dashboard.component';
import { CanteenManagerDashboardComponent } from '../src/components/canteen-manager-dashboard/canteen-manager-dashboard.component';
import { AddEmployeeComponent } from '../src/components/add-employee/add-employee.component';
import { SettingsComponent } from '../src/components/settings/settings.component';
import { ManageCouponsComponent } from '../src/components/manage-coupons/manage-coupons.component';
import { EmployeeManagementComponent } from '../src/components/employee-management/employee-management.component';
import { HistoryComponent } from '../src/components/history/history.component';
import { RedeemCouponComponent } from '../src/components/redeem-coupon/redeem-coupon.component';
import { ChangePasswordComponent } from '../src/components/change-password/change-password.component';
import { ManageContractorsComponent } from '../src/components/manage-contractors/manage-contractors.component';
import { ContractorDashboardComponent } from '../src/components/contractor-dashboard/contractor-dashboard.component';
import { EmployeeHistoryComponent } from '../src/components/employee-history/employee-history.component';
import { AnalyticsDashboardComponent } from '../src/components/analytics-dashboard/analytics-dashboard.component';
import { MenuManagementComponent } from '../src/components/menu-management/menu-management.component';

const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  // FIX: Explicitly type the injected Router to resolve type inference issue.
  const router: Router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }
  return router.parseUrl('/login');
};

const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    // FIX: Explicitly type the injected Router to resolve type inference issue.
    const router: Router = inject(Router);
    const user = authService.currentUser();
    if(user && 'role' in user && user.role === 'admin') {
        return true;
    }
    // if not admin, redirect to login
    return router.parseUrl('/login'); 
};

const superAdminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router: Router = inject(Router);
    const user = authService.currentUser();
    if(user && 'employeeId' in user && user.employeeId === 'admin01') {
        return true;
    }
    // if not super admin, redirect to admin dashboard
    return router.parseUrl('/admin'); 
};

const contractorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router: Router = inject(Router);
  const user = authService.currentUser();
  if (user && 'businessName' in user) { // Property unique to contractors
    return true;
  }
  return router.parseUrl('/login');
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/analytics', component: AnalyticsDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/employees', component: EmployeeManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/contractors', component: ManageContractorsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/manage-coupons', component: ManageCouponsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/history', component: HistoryComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/history/employee/:id', component: EmployeeHistoryComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/settings', component: SettingsComponent, canActivate: [authGuard, superAdminGuard] },
  { path: 'add-employee', component: AddEmployeeComponent, canActivate: [authGuard, adminGuard] },
  { path: 'employee', component: EmployeeDashboardComponent, canActivate: [authGuard] },
  { path: 'contractual-employee', redirectTo: '/employee', pathMatch: 'full'},
  { path: 'canteen-manager', component: CanteenManagerDashboardComponent, canActivate: [authGuard] },
  { path: 'canteen-manager/redeem', component: RedeemCouponComponent, canActivate: [authGuard] },
  { path: 'canteen-manager/menu', component: MenuManagementComponent, canActivate: [authGuard] },
  { path: 'contractor', component: ContractorDashboardComponent, canActivate: [authGuard, contractorGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];