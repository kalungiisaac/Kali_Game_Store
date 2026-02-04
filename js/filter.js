// filter.js - Game filtering and search logic
import api from './api.js';

class GameFilter {
    constructor() {
        this.currentFilters = {
            platforms: [],
            genres: [],
            ordering: '-rating',
            search: ''
        };
        this.allGames = [];
    }

    // Set filter values
    setFilter(filterType, value) {
        if (Array.isArray(this.currentFilters[filterType])) {
            if (this.currentFilters[filterType].includes(value)) {
                this.currentFilters[filterType] = this.currentFilters[filterType].filter(v => v !== value);
            } else {
                this.currentFilters[filterType].push(value);
            }
        } else {
            this.currentFilters[filterType] = value;
        }
    }

    // Clear all filters
    clearFilters() {
        this.currentFilters = {
            platforms: [],
            genres: [],
            ordering: '-rating',
            search: ''
        };
    }

    // Get current filters
    getFilters() {
        return { ...this.currentFilters };
    }

    // Build API params from filters
    buildFilterParams() {
        const params = {};
        
        if (this.currentFilters.platforms.length > 0) {
            params.platforms = this.currentFilters.platforms.join(',');
        }
        
        if (this.currentFilters.genres.length > 0) {
            params.genres = this.currentFilters.genres.join(',');
        }
        
        if (this.currentFilters.ordering) {
            params.ordering = this.currentFilters.ordering;
        }
        
        if (this.currentFilters.search) {
            params.search = this.currentFilters.search;
        }
        
        return params;
    }

    // Fetch filtered games from API
    async fetchFilteredGames() {
        const params = this.buildFilterParams();
        return await api.fetchGamesWithFilters(params);
    }

    // Client-side filter for already loaded games
    filterGames(games) {
        let filtered = [...games];

        // Filter by platforms
        if (this.currentFilters.platforms.length > 0) {
            filtered = filtered.filter(game => {
                const gamePlatforms = game.parent_platforms?.map(p => p.platform.id) || [];
                return this.currentFilters.platforms.some(pid => gamePlatforms.includes(parseInt(pid)));
            });
        }

        // Filter by genres
        if (this.currentFilters.genres.length > 0) {
            filtered = filtered.filter(game => {
                const gameGenres = game.genres?.map(g => g.id) || [];
                return this.currentFilters.genres.some(gid => gameGenres.includes(parseInt(gid)));
            });
        }

        // Filter by search term
        if (this.currentFilters.search) {
            const searchLower = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(game => 
                game.name.toLowerCase().includes(searchLower)
            );
        }

        // Sort games
        filtered = this.sortGames(filtered, this.currentFilters.ordering);

        return filtered;
    }

    // Sort games by ordering
    sortGames(games, ordering) {
        const sorted = [...games];
        
        switch (ordering) {
            case '-rating':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'rating':
                sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
                break;
            case '-released':
                sorted.sort((a, b) => new Date(b.released || 0) - new Date(a.released || 0));
                break;
            case 'released':
                sorted.sort((a, b) => new Date(a.released || 0) - new Date(b.released || 0));
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case '-name':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case '-metacritic':
                sorted.sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0));
                break;
            default:
                break;
        }
        
        return sorted;
    }

    // Search games by query
    async searchGames(query) {
        this.currentFilters.search = query;
        return await api.searchGames(query);
    }

    // Get available platform options
    async getPlatformOptions() {
        const platforms = await api.getPlatforms();
        return platforms.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug
        }));
    }

    // Get available genre options
    async getGenreOptions() {
        const genres = await api.getGenres();
        return genres.map(g => ({
            id: g.id,
            name: g.name,
            slug: g.slug
        }));
    }
}

// Export singleton instance
export const gameFilter = new GameFilter();
export default gameFilter;
