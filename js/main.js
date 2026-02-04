// main.js
import { Wishlist } from './wishlist.js';
import { renderGames, renderGamesWithDownload, renderWishlist, renderGameDetails, renderDeals, renderFreeGames, renderRecommendations, renderComparisonSlot, renderComparisonTable } from './ui.js';
import api from './api.js';
import { gameFilter } from './filter.js';
import { gameComparison } from './comparison.js';
import { recommendationEngine } from './recommendations.js';

// Global trailer function
window.openTrailer = async function(gameName) {
    const modal = document.getElementById('trailer-modal');
    const container = document.getElementById('trailer-container');
    const titleEl = document.getElementById('trailer-title');
    
    if (!modal || !container) return;
    
    // Show modal with loading state
    modal.classList.add('active');
    titleEl.textContent = `${gameName} - Loading Trailer...`;
    container.innerHTML = '<div class="trailer-fallback"><p>🎬 Loading trailer...</p></div>';
    
    try {
        const trailer = await api.getGameTrailer(gameName);
        
        if (trailer) {
            titleEl.textContent = `${gameName} - Official Trailer`;
            
            if (trailer.source === 'youtube') {
                container.innerHTML = `<iframe src="${trailer.embedUrl}" allowfullscreen allow="autoplay"></iframe>`;
            } else if (trailer.source === 'rawg' && trailer.videoUrl) {
                container.innerHTML = `<video controls autoplay><source src="${trailer.videoUrl}" type="video/mp4">Your browser does not support video.</video>`;
            } else if (trailer.source === 'youtube-search') {
                container.innerHTML = `
                    <div class="trailer-fallback">
                        <p>🎮 Trailer not found directly</p>
                        <a href="${trailer.searchUrl}" target="_blank">🔍 Search on YouTube</a>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="trailer-fallback">
                    <p>😔 No trailer available</p>
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' trailer')}" target="_blank">🔍 Search on YouTube</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Trailer error:', error);
        container.innerHTML = `
            <div class="trailer-fallback">
                <p>❌ Failed to load trailer</p>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' trailer')}" target="_blank">🔍 Search on YouTube</a>
            </div>
        `;
    }
};

// Close trailer modal
window.closeTrailer = function() {
    const modal = document.getElementById('trailer-modal');
    const container = document.getElementById('trailer-container');
    if (modal) modal.classList.remove('active');
    if (container) container.innerHTML = '';
};

document.addEventListener('DOMContentLoaded', async () => {
    // Load dynamic header and footer
    await loadPartial('header', 'header-placeholder');
    await loadPartial('footer', 'footer-placeholder');
    
    // Initialize wishlist and update counts
    const wishlist = new Wishlist();
    wishlist.init();
    
    // Set active navigation link
    setActiveNavLink();
    
    // Setup trailer modal close handlers
    const trailerModal = document.getElementById('trailer-modal');
    const trailerClose = document.getElementById('trailer-close');
    
    if (trailerClose) {
        trailerClose.addEventListener('click', window.closeTrailer);
    }
    if (trailerModal) {
        trailerModal.addEventListener('click', (e) => {
            if (e.target === trailerModal) window.closeTrailer();
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeTrailer();
    });
    
    // Page-specific initialization
    if (document.body.id === 'index-page') {
        await initBrowsePage();
    } else if (document.body.id === 'detail-page') {
        await initDetailPage();
    } else if (document.body.id === 'wishlist-page') {
        initWishlistPage();
    } else if (document.body.id === 'upcoming-page') {
        await initUpcomingPage();
    } else if (document.body.id === 'deals-page') {
        await initDealsPage();
    } else if (document.body.id === 'free-games-page') {
        await initFreeGamesPage();
    } else if (document.body.id === 'comparison-page') {
        await initComparisonPage();
    }
});

// Load partial content
async function loadPartial(name, placeholderId) {
    try {
        const response = await fetch(`partials/${name}.html`);
        if (!response.ok) throw new Error(`Failed to load ${name}`);
        
        const html = await response.text();
        document.getElementById(placeholderId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${name}:`, error);
        document.getElementById(placeholderId).innerHTML = 
            `<div class="error">Failed to load ${name}. Please refresh.</div>`;
    }
}

// Set active navigation link
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Browse page initialization
async function initBrowsePage() {
    document.body.id = 'index-page';
    
    try {
        // Load featured games carousel - AAA High Quality Games
        // Fetch specific popular AAA titles for the featured section
        const aaaGameNames = [
            'The Witcher 3: Wild Hunt',
            'Grand Theft Auto V', 
            'Red Dead Redemption 2',
            'God of War',
            'Elden Ring',
            'Cyberpunk 2077',
            'Uncharted 4',
            'Need for Speed Heat',
            'Forza Horizon 5',
            'Horizon Zero Dawn',
            'The Last of Us',
            'Spider-Man',
            'Assassin\'s Creed Valhalla',
            'Far Cry 6',
            'Call of Duty: Modern Warfare'
        ];
        
        // Fetch AAA games for all platforms including PlayStation
        const featuredGames = [];
        
        // Fetch high-rated games across all platforms (PC, PlayStation, Xbox, Nintendo, Mobile)
        // Platform IDs: 4=PC, 18=PS4, 187=PS5, 1=Xbox One, 186=Xbox Series X, 7=Switch, 3=iOS, 21=Android
        const platformIds = '4,18,187,1,186,7,3,21'; // PC, PS4, PS5, Xbox One, Xbox Series, Switch, iOS, Android
        
        // First try to get games with high metacritic scores
        const highRatedData = await api.fetchGames({ 
            page_size: 20, 
            ordering: '-metacritic',
            metacritic: '85,100',
            platforms: platformIds
        });
        
        if (highRatedData.results && highRatedData.results.length > 0) {
            featuredGames.push(...highRatedData.results);
        }
        
        // Add PlayStation exclusive/popular games
        const psGamesData = await api.fetchGames({ 
            page_size: 10, 
            ordering: '-metacritic,-rating',
            platforms: '18,187', // PS4 and PS5
            metacritic: '80,100'
        });
        
        if (psGamesData.results) {
            for (const game of psGamesData.results) {
                if (!featuredGames.find(g => g.id === game.id)) {
                    featuredGames.push(game);
                }
            }
        }
        
        // If we don't have enough, add top rated games from all platforms
        if (featuredGames.length < 15) {
            const topRatedData = await api.fetchGames({ 
                page_size: 15, 
                ordering: '-rating',
                platforms: platformIds
            });
            if (topRatedData.results) {
                for (const game of topRatedData.results) {
                    if (!featuredGames.find(g => g.id === game.id)) {
                        featuredGames.push(game);
                    }
                }
            }
        }
        
        // Sort by metacritic to show best games first
        featuredGames.sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0));
        
        if (featuredGames.length > 0) {
            let currentIndex = 0;
            
            // Add slide indicators
            const featuredSection = document.getElementById('featured-game');
            const indicatorHtml = `<div class="slide-indicator">${featuredGames.map((_, i) => 
                `<span class="slide-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
            ).join('')}</div>`;
            featuredSection.insertAdjacentHTML('beforeend', indicatorHtml);
            
            // Function to update featured game display
            function updateFeaturedGame(index) {
                const featured = featuredGames[index];
                const titleEl = document.getElementById('featured-title');
                const platformsEl = document.getElementById('featured-platforms');
                const linkEl = document.getElementById('featured-link');
                const bgEl = document.getElementById('featured-bg');
                const downloadBtn = document.getElementById('featured-download');
                const trailerBtn = document.getElementById('featured-trailer');
                const contentEl = document.querySelector('.featured-content');
                
                // Fade out
                if (bgEl) bgEl.style.opacity = '0';
                if (contentEl) contentEl.style.opacity = '0';
                
                setTimeout(() => {
                    if (titleEl) titleEl.textContent = featured.name;
                    if (platformsEl) {
                        const platforms = featured.parent_platforms?.map(p => p.platform.name).join(', ') || 'PC, PS5, Xbox';
                        platformsEl.textContent = `Available Now on ${platforms}`;
                    }
                    if (linkEl) linkEl.href = `game-details.html?id=${featured.id}`;
                    if (bgEl && featured.background_image) {
                        bgEl.style.backgroundImage = `url('${featured.background_image}')`;
                    }
                    if (downloadBtn) {
                        downloadBtn.onclick = () => window.location.href = `game-details.html?id=${featured.id}`;
                    }
                    if (trailerBtn) {
                        trailerBtn.onclick = () => window.openTrailer(featured.name);
                    }
                    
                    // Update indicators
                    document.querySelectorAll('.slide-dot').forEach((dot, i) => {
                        dot.classList.toggle('active', i === index);
                    });
                    
                    // Fade in
                    if (bgEl) bgEl.style.opacity = '1';
                    if (contentEl) contentEl.style.opacity = '1';
                }, 400);
            }
            
            // Initial display
            updateFeaturedGame(0);
            
            // Auto-rotate every 5 seconds
            setInterval(() => {
                currentIndex = (currentIndex + 1) % featuredGames.length;
                updateFeaturedGame(currentIndex);
            }, 5000);
            
            // Click on indicators to change slide
            document.querySelectorAll('.slide-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    currentIndex = parseInt(e.target.dataset.index);
                    updateFeaturedGame(currentIndex);
                });
            });
        }

        // Load new releases - prioritize high rated AAA games across all platforms
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 3); // Last 3 months for more results
        
        const newReleasesData = await api.fetchGames({
            dates: `${lastMonth.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`,
            ordering: '-metacritic,-rating', // Sort by metacritic then rating
            page_size: 12,
            platforms: '4,18,187,1,186,7,3,21', // PC, PS4, PS5, Xbox One, Xbox Series, Switch, iOS, Android
            metacritic: '70,100' // Only games with good scores
        });
        
        // Sort by metacritic/rating to show best first
        let newReleases = newReleasesData.results || [];
        newReleases.sort((a, b) => {
            const scoreA = (a.metacritic || 0) + (a.rating || 0) * 20;
            const scoreB = (b.metacritic || 0) + (b.rating || 0) * 20;
            return scoreB - scoreA;
        });
        
        // Hide section if no new releases found
        const newReleasesSection = document.getElementById('new-releases-container')?.closest('section');
        if (newReleases.length === 0) {
            if (newReleasesSection) newReleasesSection.style.display = 'none';
        } else {
            if (newReleasesSection) newReleasesSection.style.display = 'block';
            renderGamesWithDownload(newReleases.slice(0, 6), 'new-releases-container');
        }

        // Load popular games - AAA quality games with high ratings across all platforms
        const popularData = await api.fetchGames({ 
            ordering: '-metacritic,-rating,-added', 
            page_size: 12,
            platforms: '4,18,187,1,186,7,3,21', // PC, PS4, PS5, Xbox One, Xbox Series, Switch, iOS, Android
            metacritic: '80,100' // High metacritic scores
        });
        
        // Sort by combined score to ensure best games first
        let popularGames = popularData.results || [];
        popularGames.sort((a, b) => {
            const scoreA = (a.metacritic || 0) + (a.rating || 0) * 20 + (a.ratings_count || 0) / 1000;
            const scoreB = (b.metacritic || 0) + (b.rating || 0) * 20 + (b.ratings_count || 0) / 1000;
            return scoreB - scoreA;
        });
        
        renderGamesWithDownload(popularGames.slice(0, 6), 'games-container');
    } catch (error) {
        console.error('Failed to load games:', error);
        document.getElementById('games-container').innerHTML = `
            <div class="error-container">
                <h3>Failed to load games</h3>
                <p>Please check your API key or try again later.</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
    
    // Setup search
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    // Load filters
    loadPlatformFilters();
    loadGenreFilters();
    
    // Setup filter buttons
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    applyFiltersBtn?.addEventListener('click', applyFilters);
    clearFiltersBtn?.addEventListener('click', clearFilters);
}

// Apply filters
async function applyFilters() {
    const container = document.getElementById('games-container');
    container.innerHTML = '<div class="loading"><p>Applying filters...</p></div>';
    
    // Clear existing filters first
    gameFilter.clearFilters();
    
    // Get selected platforms
    document.querySelectorAll('#platform-filters input:checked').forEach(input => {
        gameFilter.currentFilters.platforms.push(input.dataset.platform);
    });
    
    // Get selected genres
    document.querySelectorAll('#genre-filters input:checked').forEach(input => {
        gameFilter.currentFilters.genres.push(input.dataset.genre);
    });
    
    // Get sort option
    const sortValue = document.getElementById('sort-filter')?.value || '';
    if (sortValue) {
        gameFilter.currentFilters.ordering = sortValue;
    }
    
    try {
        // Fetch filtered games
        const data = await gameFilter.fetchFilteredGames();
        
        if (data.results && data.results.length > 0) {
            renderGames(data.results, 'games-container');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No games found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to apply filters:', error);
        container.innerHTML = `
            <div class="error-container">
                <h3>Failed to load filtered games</h3>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Clear all filters
async function clearFilters() {
    // Uncheck all checkboxes
    document.querySelectorAll('#platform-filters input, #genre-filters input').forEach(input => {
        input.checked = false;
    });
    
    // Reset sort
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) sortFilter.value = '';
    
    // Clear filter module
    gameFilter.clearFilters();
    
    // Reload initial games
    const container = document.getElementById('games-container');
    container.innerHTML = '<div class="loading"><p>Loading games...</p></div>';
    
    try {
        const data = await api.fetchGames();
        renderGames(data.results, 'games-container');
    } catch (error) {
        console.error('Failed to reload games:', error);
    }
}

// Detail page initialization
async function initDetailPage() {
    document.body.id = 'detail-page';
    
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        document.querySelector('.game-detail').innerHTML = `
            <div class="error-container">
                <h2>Game Not Found</h2>
                <p>Invalid game ID. Please return to <a href="index.html">browse page</a></p>
            </div>
        `;
        return;
    }
    
    const game = await api.getGameDetails(gameId);
    if (!game) {
        document.querySelector('.game-detail').innerHTML = `
            <div class="error-container">
                <h2>Game Not Found</h2>
                <p>We couldn't find the requested game. Please return to <a href="index.html">browse page</a></p>
            </div>
        `;
        return;
    }
    
    renderGameDetails(game);
    updateWishlistButton(game);
    
    // Load similar game recommendations
    await loadRecommendations(game);
}

// Load similar game recommendations
async function loadRecommendations(game) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    try {
        // Use the full game object for better recommendations
        const similarGames = await recommendationEngine.getSimilarGames(game);
        
        if (similarGames && similarGames.length > 0) {
            renderRecommendations(similarGames, 'recommendations-container');
        } else {
            document.getElementById('recommendations-section').style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load recommendations:', error);
        document.getElementById('recommendations-section').style.display = 'none';
    }
}

// Wishlist page initialization
function initWishlistPage() {
    document.body.id = 'wishlist-page';
    const wishlist = new Wishlist();
    renderWishlist(wishlist.getWishlist());
}

// Upcoming page initialization
async function initUpcomingPage() {
    document.body.id = 'upcoming-page';
    
    try {
        // Get upcoming games (next 6 months)
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 6);
        
        const params = {
            dates: `${today.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`,
            ordering: 'released',
            page_size: 20
        };
        
        const data = await api.fetchGames(params);
        renderGames(data.results, 'games-container');
        
        // Add "No upcoming games" message if empty
        if (!data.results || data.results.length === 0) {
            document.getElementById('games-container').innerHTML = `
                <div class="empty-state">
                    <h3>No upcoming releases found</h3>
                    <p>Check back later for new announcements</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load upcoming games:', error);
        document.getElementById('games-container').innerHTML = `
            <div class="error-container">
                <h3>Failed to load upcoming games</h3>
                <p>Please try again later.</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Search handler
async function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    try {
        const data = await api.searchGames(query);
        renderGames(data.results, 'games-container');
        
        // Show "no results" message
        if (!data.results || data.results.length === 0) {
            document.getElementById('games-container').innerHTML = `
                <div class="empty-state">
                    <h3>No games found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search failed:', error);
        document.getElementById('games-container').innerHTML = `
            <div class="error-container">
                <h3>Search failed</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Update wishlist button state
function updateWishlistButton(game) {
    const wishlist = new Wishlist();
    const btn = document.getElementById('wishlist-btn');
    
    if (!btn) return;
    
    if (wishlist.isInWishlist(game.id)) {
        btn.classList.add('active');
        btn.innerHTML = '<span>❤️</span> Added to Wishlist';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>❤️</span> Add to Wishlist';
    }
    
    btn.dataset.gameId = game.id;
    btn.dataset.gameName = game.name;
    btn.dataset.gameImage = game.background_image || '';
}

// Filter loading functions (simplified)
function loadPlatformFilters() {
    const platforms = [
        { id: 1, name: 'PC' },
        { id: 2, name: 'PlayStation' },
        { id: 3, name: 'Xbox' },
        { id: 4, name: 'Nintendo' },
        { id: 5, name: 'Mobile' }
    ];
    
    const container = document.getElementById('platform-filters');
    if (!container) return;
    
    container.innerHTML = platforms.map(p => `
        <label>
            <input type="checkbox" data-platform="${p.id}"> ${p.name}
        </label>
    `).join('');
}

function loadGenreFilters() {
    const genres = [
        { id: 4, name: 'Action' },
        { id: 51, name: 'RPG' },
        { id: 10, name: 'Strategy' },
        { id: 5, name: 'Shooter' },
        { id: 59, name: 'Indie' }
    ];
    
    const container = document.getElementById('genre-filters');
    if (!container) return;
    
    container.innerHTML = genres.map(g => `
        <label>
            <input type="checkbox" data-genre="${g.id}"> ${g.name}
        </label>
    `).join('');
}

// ==========================================
// DEALS PAGE
// ==========================================
async function initDealsPage() {
    const container = document.getElementById('deals-container');
    const storeFilter = document.getElementById('store-filter');
    
    // Load stores for filter
    const stores = await api.getStores();
    if (storeFilter && stores.length > 0) {
        storeFilter.innerHTML = '<option value="">All Stores</option>' + 
            stores.map(s => `<option value="${s.storeID}">${s.storeName}</option>`).join('');
    }
    
    // Load initial deals
    await loadDeals();
    
    // Setup filter listeners
    storeFilter?.addEventListener('change', loadDeals);
    document.getElementById('sort-filter')?.addEventListener('change', loadDeals);
}

async function loadDeals() {
    const container = document.getElementById('deals-container');
    const storeFilter = document.getElementById('store-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><p>Loading deals...</p></div>';
    
    try {
        const storeID = storeFilter?.value || null;
        let deals = await api.getCurrentDeals(storeID);
        
        // Sort deals
        const sortBy = sortFilter?.value || 'deal';
        if (sortBy === 'price') {
            deals.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
        } else if (sortBy === 'savings') {
            deals.sort((a, b) => parseFloat(b.savings) - parseFloat(a.savings));
        }
        
        renderDeals(deals, 'deals-container');
    } catch (error) {
        console.error('Failed to load deals:', error);
        container.innerHTML = `
            <div class="error-container">
                <h3>Failed to load deals</h3>
                <p>Please try again later.</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// ==========================================
// FREE GAMES PAGE
// ==========================================
async function initFreeGamesPage() {
    // Load initial free games
    await loadFreeGames();
    
    // Setup category filter listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            await loadFreeGames(category);
        });
    });
}

async function loadFreeGames(category = null) {
    const container = document.getElementById('free-games-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><p>Loading free games...</p></div>';
    
    try {
        const games = await api.getFreeToPlayGames(category);
        renderFreeGames(games, 'free-games-container');
    } catch (error) {
        console.error('Failed to load free games:', error);
        container.innerHTML = `
            <div class="error-container">
                <h3>Failed to load free games</h3>
                <p>Please try again later.</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// ==========================================
// COMPARISON PAGE
// ==========================================
async function initComparisonPage() {
    // Setup search functionality
    const searchInput = document.getElementById('compare-search');
    const searchBtn = document.getElementById('compare-search-btn');
    const searchResults = document.getElementById('search-results');
    
    searchBtn?.addEventListener('click', async () => {
        const query = searchInput?.value.trim();
        if (!query) return;
        
        searchResults.innerHTML = '<p>Searching...</p>';
        
        try {
            const data = await api.searchGames(query);
            if (data.results && data.results.length > 0) {
                searchResults.innerHTML = data.results.slice(0, 5).map(game => `
                    <div class="search-result-item" data-game-id="${game.id}">
                        <img src="${game.background_image || 'https://via.placeholder.com/50x50'}" alt="${game.name}">
                        <span>${game.name}</span>
                        <button class="btn-small add-to-compare">Add</button>
                    </div>
                `).join('');
                
                // Add click handlers
                searchResults.querySelectorAll('.add-to-compare').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const item = e.target.closest('.search-result-item');
                        const gameId = item.dataset.gameId;
                        const game = await api.getGameDetails(gameId);
                        
                        const result = gameComparison.addGame(game);
                        if (result.success) {
                            renderComparisonSlot(game, result.slot);
                            updateComparisonTable();
                            searchResults.innerHTML = '';
                            searchInput.value = '';
                        } else {
                            alert(result.message);
                        }
                    });
                });
            } else {
                searchResults.innerHTML = '<p>No games found</p>';
            }
        } catch (error) {
            searchResults.innerHTML = '<p>Search failed. Try again.</p>';
        }
    });
    
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn?.click();
    });
    
    // Setup slot removal handlers
    document.querySelectorAll('.comparison-slot').forEach((slot, index) => {
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-game')) {
                gameComparison.removeGame(index);
                slot.innerHTML = `
                    <div class="slot-empty">
                        <span>+</span>
                        <p>Add Game</p>
                    </div>
                `;
                updateComparisonTable();
            }
        });
    });
}

function updateComparisonTable() {
    const tableWrapper = document.getElementById('comparison-table');
    const comparisonData = gameComparison.getComparisonData();
    
    if (!comparisonData || comparisonData.games.length < 2) {
        tableWrapper.style.display = 'none';
        return;
    }
    
    tableWrapper.style.display = 'block';
    renderComparisonTable(comparisonData);
}
