import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { DataService } from '../../services/data.service';
import { RouterLink } from '@angular/router';

// Declare Html5Qrcode global
declare var Html5Qrcode: any;

type AlertType = 'redeemed' | 'not_available' | 'already_redeemed';

@Component({
  selector: 'app-redeem-coupon',
  standalone: true,
  templateUrl: './redeem-coupon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
})
export class RedeemCouponComponent implements OnDestroy {
  private dataService = inject(DataService);
  private html5QrCode: any;

  // जुना छोटा status message (toast सारखा)
  redeemStatusMessage = signal<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // QR scanner state
  isScannerVisible = signal(false);
  scannerErrorMessage = signal<string | null>(null);

  // 🔔 मोठा लाल/हिरवा alert banner (3 sounds सह)
  alertVisible = signal(false);
  alertType = signal<AlertType | null>(null);
  alertMessage = signal('');

  // 3 वेगवेगळे sounds
  private audioRedeemed = new Audio('assets/sounds/redeemed.mp3');
  private audioNotAvailable = new Audio('assets/sounds/not-available.mp3');
  private audioAlreadyRedeemed = new Audio('assets/sounds/already-redeemed.mp3');

  redeemCouponForm = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(4),
      Validators.pattern('^[0-9]*$'),
    ]),
  });

  ngOnDestroy() {
    this.stopScanner();
    this.stopAllSounds();
  }

  showScanner() {
    this.isScannerVisible.set(true);
    this.scannerErrorMessage.set(null);
    // Use timeout to ensure the DOM element for the scanner is rendered
    setTimeout(() => this.startScanner(), 100);
  }

  hideScanner() {
    this.stopScanner();
    this.isScannerVisible.set(false);
  }

  private startScanner() {
    const readerElementId = 'qr-reader-redeem';
    if (!document.getElementById(readerElementId)) {
      this.scannerErrorMessage.set(
        'QR Reader element could not be initialized. Please refresh.'
      );
      console.error('QR Reader element not found in DOM.');
      return;
    }

    this.html5QrCode = new Html5Qrcode(readerElementId);
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const onScanSuccess = (decodedText: string) => {
      this.redeemCouponForm.patchValue({ code: decodedText });
      this.handleRedeemCoupon();
      this.hideScanner(); // Stop scanner on success
    };

    const onScanFailure = (_error: string) => {
      // ignore scan failures
    };

    this.html5QrCode
      .start({ facingMode: 'environment' }, config, onScanSuccess, onScanFailure)
      .catch((err: any) => {
        console.error('Unable to start QR scanner', err);
        this.scannerErrorMessage.set(
          'Could not start scanner. Please check camera permissions.'
        );
      });
  }

  private stopScanner() {
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      this.html5QrCode
        .stop()
        .catch((err: any) => console.error('Error stopping the scanner.', err));
    }
  }

  // 👉 async – Firestore मधून result येईपर्यंत थांबतो
  async handleRedeemCoupon() {
    if (!this.redeemCouponForm.valid) return;

    const code = this.redeemCouponForm.value.code!;
    this.redeemStatusMessage.set(null);

    try {
      const result = await this.dataService.redeemCouponByCode(code);

      // existing छोटा message
      this.redeemStatusMessage.set({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });

      // 🔍 message वरून 3 प्रकार ओळखणे
      let type: AlertType;

      if (result.success) {
        type = 'redeemed';
      } else if (
        result.message.toLowerCase().includes('already been redeemed') ||
        result.message.toLowerCase().includes('already redeemed')
      ) {
        type = 'already_redeemed';
      } else {
        // Invalid / No active coupon / coupon not found इ.
        type = 'not_available';
      }

      this.showAlert(type, result.message);
    } catch (err) {
      console.error('Error in redeemCouponByCode:', err);
      this.redeemStatusMessage.set({
        type: 'error',
        text: 'Something went wrong while redeeming the coupon.',
      });

      this.showAlert('not_available', 'Something went wrong while redeeming.');
    }

    this.redeemCouponForm.reset();
    setTimeout(() => this.redeemStatusMessage.set(null), 7000);
  }

  // ========== ALERT + SOUND HELPERS ==========

  private showAlert(type: AlertType, message: string) {
    this.alertType.set(type);
    this.alertMessage.set(message);
    this.alertVisible.set(true);

    this.stopAllSounds();

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
      // काही browsers auto-play block करतात; crash होऊ देऊ नको
    }

    // 8 सेकंदांनी auto-hide
    setTimeout(() => {
      this.alertVisible.set(false);
      this.alertType.set(null);
    }, 8000);
  }

  hideAlertManually() {
    this.alertVisible.set(false);
    this.alertType.set(null);
    this.stopAllSounds();
  }

  private stopAllSounds() {
    this.audioRedeemed.pause();
    this.audioNotAvailable.pause();
    this.audioAlreadyRedeemed.pause();
  }
}
