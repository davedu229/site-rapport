/**
 * MERIDIAN RESEARCH — Catalogue JS
 * Search, filter, sort logic for the reports catalog
 */

document.addEventListener('DOMContentLoaded', () => {
  const catalogueGrid = document.getElementById('catalogue-grid');
  const searchInput = document.getElementById('catalogue-search');
  const filterChips = document.querySelectorAll('.filter-chip');
  const sortSelect = document.getElementById('sort-select');
  const resultsCount = document.getElementById('results-count');

  if (!catalogueGrid) return;

  const reportCards = Array.from(catalogueGrid.querySelectorAll('.report-card'));

  let activeFilter = 'all';
  let searchTerm = '';

  // --- Filter by sector ---
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter || 'all';
      applyFilters();
    });
  });

  // --- Search ---
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // --- Sort ---
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applySort();
    });
  }

  function applyFilters() {
    let visibleCount = 0;

    reportCards.forEach(card => {
      const sector = card.dataset.sector || '';
      const title = (card.querySelector('.report-card__title')?.textContent || '').toLowerCase();
      const excerpt = (card.querySelector('.report-card__excerpt')?.textContent || '').toLowerCase();

      const matchFilter = activeFilter === 'all' || sector === activeFilter;
      const matchSearch = !searchTerm ||
        title.includes(searchTerm) ||
        excerpt.includes(searchTerm) ||
        sector.toLowerCase().includes(searchTerm);

      const isVisible = matchFilter && matchSearch;
      card.style.display = isVisible ? '' : 'none';

      if (isVisible) {
        visibleCount++;
        // Re-trigger animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 50);
      }
    });

    if (resultsCount) {
      const lang = window.i18n?.currentLang || 'fr';
      const label = lang === 'en' ? 'reports available' : 'rapports disponibles';
      resultsCount.textContent = `${visibleCount} ${label}`;
    }

    // Show/hide no-results
    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  function applySort() {
    if (!sortSelect) return;
    const value = sortSelect.value;

    const sorted = [...reportCards].sort((a, b) => {
      if (value === 'price-asc') {
        return getPrice(a) - getPrice(b);
      }
      if (value === 'price-desc') {
        return getPrice(b) - getPrice(a);
      }
      // Default: recent (by data-date)
      return (b.dataset.date || '').localeCompare(a.dataset.date || '');
    });

    sorted.forEach(card => catalogueGrid.appendChild(card));
  }

  function getPrice(card) {
    const priceEl = card.querySelector('.report-card__price');
    if (!priceEl) return 0;
    const text = priceEl.textContent.replace(/[^\d]/g, '');
    return parseInt(text, 10) || 0;
  }
});
