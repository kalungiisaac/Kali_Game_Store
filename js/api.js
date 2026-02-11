// api.js
// API Key - Works with both Vite and Live Server
const API_KEY = 'd2663c76d7194a21821130c805530d61';
const BASE_URL = 'https://api.rawg.io/api';

// IGDB proxy — detect environment safely
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const PROXY_URL = isDev ? 'http://localhost:3001/igdb' : '/igdb';

// YouTube API for trailers
const YOUTUBE_API_KEY = 'AIzaSyAa8yy0GdcGPHdtD083HiGGx_S0vMPScDM'; 
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Rate limiting configuration
const RATE_LIMIT = {
    MAX_REQUESTS: 40,
    PER_MINUTE: 60000,
    lastRequests: []
};

class Api {
    constructor() {
        this.initializeRateLimiter();
    }

    initializeRateLimiter() {
        setInterval(() => {
            const now = Date.now();
            RATE_LIMIT.lastRequests = RATE_LIMIT.lastRequests.filter(
                timestamp => now - timestamp < RATE_LIMIT.PER_MINUTE
            );
        }, 30000);
    }

    async fetchWithRateLimit(url) {
        const now = Date.now();
        
        RATE_LIMIT.lastRequests = RATE_LIMIT.lastRequests.filter(
            ts => now - ts < RATE_LIMIT.PER_MINUTE
        );
        
        if (RATE_LIMIT.lastRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
            const waitTime = RATE_LIMIT.PER_MINUTE - (now - RATE_LIMIT.lastRequests[0]);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        RATE_LIMIT.lastRequests.push(Date.now());
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }

    // Fetch games with optional parameters
    async fetchGames(params = {}) {
        const queryParams = new URLSearchParams({
            key: API_KEY,
            page_size: params.page_size || 20,
            ...params
        });
        
        const url = `${BASE_URL}/games?${queryParams}`;
        const data = await this.fetchWithRateLimit(url);
        return data;
    }

    // Search games by query
    async searchGames(query) {
        const queryParams = new URLSearchParams({
            key: API_KEY,
            search: query,
            page_size: 20
        });
        
        const url = `${BASE_URL}/games?${queryParams}`;
        const data = await this.fetchWithRateLimit(url);
        return data;
    }

    // Get detailed game information
    async getGameDetails(id) {
        const url = `${BASE_URL}/games/${id}?key=${API_KEY}`;
        const data = await this.fetchWithRateLimit(url);
        return data;
    }

    // Get game screenshots
    async getGameScreenshots(id) {
        const url = `${BASE_URL}/games/${id}/screenshots?key=${API_KEY}`;
        const data = await this.fetchWithRateLimit(url);
        return data?.results || [];
    }

    // NEW: IGDB Integration
    async getIgdbGameDetails(gameName) {
        try {
            const query = `
                fields name, summary, storyline, first_release_date, 
                       genres.name, platforms.name, 
                       involved_companies.company.name,
                       screenshots.url, videos.video_id;
                where name ~ "${gameName}";
                limit 1;
            `;

            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`IGDB request failed: ${response.status}`);
            }

            const data = await response.json();
            return data[0] || null;
        } catch (error) {
            console.error('IGDB details error:', error);
            return null;
        }
    }

    // NEW: Enhanced game details with IGDB data
    async getEnhancedGameDetails(gameId) {
        try {
            // Get RAWG data first
            const rawgData = await this.getGameDetails(gameId);
            if (!rawgData) return null;

            // Get IGDB data using game name
            const igdbData = await this.getIgdbGameDetails(rawgData.name);
            
            // Merge data (prioritizing IGDB for richer content)
            return {
                ...rawgData,
                summary: igdbData?.summary || rawgData.description_raw,
                storyline: igdbData?.storyline,
                genres: igdbData?.genres?.map(g => g.name) || rawgData.genres?.map(g => g.name),
                developer: igdbData?.involved_companies
                    ?.filter(c => c.developer)
                    ?.map(c => c.company.name)
                    ?.join(', ') || rawgData.developers?.map(d => d.name).join(', '),
                publisher: igdbData?.involved_companies
                    ?.filter(c => c.publisher)
                    ?.map(c => c.company.name)
                    ?.join(', ') || rawgData.publishers?.map(p => p.name).join(', '),
                screenshots: igdbData?.screenshots?.map(s => ({
                    id: s.id,
                    url: s.url.replace('t_screenshot', 't_1080p')
                })) || rawgData.short_screenshots,
                videos: igdbData?.videos?.map(v => ({
                    id: v.video_id,
                    name: v.name
                })) || []
            };
        } catch (error) {
            console.error('Enhanced details error:', error);
            return this.getGameDetails(gameId); // Fallback to RAWG data
        }
    }

    // ==========================================
    // SIMILAR GAME RECOMMENDATIONS (RAWG API)
    // ==========================================

    // Get similar games based on a game's series
    async getSimilarGames(gameId) {
        const url = `${BASE_URL}/games/${gameId}/game-series?key=${API_KEY}&page_size=6`;
        const data = await this.fetchWithRateLimit(url);
        return data?.results || [];
    }

    // Get games by same developer
    async getGamesByDeveloper(developerId) {
        const url = `${BASE_URL}/games?key=${API_KEY}&developers=${developerId}&page_size=6`;
        const data = await this.fetchWithRateLimit(url);
        return data?.results || [];
    }

    // Get games by genre
    async getGamesByGenre(genreId, excludeGameId = null) {
        const url = `${BASE_URL}/games?key=${API_KEY}&genres=${genreId}&page_size=10&ordering=-rating`;
        const data = await this.fetchWithRateLimit(url);
        let results = data?.results || [];
        
        if (excludeGameId) {
            results = results.filter(g => g.id !== parseInt(excludeGameId));
        }
        
        return results.slice(0, 6);
    }

    // Get recommendations based on game (combines similar + genre-based)
    async getRecommendations(gameId) {
        const game = await this.getGameDetails(gameId);
        if (!game) return [];

        const similarGames = await this.getSimilarGames(gameId);
        if (similarGames.length >= 4) return similarGames;

        if (game.genres && game.genres.length > 0) {
            const genreId = game.genres[0].id;
            const genreGames = await this.getGamesByGenre(genreId, gameId);
            
            const combined = [...similarGames];
            for (const g of genreGames) {
                if (!combined.find(sg => sg.id === g.id) && g.id !== parseInt(gameId)) {
                    combined.push(g);
                }
                if (combined.length >= 6) break;
            }
            return combined;
        }

        return similarGames;
    }

    // ==========================================
    // PLATFORM AND GENRE ENDPOINTS
    // ==========================================

    // Get list of all platforms
    async getPlatforms() {
        const url = `${BASE_URL}/platforms?key=${API_KEY}&page_size=20`;
        const data = await this.fetchWithRateLimit(url);
        return data?.results || [];
    }

    // Get list of all genres
    async getGenres() {
        const url = `${BASE_URL}/genres?key=${API_KEY}`;
        const data = await this.fetchWithRateLimit(url);
        return data?.results || [];
    }

    // Fetch games with filters
    async fetchGamesWithFilters(filters = {}) {
        const params = {
            key: API_KEY,
            page_size: filters.page_size || 20,
        };

        if (filters.platforms) params.platforms = filters.platforms;
        if (filters.genres) params.genres = filters.genres;
        if (filters.ordering) params.ordering = filters.ordering;
        if (filters.search) params.search = filters.search;
        if (filters.dates) params.dates = filters.dates;
        if (filters.metacritic) params.metacritic = filters.metacritic;

        const queryParams = new URLSearchParams(params);
        const url = `${BASE_URL}/games?${queryParams}`;
        
        return await this.fetchWithRateLimit(url);
    }

    // Get trailer for a game — uses RAWG movies endpoint, then Piped API for YouTube embed
    async getGameTrailer(gameId, gameName) {
        try {
            // 1) Try RAWG's movie/trailer endpoint directly with the game ID
            const movieUrl = `${BASE_URL}/games/${gameId}/movies?key=${API_KEY}`;
            const movieData = await this.fetchWithRateLimit(movieUrl);
            
            if (movieData && movieData.results && movieData.results.length > 0) {
                const trailer = movieData.results[0];
                const videoUrl = trailer.data?.max || trailer.data?.['480'] || null;
                if (videoUrl) {
                    return {
                        source: 'rawg',
                        id: trailer.id,
                        name: trailer.name,
                        preview: trailer.preview,
                        videoUrl: videoUrl
                    };
                }
            }

            // 2) Search YouTube via Piped API (free, no key needed) to get a real video ID
            const searchQuery = `${gameName} official game trailer`;
            const videoId = await this.searchYouTubeVideoId(searchQuery);
            if (videoId) {
                return {
                    source: 'youtube',
                    videoId: videoId,
                    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
                };
            }

            // 3) Last resort — return search URL for manual link
            return {
                source: 'fallback',
                searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
            };
        } catch (error) {
            console.error('Trailer fetch error:', error);
            return {
                source: 'fallback',
                searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' trailer')}`
            };
        }
    }

    // Search for a YouTube video ID using free Piped API instances
    async searchYouTubeVideoId(query) {
        const pipedInstances = [
            'https://pipedapi.kavin.rocks',
            'https://pipedapi.adminforge.de',
            'https://api.piped.projectsegfault.com'
        ];

        for (const instance of pipedInstances) {
            try {
                const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
                const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
                if (!resp.ok) continue;
                const data = await resp.json();
                if (data.items && data.items.length > 0) {
                    // items[].url is like "/watch?v=VIDEO_ID"
                    const match = data.items[0].url?.match(/[?&]v=([^&]+)/);
                    if (match) return match[1];
                }
            } catch (e) {
                console.warn(`Piped instance ${instance} failed:`, e.message);
            }
        }
        return null;
    }
}

export default new Api();
