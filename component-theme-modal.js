/******/ (() => { // webpackBootstrap
if (!customElements.get('theme-modal')) {
  class ThemeModal extends HTMLElement {
    constructor() {
      super();
      this.modalId = 'ThemeModal';
      this.modalContentSelector = '[data-modal-content] .theme-modal--inner';
      this.focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
      this.cacheDOMElements();
      this.bindEventHandlers();
      window._myModalCache = window._myModalCache || {};
    }

    cacheDOMElements() {
      this.sectionId = this.getAttribute('data-section-id');
      this.sectionFetchId = this.getAttribute('data-section-fetch-id');
      this.productUrl = this.getAttribute('data-product-url');
      this.contentSelector = this.getAttribute('data-content-selector');
      this.shouldFetchSection = this.hasAttribute('data-fetch-section');
      this.blockId = this.getAttribute('data-block-id');
      this.modalButton = this.querySelector('[data-modal-button]');
      this.modalTemplate = this.querySelector('template');
      this.overlay = document.querySelector('#DrawerOverlay');
      this.modalContent = this.querySelector('[data-modal-content]');

      // Early return if required elements are missing
      if (!this.modalButton || !this.modalTemplate) {
        console.warn('Theme Modal: Required elements missing');
        return;
      }
    }

    bindEventHandlers() {
      this.showModal = this.showModal.bind(this);
      this.hideModal = this.hideModal.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    connectedCallback() {
      // Show modal when button is clicked
      this.modalButton.addEventListener('click', this.showModal);

      // Hide modal when overlay is clicked
      if (this.overlay) this.overlay.addEventListener('click', this.hideModal);

      // Prefetch modal content when product card is hovered
      if (this.shouldFetchSection) {
        const productCard = this.closest('product-card');
        if (productCard) {
          let hoverTimer;

          // Prefetch modal content when product card is hovered
          productCard.addEventListener('mouseenter', () => {
            hoverTimer = setTimeout(() => {
              this.prefetch();
            }, 250); // 250ms delay
          });

          // Clear the timer if the mouse leaves the product card
          productCard.addEventListener('mouseleave', () => clearTimeout(hoverTimer));

          // Handle touch events for mobile
          productCard.addEventListener('touchstart', () => {
            this.prefetch();
          }, { once: true });
        }
      }

      // Handle editor events
      if (window.Shopify.designMode) {
        document.addEventListener('shopify:section:load', async () => {
          // Hide the modal if it's already open
          this.hideModal();
        });
      }
    }

    disconnectedCallback() {
      // Clean up event listeners
      this.modalButton.removeEventListener('click', this.showModal);
      if (this.overlay) this.overlay.removeEventListener('click', this.hideModal);
      if (this.dismissButton) this.dismissButton.removeEventListener('click', this.hideModal);
    }

    prefetch() {
      const url = this.productUrl || `${window.Shopify.routes.root}?section_id=${this.sectionFetchId}`;
      if (!url) return;
    
      if (window._myModalCache[url]) {
        // Already cached
        this._prefetchedModalHTML = window._myModalCache[url];
        return;
      }
    
      // Fetch modal content in the background
      this.fetchModalContentInBackground()
        .then(() => {
          // Mark as fetched
          window._myModalCache[url] = this._prefetchedModalHTML;
        })
        .catch(err => {
          console.error('Prefetch error:', err);
        });
    }
    
    async fetchModalContentInBackground() {
      try {
        const url = this.productUrl || `${window.Shopify.routes.root}?section_id=${this.sectionFetchId}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch modal content: ${response.status}`);
        }
    
        const textContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(textContent, 'text/html');
        const relevantContent = this.contentSelector 
          ? doc.querySelector(this.contentSelector)?.innerHTML 
          : textContent;
    
        // Store it so we can inject it later
        this._prefetchedModalHTML = relevantContent || '';
        
        // Fire an event or just log
        window.eventBus.emit('product:modal:prefetched', { sectionId: this.sectionId });
      } catch (error) {
        console.error('Theme Modal: Error prefetching content', error);
        throw error; // rethrow so the .catch in prefetch() sees it
      }
    }    

    initScrollHandler(el) {
      if (!el) return;
      let scrolling;

      el.addEventListener('scroll', () => {
        clearTimeout(scrolling);
        el.classList.add('scrolling');
        scrolling = setTimeout(() => {
          el.classList.remove('scrolling');
        }, 800);
      });
    }

    async render() {
      try {
        const modalContent = document.querySelector(`#${this.modalId}`);
        if (!modalContent) {
          console.warn('Theme Modal: Modal content element not found');
          return false;
        }
    
        // Insert your template
        modalContent.innerHTML = this.modalTemplate.innerHTML;
        this.modalContent = modalContent;
        this.dismissButton = this.modalContent.querySelector('[data-close]');
    
        // Set up the dismiss button, etc.
        if (this.dismissButton) {
          this.dismissButton.addEventListener('click', this.hideModal);
        }
    
        // If we have prefetched content in memory, just inject it, no fetch
        if (this._prefetchedModalHTML) {
          const targetElement = document.querySelector(`#${this.modalId} ${this.modalContentSelector}`);
          if (!targetElement) {
            console.error('Modal content target element not found');
            return false;
          }
          targetElement.innerHTML = this._prefetchedModalHTML;
          // Emit an event that the content is ready
          window.eventBus.emit('product:modal:ready', { sectionId: this.sectionId });
        }
        // otherwise do the original fetch if needed
        else if (this.shouldFetchSection && (this.sectionFetchId || this.productUrl)) {
          await this.fetchModalContent(); // your original fetch that also injects into DOM
        }
    
        return true;
      } catch (error) {
        console.error('Theme Modal: Error rendering modal', error);
        return false;
      }
    }    

    async showModal(e) {
      e.stopPropagation();
      e.preventDefault();
    
      // Store the element that was focused before opening the modal
      this.previousActiveElement = e.currentTarget;
    
      const rendered = await this.render();
      if (rendered) {
        document.body.classList.add('theme-modal-open');
        if (this.modalContent) {
          this.modalContent.classList.remove('hidden');
          this.trapFocus();
    
          const scrollableInner = this.modalContent.querySelector('[data-modal-content]');
          if (scrollableInner) {
            this.initScrollHandler(scrollableInner);
          }
        }
      }
    }    

    hideModal() {
      // Hide the modal
      document.body.classList.remove('theme-modal-open');

      if (this.modalContent) {
        this.modalContent.classList.add('hidden');
        // Emit event before clearing content
        window.eventBus.emit('product:modal:close', { sectionId: this.sectionId });
        // Clear the modal content to prevent it from being shown when the modal is opened again
        this.modalContent.innerHTML = '';
      }

      // Return focus to the modal button
      if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
        this.previousActiveElement.focus();
      }
      document.removeEventListener('keydown', this.handleKeydown);
    }

    trapFocus() {
      const focusableElements = this.modalContent.querySelectorAll(this.focusableSelector);
      const firstElement = focusableElements[0];
      
      if (!firstElement) return;

      document.addEventListener('keydown', this.handleKeydown);
      requestAnimationFrame(() => firstElement.focus());
    }

    handleKeydown(event) {
      const focusableElements = this.modalContent.querySelectorAll(this.focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (!firstElement || !lastElement) return;

      const isTabPressed = event.key === 'Tab';
      const isEscapePressed = event.key === 'Escape';

      if (isEscapePressed) {
        this.hideModal();
        return;
      }

      if (!isTabPressed) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }

    async fetchModalContent() {
      try {
        const url = this.productUrl || `${window.Shopify.routes.root}?section_id=${this.sectionFetchId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch modal content: ${response.status}`);
        }

        const textContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(textContent, 'text/html');
        
        const modalContent = this.contentSelector 
          ? doc.querySelector(this.contentSelector)?.innerHTML 
          : textContent;

        const targetElement = document.querySelector(`#${this.modalId} ${this.modalContentSelector}`);
        if (!targetElement) {
          throw new Error('Modal content target element not found');
        }

        targetElement.innerHTML = modalContent || '';
        
        // Emit event after content is loaded
        window.eventBus.emit('product:modal:ready', { sectionId: this.sectionId });
      } catch (error) {
        console.error('Theme Modal: Error fetching content', error);
        // Optionally show user-friendly error message in modal
        const targetElement = document.querySelector(`#${this.modalId} ${this.modalContentSelector}`);
        if (targetElement) {
          targetElement.innerHTML = '<p>Sorry, there was an error loading the content. Please try again.</p>';
        }
      }
    }
  }

  customElements.define('theme-modal', ThemeModal);
}

/******/ })()
;