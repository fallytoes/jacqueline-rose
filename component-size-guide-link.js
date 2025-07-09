/******/ (() => { // webpackBootstrap
/* eslint-disable */
if (!customElements.get('size-guide-link')) {
  customElements.define('size-guide-link',
  class SizeGuideLink extends HTMLElement {
    constructor() {
      super();
      
      this.cacheDOMElements();
      this.handleClickBound = this.handleClick.bind(this);
    }

    cacheDOMElements() {
      this.sizeGuideLink = this.querySelector('[data-size-guide-link]');
    }

    connectedCallback() {
      this.sizeGuideLink.addEventListener('click', this.handleClickBound);
    }

    disconnectedCallback() {
      this.sizeGuideLink.removeEventListener('click', this.handleClickBound);
    }


    handleClick(event) {
      event.preventDefault();
      // Toggle the drawer
      eventBus.emit('toggle:right:drawer', { type: 'page', params: { url: event.currentTarget.href } });
    }
  });
}
/******/ })()
;