/**
 * The Hearth - Admin Panel JavaScript
 */

(function() {
  'use strict';

  let config = null;
  let draggedItem = null;

  // ============================================
  // DOM Elements
  // ============================================

  const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.sidebar-nav a'),
    sections: document.querySelectorAll('.admin-section'),

    // Theme
    primaryColor: document.getElementById('primaryColor'),
    primaryColorText: document.getElementById('primaryColorText'),
    secondaryColor: document.getElementById('secondaryColor'),
    secondaryColorText: document.getElementById('secondaryColorText'),
    accentColor: document.getElementById('accentColor'),
    accentColorText: document.getElementById('accentColorText'),
    lightBg: document.getElementById('lightBg'),
    lightBgText: document.getElementById('lightBgText'),
    lightText: document.getElementById('lightText'),
    lightTextText: document.getElementById('lightTextText'),
    darkBg: document.getElementById('darkBg'),
    darkBgText: document.getElementById('darkBgText'),
    darkText: document.getElementById('darkText'),
    darkTextText: document.getElementById('darkTextText'),
    saveTheme: document.getElementById('saveTheme'),

    // Typography
    fontHeading: document.getElementById('fontHeading'),
    fontBody: document.getElementById('fontBody'),
    saveTypography: document.getElementById('saveTypography'),

    // Gallery
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    galleryGrid: document.getElementById('galleryGrid'),
    galleryEmpty: document.getElementById('galleryEmpty'),

    // Share
    shareCopyUrl: document.getElementById('shareCopyUrl'),
    shareTwitter: document.getElementById('shareTwitter'),
    shareFacebook: document.getElementById('shareFacebook'),
    shareLinkedin: document.getElementById('shareLinkedin'),
    shareEmail: document.getElementById('shareEmail'),
    saveShare: document.getElementById('saveShare'),

    // Toast
    toast: document.getElementById('toast')
  };

  // ============================================
  // Initialization
  // ============================================

  async function init() {
    await loadConfig();
    initNavigation();
    initColorInputs();
    initThemeSection();
    initTypographySection();
    initGallerySection();
    initShareSection();
  }

  // ============================================
  // Config
  // ============================================

  async function loadConfig() {
    try {
      const response = await fetch('/api/admin/config');
      config = await response.json();
      applyConfigToForm();
    } catch (err) {
      console.error('Failed to load config:', err);
      showToast('Failed to load configuration', 'error');
    }
  }

  async function saveConfig(updates) {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const result = await response.json();
      config = result.config;
      showToast('Changes saved successfully', 'success');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save changes', 'error');
      return false;
    }
  }

  function applyConfigToForm() {
    if (!config) return;

    // Theme colors
    if (config.theme) {
      setColorInput('primaryColor', config.theme.primaryColor);
      setColorInput('secondaryColor', config.theme.secondaryColor);
      setColorInput('accentColor', config.theme.accentColor);
      setColorInput('lightBg', config.theme.lightBg);
      setColorInput('lightText', config.theme.lightText);
      setColorInput('darkBg', config.theme.darkBg);
      setColorInput('darkText', config.theme.darkText);

      // Typography
      if (elements.fontHeading) {
        elements.fontHeading.value = config.theme.fontHeading || 'Josefin Sans';
      }
      if (elements.fontBody) {
        elements.fontBody.value = config.theme.fontBody || 'Inter';
      }
    }

    // Share options
    if (config.share) {
      if (elements.shareCopyUrl) elements.shareCopyUrl.checked = config.share.copyUrl !== false;
      if (elements.shareTwitter) elements.shareTwitter.checked = config.share.twitter !== false;
      if (elements.shareFacebook) elements.shareFacebook.checked = config.share.facebook !== false;
      if (elements.shareLinkedin) elements.shareLinkedin.checked = config.share.linkedin !== false;
      if (elements.shareEmail) elements.shareEmail.checked = config.share.email !== false;
    }

    // Gallery
    renderGallery();
  }

  function setColorInput(baseName, value) {
    const colorInput = elements[baseName];
    const textInput = elements[baseName + 'Text'];
    if (colorInput && value) colorInput.value = value;
    if (textInput && value) textInput.value = value;
  }

  // ============================================
  // Navigation
  // ============================================

  function initNavigation() {
    elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;

        // Update nav
        elements.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Update sections
        elements.sections.forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        // Update hash
        history.pushState(null, '', '#' + section);
      });
    });

    // Handle initial hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      const link = document.querySelector(`[data-section="${hash}"]`);
      if (link) link.click();
    }
  }

  // ============================================
  // Color Inputs
  // ============================================

  function initColorInputs() {
    const colorPairs = [
      ['primaryColor', 'primaryColorText'],
      ['secondaryColor', 'secondaryColorText'],
      ['accentColor', 'accentColorText'],
      ['lightBg', 'lightBgText'],
      ['lightText', 'lightTextText'],
      ['darkBg', 'darkBgText'],
      ['darkText', 'darkTextText']
    ];

    colorPairs.forEach(([colorId, textId]) => {
      const colorInput = elements[colorId];
      const textInput = elements[textId];

      if (colorInput && textInput) {
        colorInput.addEventListener('input', () => {
          textInput.value = colorInput.value;
        });

        textInput.addEventListener('input', () => {
          if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
            colorInput.value = textInput.value;
          }
        });

        textInput.addEventListener('blur', () => {
          if (!/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
            textInput.value = colorInput.value;
          }
        });
      }
    });
  }

  // ============================================
  // Theme Section
  // ============================================

  function initThemeSection() {
    if (elements.saveTheme) {
      elements.saveTheme.addEventListener('click', async () => {
        const theme = {
          ...config.theme,
          primaryColor: elements.primaryColor.value,
          secondaryColor: elements.secondaryColor.value,
          accentColor: elements.accentColor.value,
          lightBg: elements.lightBg.value,
          lightText: elements.lightText.value,
          darkBg: elements.darkBg.value,
          darkText: elements.darkText.value
        };

        await saveConfig({ theme });
      });
    }
  }

  // ============================================
  // Typography Section
  // ============================================

  function initTypographySection() {
    if (elements.saveTypography) {
      elements.saveTypography.addEventListener('click', async () => {
        const theme = {
          ...config.theme,
          fontHeading: elements.fontHeading.value,
          fontBody: elements.fontBody.value
        };

        await saveConfig({ theme });
      });
    }
  }

  // ============================================
  // Gallery Section
  // ============================================

  function initGallerySection() {
    // File input
    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', handleFileSelect);
    }

    // Drag and drop upload
    if (elements.uploadArea) {
      elements.uploadArea.addEventListener('click', () => elements.fileInput.click());

      elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
      });

      elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
      });

      elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
          uploadFiles(files);
        }
      });
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
    e.target.value = ''; // Reset input
  }

  async function uploadFiles(files) {
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', '');

      try {
        const response = await fetch('/api/admin/gallery/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        config.gallery.push(result.image);
        renderGallery();
        showToast(`Uploaded: ${file.name}`, 'success');
      } catch (err) {
        console.error('Upload error:', err);
        showToast(`Failed to upload: ${file.name}`, 'error');
      }
    }
  }

  function renderGallery() {
    if (!elements.galleryGrid || !elements.galleryEmpty) return;

    const gallery = config.gallery || [];

    if (gallery.length === 0) {
      elements.galleryGrid.innerHTML = '';
      elements.galleryEmpty.style.display = 'block';
      return;
    }

    elements.galleryEmpty.style.display = 'none';

    // Sort by order
    const sorted = [...gallery].sort((a, b) => a.order - b.order);

    elements.galleryGrid.innerHTML = sorted.map(img => `
      <div class="gallery-item" data-id="${img.id}" draggable="true">
        <img src="${img.path}" alt="${img.caption || 'Gallery image'}">
        <div class="gallery-item-info">
          <input type="text" class="gallery-item-caption" value="${img.caption || ''}" placeholder="Add caption..." data-id="${img.id}">
          <div class="gallery-item-actions">
            <button class="btn btn-secondary btn-sm save-caption" data-id="${img.id}">Save</button>
            <button class="btn btn-danger btn-sm delete-image" data-id="${img.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners
    initGalleryItemListeners();
  }

  function initGalleryItemListeners() {
    // Caption save buttons
    elements.galleryGrid.querySelectorAll('.save-caption').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const input = elements.galleryGrid.querySelector(`.gallery-item-caption[data-id="${id}"]`);
        const caption = input.value;

        try {
          const response = await fetch(`/api/admin/gallery/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caption })
          });

          if (!response.ok) throw new Error('Failed to save');

          // Update local config
          const img = config.gallery.find(i => i.id === id);
          if (img) img.caption = caption;

          showToast('Caption saved', 'success');
        } catch (err) {
          console.error('Save caption error:', err);
          showToast('Failed to save caption', 'error');
        }
      });
    });

    // Delete buttons
    elements.galleryGrid.querySelectorAll('.delete-image').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        const id = btn.dataset.id;

        try {
          const response = await fetch(`/api/admin/gallery/${id}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('Failed to delete');

          // Remove from local config
          config.gallery = config.gallery.filter(i => i.id !== id);
          renderGallery();
          showToast('Image deleted', 'success');
        } catch (err) {
          console.error('Delete error:', err);
          showToast('Failed to delete image', 'error');
        }
      });
    });

    // Drag and drop reordering
    const items = elements.galleryGrid.querySelectorAll('.gallery-item');

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
        saveGalleryOrder();
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === item) return;

        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        if (e.clientY < midY) {
          item.parentNode.insertBefore(draggedItem, item);
        } else {
          item.parentNode.insertBefore(draggedItem, item.nextSibling);
        }
      });
    });
  }

  async function saveGalleryOrder() {
    const items = elements.galleryGrid.querySelectorAll('.gallery-item');
    const order = Array.from(items).map(item => item.dataset.id);

    try {
      const response = await fetch('/api/admin/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });

      if (!response.ok) throw new Error('Failed to reorder');

      const result = await response.json();
      config.gallery = result.gallery;
      showToast('Gallery order saved', 'success');
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Failed to save order', 'error');
    }
  }

  // ============================================
  // Share Section
  // ============================================

  function initShareSection() {
    if (elements.saveShare) {
      elements.saveShare.addEventListener('click', async () => {
        const share = {
          copyUrl: elements.shareCopyUrl.checked,
          twitter: elements.shareTwitter.checked,
          facebook: elements.shareFacebook.checked,
          linkedin: elements.shareLinkedin.checked,
          email: elements.shareEmail.checked
        };

        await saveConfig({ share });
      });
    }
  }

  // ============================================
  // Toast
  // ============================================

  function showToast(message, type = 'success') {
    if (!elements.toast) return;

    elements.toast.textContent = message;
    elements.toast.className = 'toast ' + type + ' show';

    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3000);
  }

  // ============================================
  // Start
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
