import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  OnDestroy,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamento de teclado para modais (`role="dialog"`):
 * - Esc emite `ecDialogClose` (o pai decide como fechar);
 * - foco inicial no primeiro controle do modal e retorno ao elemento que abriu ao fechar;
 * - Tab/Shift+Tab ficam presos dentro do modal.
 * Sem efeito no servidor (SSR).
 */
@Directive({
  selector: '[ecDialog]',
  standalone: true,
})
export class DialogDirective implements AfterViewInit, OnDestroy {
  @Output() ecDialogClose = new EventEmitter<void>();

  private anterior: HTMLElement | null = null;
  private readonly browser: boolean;

  constructor(private el: ElementRef<HTMLElement>, @Inject(PLATFORM_ID) platformId: object) {
    this.browser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    this.anterior = document.activeElement as HTMLElement | null;
    const alvo = this.focaveis()[0] ?? this.el.nativeElement;
    if (alvo === this.el.nativeElement && !alvo.hasAttribute('tabindex')) {
      alvo.setAttribute('tabindex', '-1');
    }
    alvo.focus();
  }

  ngOnDestroy(): void {
    if (this.browser && this.anterior && document.contains(this.anterior)) {
      this.anterior.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Esc com o painel do ng-select aberto fecha só o painel (a classe ainda está
      // presente neste momento; ela sai na próxima detecção de mudanças).
      const alvo = event.target as HTMLElement | null;
      if (alvo?.closest?.('.ng-select-opened')) return;
      event.stopPropagation();
      this.ecDialogClose.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const lista = this.focaveis();
    if (lista.length === 0) {
      event.preventDefault();
      return;
    }
    const primeiro = lista[0];
    const ultimo = lista[lista.length - 1];
    const ativo = document.activeElement;
    if (event.shiftKey && (ativo === primeiro || ativo === this.el.nativeElement)) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && ativo === ultimo) {
      event.preventDefault();
      primeiro.focus();
    }
  }

  private focaveis(): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(
      (e) => !e.closest('[hidden]')
    );
  }
}
