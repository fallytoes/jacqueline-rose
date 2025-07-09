document.addEventListener('DOMContentLoaded', function() {
  // Allow a moment for everything to render
  setTimeout(function() {
    // Find the title element - try multiple possible selectors
    const titleElement = document.querySelector('.collection-title') || 
                         document.querySelector('.page--title') || 
                         document.querySelector('h1');
    
    // Find the filter controls - try multiple possible selectors
    const filterControls = document.querySelectorAll('button[id="filter-button"], button[id="sort-button"], .filter-dropdown, .sort-dropdown, .view-options, [class*="filter"], [class*="sort"]');
    
    // Check if we found both elements
    if (titleElement && filterControls.length > 0) {
      // Create new containers
      const headerContainer = document.createElement('div');
      headerContainer.style.display = 'flex';
      headerContainer.style.justifyContent = 'space-between';
      headerContainer.style.alignItems = 'center';
      headerContainer.style.width = '100%';
      headerContainer.style.padding = '20px 40px';
      headerContainer.style.marginBottom = '20px';
      
      // Left container for title
      const leftContainer = document.createElement('div');
      leftContainer.style.textAlign = 'left';
      
      // Right container for filters
      const rightContainer = document.createElement('div');
      rightContainer.style.display = 'flex';
      rightContainer.style.gap = '15px';
      rightContainer.style.alignItems = 'center';
      rightContainer.style.marginLeft = 'auto';
      
      // Clone the title to avoid reference issues
      const newTitle = titleElement.cloneNode(true);
      leftContainer.appendChild(newTitle);
      
      // Move filter controls to right container
      filterControls.forEach(control => {
        const newControl = control.cloneNode(true);
        rightContainer.appendChild(newControl);
      });
      
      // Add containers to header
      headerContainer.appendChild(leftContainer);
      headerContainer.appendChild(rightContainer);
      
      // Find a good place to insert our new header
      const mainContent = document.querySelector('main') || document.querySelector('.main-content') || document.body;
      const existingHeader = document.querySelector('.collection-header') || document.querySelector('header + *');
      
      // Insert the new header
      if (existingHeader) {
        // Replace existing header if we can find it
        existingHeader.replaceWith(headerContainer);
      } else {
        // Otherwise insert at top of main content
        mainContent.insertBefore(headerContainer, mainContent.firstChild);
      }
      
      // Hide original elements
      titleElement.style.display = 'none';
      filterControls.forEach(control => {
        control.style.display = 'none';
      });
    }
  }, 500);
});