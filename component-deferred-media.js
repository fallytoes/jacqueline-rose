/******/ (() => { // webpackBootstrap
/* eslint-disable no-undef */
class DeferredMedia extends HTMLElement {
  constructor() {
    super();

    /* ===== Cache the DOM elements and set the initial state of the component ===== */
    this.sectionId = this.getAttribute('data-section-id');
    this.activeMediaClass = this.getAttribute('data-active-media-class');
    this.mediaPlayButton = this.querySelector('[data-media-play-button]');
    this.mediaId = this.getAttribute('data-media-id');
    this.autoPlayEnabled = this.getAttribute('data-auto-play') === 'true';
    this.mediaLayout = this.getAttribute('data-media-layout');
    this.controlsEnabled = this.getAttribute('data-show-controls') === 'true';
    this.mediaCount = this.getAttribute('data-media-count');
    this.isProductMedia = this.getAttribute('data-is-product-media') === 'true';

    this.bindEventHandlers();
  }

  connectedCallback() {
    /* ===== Verify the initial setup and register the event listeners ===== */
    this.verifyInitialSetup();
    this.registerEventListeners();
  }

  disconnectedCallback() {
    this.unregisterEventListeners();
  }

  bindEventHandlers() {
    /* ===== Bind the event handlers in order to maintain the correct context of 'this' ===== */
    this.handleMediaClick = this.handleMediaClick.bind(this);
    this.handleMediaLoad = this.handleMediaLoad.bind(this);
    this.pauseAllMedia = this.pauseAllMedia.bind(this);
    this.handlePauseMedia = this.handlePauseMedia.bind(this);
    this.handleAutoPlay = this.handleAutoPlay.bind(this);
    this.playMedia = this.playMedia.bind(this);
  }

  verifyInitialSetup() {
    /* ===== Verify the initial setup of the component ===== */
    if (!this.mediaPlayButton) {
      // Log an error if the play button is not found
      console.error('DeferredMedia: Play button not found!');
    }
    if (!this.mediaId) {
      // Log an error if the media ID is not found
      console.error('DeferredMedia: Media ID not found!');
    }

    // If the media is not slider media and auto-play is enabled, play the media
    if (!this.isProductMedia && this.autoPlayEnabled) this.handleMediaClick();
  }

  registerEventListeners() {
    /* ===== Attach the event listeners to the DOM elements ===== */
    eventBus.on('load:media', this.handleMediaLoad);
    eventBus.on('pause:media', this.handlePauseMedia);
    eventBus.on('play:media', this.playMedia);
    eventBus.on('slider:media:ready', this.handleAutoPlay);
    this.mediaPlayButton?.addEventListener('click', this.handleMediaClick);
  }

  unregisterEventListeners() {
    this.mediaPlayButton?.removeEventListener('click', this.handleMediaClick);
    eventBus.off('load:media', this.handleMediaLoad);
    eventBus.off('pause:media', this.handlePauseMedia);
    eventBus.off('play:media', this.playMedia);
    eventBus.off('slider:media:ready', this.handleAutoPlay);
  }

  handleMediaLoad(event) {
    /* ===== Handle the load:media event and load the media if the media ID matches ===== */
    if (event.mediaId === this.mediaId && event.sectionId === this.sectionId) {
      this.loadMedia();
    }
  }

  handleMediaClick() {
    /* ===== Handle the click event on the media play button ===== */
    this.loadMedia();
  }

  hideLoadingIcon() {
    this.loadingIcon?.classList.add('hidden');
  }

  handleAutoPlay(event) {
    if (!event.sectionId || event.sectionId !== this.sectionId) return;
    if (!this.getAttribute('data-media-loaded')) {
      // Check if the element is visible
      const isVisible = getComputedStyle(this).display !== 'none';
      if (!isVisible && !this.closest('.swiper-slide-active')) return;
      if (this.isProductMedia && !this.closest('.swiper-slide-active')) return;
      // Load the media if the auto-play is enabled
      this.autoPlayEnabled && this.mediaPlayButton?.click();
    }
  }

  handlePauseMedia() {
    /* ===== Handle the 'pause:media' event ===== */
    this.pauseAllMedia().then(() => {
      this.removeAutoplayFromLoadedMedia();
    }).catch(error => {
      console.error('Error handling pause media:', error);
    });
  }

  playMedia(event) {
    const { sectionId, mediaEl } = event;
    if (mediaEl?.dataset?.mediaIsPlaying === 'true' || this.sectionId !== sectionId || !mediaEl || !this.autoPlayEnabled || !this.getAttribute('data-media-loaded')) return;

    this.pauseAllMedia().then(() => {
      // Get the media type
      const mediaType = mediaEl.tagName;
      // Play the media based on the type
      if (mediaType === 'VIDEO') {
        mediaEl.play();
      } else if (mediaType === 'IFRAME') {
        try {
          mediaEl.contentWindow.postMessage(this.messageFn('play', mediaEl.src), '*');
          // Set the flag to indicate this media is playing
          mediaEl.dataset.mediaIsPlaying = 'true';
        } catch (error) {
          console.error('Error playing iframe media:', error);
        }
      }
    });
  }

  loadMedia() {
    /* ===== Load the media element and post-process it ===== */
    if (!this.mediaId || this.getAttribute('data-media-loaded')) return;
    
    this.pauseAllMedia().then(() => {
      const template = this.querySelector('template');
      const mediaElement = template?.content?.querySelector('[data-media-wrapper]');
      if (!mediaElement) return;
      // check if the media is active when the layout is set to 'slider'
      if (this.isProductMedia && this.mediaLayout != 'grid' && this.mediaCount > 1 && !this.closest('.swiper-slide-active')) return;
  
      const media = mediaElement.cloneNode(true);
      this.appendChild(media);
      this.setAttribute('data-media-loaded', true);
      media.classList.add(this.activeMediaClass);
      if (this.mediaPlayButton) this.mediaPlayButton.style.display = 'none';
      template.remove();

      const mediaEl = media.querySelector('video, iframe, model-viewer');

      // Show the loading icon
      if (mediaEl && mediaEl.tagName === 'VIDEO') {
        this.loadingIcon = this.querySelector('[data-media-loading-icon]');
        if (this.loadingIcon) this.loadingIcon.classList.remove('hidden');
      }
  
      this.postProcessMedia(mediaEl);
    });
  }

  postProcessMedia(mediaEl) {
    /* ===== Post-process the media element and load specific features based on the media type ===== */
    if (!mediaEl) return;
  
    mediaEl.style.pointerEvents = 'auto';
    this.loadSpecificMediaFeatures(mediaEl);
  }

  loadSpecificMediaFeatures(mediaEl) {
    /* ===== Load specific features based on the media type ===== */
    switch (mediaEl.tagName) {
      case 'MODEL-VIEWER':
        this.loadModelFeatures(mediaEl);
        break;
      case 'VIDEO':
        mediaEl.play().then(() => {
          this.hideLoadingIcon();
        }).catch(error => {
          console.error('Error playing video:', error);
        });
        if (!this.controlsEnabled) this.setupVideoToggle(mediaEl);
        break;
      case 'IFRAME': {
        const mediaSrc = mediaEl.src;
        if (mediaSrc && mediaSrc.includes('vimeo')) mediaEl.classList.add('pointer-events-none');
        mediaEl.dataset.mediaIsPlaying = 'true';
        if (!this.controlsEnabled) this.setupIframeToggle(mediaEl);
        break;
      }
    }
  }

  setupVideoToggle(videoEl) {
    if (!videoEl || videoEl.tagName !== 'VIDEO') return;
    if (this.isProductMedia) {
      if (!videoEl.closest('.swiper-slide-active')) return;
    }
    
    // Add click listener to toggle play/pause after initial play
    videoEl.addEventListener('click', () => {
      if (videoEl.paused) {
        videoEl.play();
      } else {
        videoEl.pause();
      }
    });
  }

  setupIframeToggle(iframeEl) {
    if (!iframeEl || iframeEl.tagName !== 'IFRAME') return;
    if (this.isProductMedia) {
      if (!iframeEl.closest('.swiper-slide-active')) return;
    }
    
    // Add click listener to toggle play/pause after initial play for YouTube or Vimeo iframe
    const iframeWrapper = iframeEl.closest('[data-media-wrapper]');
    if (!iframeWrapper) return;

    iframeWrapper.addEventListener('click', () => {
      const src = iframeEl.src;
      const isPlaying = iframeEl.dataset.mediaIsPlaying === 'true';
  
      if (this.isYouTubeOrVimeo(src)) {
        const message = isPlaying ? 'pause' : 'play';
  
        try {
          // Play or pause the video
          iframeEl.contentWindow.postMessage(this.messageFn(message, iframeEl.src), '*');
          // Toggle play/pause state
          iframeEl.dataset.mediaIsPlaying = isPlaying ? 'false' : 'true';
        } catch (error) {
          console.error('Error playing iframe media:', error);
        }
      }
    });
  }
  
  isYouTubeOrVimeo(src) {
    return src.includes('youtube') || src.includes('vimeo');
  }

  loadModelFeatures(modelViewerElement) {
    /* ===== Load the model-viewer features and initialize the Shopify XR ===== */
    Shopify.loadFeatures([
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: (errors) => {
          if (errors) return;

          const modelViewerUI = new Shopify.ModelViewerUI(modelViewerElement);
          modelViewerElement.modelViewerUI = modelViewerUI;

          this.addModelInteractionListeners(modelViewerElement);
          this.initializeShopifyXR();
        },
      }
    ]);
  }

  addModelInteractionListeners(modelViewerElement) {
    /* ===== Add event listeners to disable/enable swiping on the main swiper ===== */
    const events = ['mousedown', 'mouseup', 'touchstart', 'touchend'];
    const actionMap = {
      'mousedown': 'disable-swiping',
      'mouseup': 'enable-swiping',
      'touchstart': 'disable-swiping',
      'touchend': 'enable-swiping'
    };

    events.forEach(event => {
      modelViewerElement.addEventListener(event, () => {
        eventBus.emit(actionMap[event], { sectionId: this.sectionId });
      });
    });
  }

  initializeShopifyXR() {
    /* ===== Initialize the Shopify XR and setup the XR elements ===== */
    Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: (errors) => {
          if (errors) return;
          document.addEventListener('shopify_xr_initialized', () => this.setupShopifyXR());
        },
      }
    ]);
  }

  setupShopifyXR() {
    /* ===== Setup the Shopify XR elements and add the models to the XR viewer ===== */
    document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
      window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
      modelJSON.remove();
    });
    window.ShopifyXR.setupXRElements();
  }

  pauseAllMedia() {
    /* ===== Pause all media elements on the page ===== */
    return new Promise((resolve, reject) => {
      try {
        const allMedia = document.querySelectorAll('deferred-media:not([data-auto-play="true"][data-is-product-media="false"] iframe:not(.is-background-media)), deferred-media:not([data-auto-play="true"][data-is-product-media="false"] video:not(.is-background-media)), model-viewer');
        const pausePromises = Array.from(allMedia).map(media => this.pauseMedia(media));

        Promise.all(pausePromises).then(() => resolve());
      } catch (error) {
        reject(error);
      }
    });
  }

  removeAutoplayFromLoadedMedia() {
    /* ===== Remove autoplay from loaded media elements ===== */
    const loadedMedia = this.querySelectorAll('[data-media-loaded] iframe, [data-media-loaded] video');
    loadedMedia.forEach(media => {
      this.removeAutoplayFromMedia(media);
    });
  }

  pauseMedia(media) {
    if (media.tagName === 'IFRAME') {
      try {
        // Pause the iframe media
        media.contentWindow.postMessage(this.messageFn('pause', media.src), '*');
        // Set the flag to indicate this media is not playing
        media.dataset.mediaIsPlaying = 'false';
      } catch (error) {
        console.error('Error pausing iframe media:', error);
      }
    } else if (media.tagName === 'VIDEO' && !media.paused) {
      return media.pause();
    } else if (media.tagName === 'MODEL-VIEWER' && media.modelViewerUI) {
      media.modelViewerUI.pause();
    }
  }

  removeAutoplayFromMedia(media) {
    if (!media || this.autoPlayEnabled) return;
    if (media.tagName === 'IFRAME' && media.src.includes('autoplay=1')) media.src = media.src.replace('autoplay=1', 'autoplay=0');
    if (media.tagName === 'VIDEO' && media.hasAttribute('autoplay')) media.removeAttribute('autoplay');
  }

  messageFn(action, src) {
    /* ===== Create a message function to pause/play the media elements ===== */
    if (src.includes('youtube')) {
      return JSON.stringify({ event: 'command', func: action === 'play' ? 'playVideo' : 'pauseVideo', args: [] });
    } else if (src.includes('vimeo')) {
      return JSON.stringify({ method: action });
    }
  }
}

if (!customElements.get('deferred-media')) {
  customElements.define('deferred-media', DeferredMedia);
}

/******/ })()
;