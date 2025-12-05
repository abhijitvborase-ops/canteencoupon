import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Coupon } from '../../models/coupon.model';
import { RouterLink } from '@angular/router';

type AlertType = 'none' | 'redeemed' | 'not_available' | 'already_redeemed';

@Component({
  selector: 'app-canteen-manager-dashboard',
  templateUrl: './canteen-manager-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
})
export class CanteenManagerDashboardComponent {
  private dataService = inject(DataService);

  // ========= Existing state =========
  selectedDate = signal(new Date().toISOString().split('T')[0]);

  couponTypes: Coupon['couponType'][] = [
    'Breakfast',
    'Lunch/Dinner',
    'Snacks',
    'Beverage',
  ];

  employeesMap = computed(() => {
    const map = new Map<number, string>();
    for (const emp of this.dataService.employees()) {
      map.set(emp.id, emp.name);
    }
    return map;
  });

  private allRedeemedCoupons = computed(() => {
    return this.dataService
      .coupons()
      .filter((c) => c.status === 'redeemed' && c.redeemDate);
  });

  todaysMenu = computed(() => {
    const today = new Date();
    const todayId = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today
      .getDate()
      .toString()
      .padStart(2, '0')}`;
    return this.dataService.getMenuForDate(todayId);
  });

  todayRedeemedBreakfast = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.allRedeemedCoupons().filter(
      (c) => c.couponType === 'Breakfast' && c.redeemDate!.startsWith(todayStr)
    ).length;
  });

  todayRedeemedLunchDinner = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.allRedeemedCoupons().filter(
      (c) =>
        c.couponType === 'Lunch/Dinner' &&
        c.redeemDate!.startsWith(todayStr)
    ).length;
  });

  monthlyRedeemedBreakfast = computed(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return this.allRedeemedCoupons().filter((c) => {
      if (c.couponType === 'Breakfast') {
        const redeemDate = new Date(c.redeemDate!);
        return (
          redeemDate.getFullYear() === currentYear &&
          redeemDate.getMonth() === currentMonth
        );
      }
      return false;
    }).length;
  });

  monthlyRedeemedLunchDinner = computed(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return this.allRedeemedCoupons().filter((c) => {
      if (c.couponType === 'Lunch/Dinner') {
        const redeemDate = new Date(c.redeemDate!);
        return (
          redeemDate.getFullYear() === currentYear &&
          redeemDate.getMonth() === currentMonth
        );
      }
      return false;
    }).length;
  });

  redeemedCouponsForDay = computed(() => {
    const selected = this.selectedDate();
    return this.allRedeemedCoupons().filter((c) =>
      c.redeemDate?.startsWith(selected)
    );
  });

  groupedCoupons = computed(() => {
    const groups: { [key in Coupon['couponType']]?: Coupon[] } = {};
    for (const coupon of this.redeemedCouponsForDay()) {
      if (!groups[coupon.couponType]) {
        groups[coupon.couponType] = [];
      }
      groups[coupon.couponType]!.push(coupon);
    }
    return groups;
  });

  onDateChange(event: Event) {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  formatTime(isoString: string | null): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // ========= NEW: Alert + Sounds for Canteen Manager =========

  // UI state (signals so template मध्ये वापरता येईल)
  alertVisible = signal(false);
  alertType = signal<AlertType>('none');
  alertMessage = signal('');
  alertEmployeeName = signal('');

  // 3 वेगवेगळे sounds
  private audioRedeemed = new Audio('assets/sounds/redeemed.mp3');
  private audioNotAvailable = new Audio('assets/sounds/not-available.mp3');
  private audioAlreadyRedeemed = new Audio(
    'assets/sounds/already-redeemed.mp3'
  );

  // Helper: employeeId वरून नाव
  getEmployeeName(employeeId: number | null | undefined): string {
    if (!employeeId) return '';
    return this.employeesMap().get(employeeId) ?? `Emp #${employeeId}`;
  }

  // बाहेरून (device / redeem screen) ह्या methods call करू शकतोस:

  /** Coupon successfully redeemed झाल्यावर call कर */
  showRedeemedAlert(employeeId: number | null | undefined, message?: string) {
    const name = this.getEmployeeName(employeeId);
    const finalMsg =
      message ?? (name ? `Coupon redeemed for ${name}` : 'Coupon redeemed');

    this.showAlert('redeemed', finalMsg, name);
  }

  /** Coupon नाही / No active coupon / not available */
  showNotAvailableAlert(
    employeeId: number | null | undefined,
    message?: string
  ) {
    const name = this.getEmployeeName(employeeId);
    const finalMsg =
      message ??
      (name
        ? `⚠ ${name} कडे या slot साठी कोणताही active coupon नाही`
        : '⚠ No active coupon available for this employee');

    this.showAlert('not_available', finalMsg, name);
  }

  /** Coupon already redeemed झाला असेल तर */
  showAlreadyRedeemedAlert(
    employeeId: number | null | undefined,
    message?: string
  ) {
    const name = this.getEmployeeName(employeeId);
    const finalMsg =
      message ??
      (name
        ? `♻ ${name} ने आज या slot साठी coupon आधीच वापरला आहे`
        : '♻ Coupon already redeemed for this slot today');

    this.showAlert('already_redeemed', finalMsg, name);
  }

  // Main internal alert handler
  private showAlert(type: AlertType, msg: string, empName?: string) {
    this.alertType.set(type);
    this.alertMessage.set(msg);
    this.alertEmployeeName.set(empName ?? '');
    this.alertVisible.set(true);

    // आधीचे sounds stop
    this.stopAllSounds();

    // play निवडलेला sound
    try {
      if (type === 'redeemed') {
        this.audioRedeemed.currentTime = 0;
        this.audioRedeemed.play();
      } else if (type === 'not_available') {
        this.audioNotAvailable.currentTime = 0;
        this.audioNotAvailable.play();
      } else if (type === 'already_redeemed') {
        this.audioAlreadyRedeemed.currentTime = 0;
        this.audioAlreadyRedeemed.play();
      }
    } catch {
      // काही browsers auto-play block करतात; इथे crash होऊ देऊ नको
    }

    // Optional: auto-hide 8 सेकंदांनी
    setTimeout(() => {
      this.alertVisible.set(false);
      this.alertType.set('none');
    }, 8000);
  }

  hideAlert() {
    this.alertVisible.set(false);
    this.alertType.set('none');
    this.stopAllSounds();
  }

  private stopAllSounds() {
    this.audioRedeemed.pause();
    this.audioNotAvailable.pause();
    this.audioAlreadyRedeemed.pause();
  }
}
