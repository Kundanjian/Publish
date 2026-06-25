import { Injectable, signal } from '@angular/core';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private initialized = false;

  readonly canInstall = signal(false);
  readonly isInstalled = signal(false);

  init(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }
    this.initialized = true;

    this.isInstalled.set(this.computeInstalledState());

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (this.isInstalled()) {
      return 'unavailable';
    }

    const promptEvent = this.deferredPrompt;
    if (!promptEvent) {
      return 'unavailable';
    }

    await promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);

    if (choiceResult.outcome === 'accepted') {
      this.isInstalled.set(true);
      return 'accepted';
    }

    return 'dismissed';
  }

  private computeInstalledState(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }
}
