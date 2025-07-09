/******/ (() => { // webpackBootstrap
/* eslint-disable */
if (!customElements.get('store-availability')) {
  customElements.define('store-availability',
  class StoreAvailability extends HTMLElement {
    constructor() {
      super();
      
      this.openLocationsModalBound = this.openLocationsModal.bind(this);
      this.closeLocationsModalBound = this.closeLocationsModal.bind(this);
      this.trapFocusBound = this.trapFocus.bind(this);
      this.cacheDOMEls();
    }

    cacheDOMEls() {
      this.drawerOverlay = document.querySelector('#DrawerOverlay');
      this.locationsModal = this.querySelector('.store-availabilities-modal');
      this.modalLink = this.querySelector('.store-availability-information__link');
      this.modalClose = this.querySelector('.store-availabilities-modal__close');
      this.modalContact = this.querySelector('.store-availability-list__phone a');
    }

    connectedCallback() {
      this.attachEvents();

      // Move modal html out of product info as that can be sticky, causing z-index problems.
      const parentNode = document.querySelector('#PageContainer');
      const otherAvailabilityModals = parentNode.querySelectorAll('.store-availabilities-modal');

      otherAvailabilityModals.forEach(modal => {
        if (modal !== this.locationsModal) {
          modal.remove();
        }
      });
      
      parentNode.appendChild(this.locationsModal);
    }

    disconnectedCallback() {
      // Remove event listeners when the component is removed from the DOM
      if (this.modalLink) this.modalLink.removeEventListener('click', this.openLocationsModalBound);
      if (this.modalClose) this.modalClose.removeEventListener('click', this.closeLocationsModalBound);
    }

    attachEvents() {
      // Attach event listeners
      if (this.modalLink) this.modalLink.addEventListener('click', this.openLocationsModalBound);
      if (this.modalClose) this.modalClose.addEventListener('click', this.closeLocationsModalBound);
    }

    openLocationsModal() {
      document.body.classList.add('js-drawer-location-modal-open');
      this.locationsModal.classList.add('locations-modal--is-active');
      if (this.modalClose) this.modalClose.setAttribute('tabindex', '0');
      if (this.modalContact) this.modalContact.setAttribute('tabindex', '0');

      // Trap focus within the modal
      this.locationsModal.addEventListener('keydown', this.trapFocusBound);
      // Close the modal if the 'Esc' key is pressed
      document.addEventListener('keydown', (event) => {this.escapeKeyHandler(event)}, { once: true });
      // Close the modal if the overlay is clicked
      this.drawerOverlay.addEventListener('click', this.closeLocationsModalBound, { once: true });
    }

    closeLocationsModal() {
      document.body.classList.remove('js-drawer-location-modal-open');
      this.locationsModal.classList.remove('locations-modal--is-active');
      if (this.modalClose) this.modalClose.setAttribute('tabindex', '-1');
      if (this.modalContact) this.modalContact.setAttribute('tabindex', '-1');

      // Remove the focus trap when the modal is closed
      this.removeTrapFocus();
    }

    escapeKeyHandler(event) {
      if (event.key === 'Escape') {
        this.closeLocationsModal();
      }
    }

    trapFocus(event) {
      // Trap focus within the modal
      const focusableElements = this.locationsModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      const isTabPressed = event.key === 'Tab' || event.keyCode === 9;

      if (!isTabPressed) return;

      if (event.shiftKey) {
        // If shift key is pressed when tabbing, focus the last element when tabbing out of the modal
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        // If tab key is pressed when tabbing, focus the first element when tabbing out of the modal
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }

    removeTrapFocus() {
      // Return focus to the element that triggered the modal
      if (this.modalLink) this.modalLink.focus();
      // Remove the event listener with the exact same function reference used to add it
      this.locationsModal.removeEventListener('keydown', this.trapFocusBound);
    }
  });
}
/******/ })()
;