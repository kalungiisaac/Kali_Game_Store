// api.js
// API Key - Works with both Vite and Live Server
const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RAWG_API_KEY) 
    || 'd2663c76d7194a21821130c805530d61';
const BASE_URL = 'https://api.rawg.io/api';
const PROXY_URL = 'http://localhost:3001/igdb'; // IGDB proxy endpoint

// YouTube API for trailers
const YOUTUBE_API_KEY = 'AIzaSyAa8yy0GdcGPHdtD083HiGGx_S0vMPScDM'; // Free tier key
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Additional API endpoints (FREE - No API key required)
const CHEAPSHARK_URL = 'https://www.cheapshark.com/api/1.0';
const STEAM_URL = 'https://store.steampowered.com/api';
const STEAMSPY_URL = 'https://steamspy.com/api.php';

// Check if API key is configured
const isApiKeyConfigured = API_KEY && API_KEY !== 'YOUR_RAWG_KEY' && API_KEY.length > 10;

// Mock data for when API is not available
const MOCK_GAMES = [
    { id: 1, name: 'The Witcher 3: Wild Hunt', released: '2015-05-18', rating: 4.66, background_image: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6f2f85.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation' } }], genres: [{ name: 'RPG' }, { name: 'Action' }] },
    { id: 2, name: 'Grand Theft Auto V', released: '2013-09-17', rating: 4.47, background_image: 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'Xbox' } }], genres: [{ name: 'Action' }, { name: 'Adventure' }] },
    { id: 3, name: 'Portal 2', released: '2011-04-18', rating: 4.61, background_image: 'https://media.rawg.io/media/games/328/3283617cb7d75d67257fc58339188571.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation' } }], genres: [{ name: 'Puzzle' }] },
    { id: 4, name: 'Red Dead Redemption 2', released: '2018-10-26', rating: 4.59, background_image: 'https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'Xbox' } }], genres: [{ name: 'Action' }, { name: 'Adventure' }] },
    { id: 5, name: 'God of War (2018)', released: '2018-04-20', rating: 4.58, background_image: 'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation' } }], genres: [{ name: 'Action' }, { name: 'Adventure' }] },
    { id: 6, name: 'Elden Ring', released: '2022-02-25', rating: 4.45, background_image: 'https://media.rawg.io/media/games/b29/b294fdd866dcdb643e7bab370a552855.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation' } }], genres: [{ name: 'RPG' }, { name: 'Action' }] },
    { id: 7, name: 'Cyberpunk 2077', released: '2020-12-10', rating: 4.15, background_image: 'https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'Xbox' } }], genres: [{ name: 'RPG' }, { name: 'Action' }] },
    { id: 8, name: 'Hades', released: '2020-09-17', rating: 4.52, background_image: 'https://media.rawg.io/media/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg', parent_platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'Nintendo' } }], genres: [{ name: 'Action' }, { name: 'Indie' }] },
];

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
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('API key is invalid or missing. Using mock data.');
                    return null;
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Fetch games with optional parameters
    async fetchGames(params = {}) {
        // Return mock data if API key is not configured
        if (!isApiKeyConfigured) {
            console.warn('RAWG API key not configured. Using demo data. Get your free API key at https://rawg.io/apidocs');
            return { results: MOCK_GAMES, count: MOCK_GAMES.length };
        }
        
        const queryParams = new URLSearchParams({
            key: API_KEY,
            page_size: params.page_size || 20,
            ...params
        });
        
        const url = `${BASE_URL}/games?${queryParams}`;
        try {
            const data = await this.fetchWithRateLimit(url);
            if (!data) return { results: MOCK_GAMES, count: MOCK_GAMES.length };
            return data;
        } catch (error) {
            console.warn('API failed, using mock data:', error);
            return { results: MOCK_GAMES, count: MOCK_GAMES.length };
        }
    }

    // Search games by query
    async searchGames(query) {
        // Return filtered mock data if API key is not configured
        if (!isApiKeyConfigured) {
            const filtered = MOCK_GAMES.filter(g => 
                g.name.toLowerCase().includes(query.toLowerCase())
            );
            return { results: filtered, count: filtered.length };
        }
        
        const queryParams = new URLSearchParams({
            key: API_KEY,
            search: query,
            page_size: 20
        });
        
        const url = `${BASE_URL}/games?${queryParams}`;
        try {
            const data = await this.fetchWithRateLimit(url);
            if (!data) {
                const filtered = MOCK_GAMES.filter(g => 
                    g.name.toLowerCase().includes(query.toLowerCase())
                );
                return { results: filtered, count: filtered.length };
            }
            return data;
        } catch (error) {
            const filtered = MOCK_GAMES.filter(g => 
                g.name.toLowerCase().includes(query.toLowerCase())
            );
            return { results: filtered, count: filtered.length };
        }
    }

    // Get detailed game information
    async getGameDetails(id) {
        // Return mock detail if API key is not configured
        if (!isApiKeyConfigured) {
            const mockGame = MOCK_GAMES.find(g => g.id === parseInt(id));
            if (mockGame) {
                return {
                    ...mockGame,
                    description_raw: `${mockGame.name} is an amazing game that has captivated millions of players worldwide. Experience incredible gameplay, stunning graphics, and an unforgettable story.`,
                    developers: [{ name: 'Demo Studio' }],
                    publishers: [{ name: 'Demo Publisher' }],
                    genres: [{ name: 'Action' }, { name: 'Adventure' }],
                    platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation 5' } }]
                };
            }
        }
        
        const url = `${BASE_URL}/games/${id}?key=${API_KEY}`;
        try {
            const data = await this.fetchWithRateLimit(url);
            if (!data) {
                const mockGame = MOCK_GAMES.find(g => g.id === parseInt(id)) || MOCK_GAMES[0];
                return {
                    ...mockGame,
                    description_raw: `${mockGame.name} is an amazing game.`,
                };
            }
            return data;
        } catch (error) {
            const mockGame = MOCK_GAMES.find(g => g.id === parseInt(id)) || MOCK_GAMES[0];
            return {
                ...mockGame,
                description_raw: `${mockGame.name} is an amazing game.`,
            };
        }
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
    // CHEAPSHARK API - Game Deals (FREE)
    // ==========================================
    
    // Search for game deals
    async searchDeals(gameName) {
        try {
            const url = `${CHEAPSHARK_URL}/deals?title=${encodeURIComponent(gameName)}&pageSize=10`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('CheapShark API error');
            return await response.json();
        } catch (error) {
            console.error('CheapShark deals error:', error);
            return [];
        }
    }

    // Get current deals/sales
    async getCurrentDeals(storeID = null, pageNumber = 0) {
        try {
            let url = `${CHEAPSHARK_URL}/deals?pageNumber=${pageNumber}&pageSize=20&onSale=1`;
            if (storeID) url += `&storeID=${storeID}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('CheapShark API error');
            return await response.json();
        } catch (error) {
            console.error('CheapShark current deals error:', error);
            return [];
        }
    }

    // Get list of stores (Steam, GOG, Epic, etc.)
    async getStores() {
        try {
            const response = await fetch(`${CHEAPSHARK_URL}/stores`);
            if (!response.ok) throw new Error('CheapShark stores error');
            return await response.json();
        } catch (error) {
            console.error('CheapShark stores error:', error);
            return [];
        }
    }

    // Get game info with all deals across stores
    async getGameDeals(gameId) {
        try {
            const url = `${CHEAPSHARK_URL}/games?id=${gameId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('CheapShark game error');
            return await response.json();
        } catch (error) {
            console.error('CheapShark game deals error:', error);
            return null;
        }
    }

    // Search games on CheapShark
    async cheapSharkSearch(title) {
        try {
            const url = `${CHEAPSHARK_URL}/games?title=${encodeURIComponent(title)}&limit=10`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('CheapShark search error');
            return await response.json();
        } catch (error) {
            console.error('CheapShark search error:', error);
            return [];
        }
    }

    // ==========================================
    // STEAM STORE API (FREE - No key needed)
    // ==========================================

    // Get Steam app details
    async getSteamAppDetails(appId) {
        try {
            // Using a CORS proxy for Steam API
            const url = `${STEAM_URL}/appdetails?appids=${appId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Steam API error');
            const data = await response.json();
            return data[appId]?.success ? data[appId].data : null;
        } catch (error) {
            console.error('Steam app details error:', error);
            return null;
        }
    }

    // ==========================================
    // STEAMSPY API - Player Statistics (FREE)
    // ==========================================

    // Get game stats from SteamSpy
    async getSteamSpyData(appId) {
        try {
            const url = `${STEAMSPY_URL}?request=appdetails&appid=${appId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('SteamSpy API error');
            return await response.json();
        } catch (error) {
            console.error('SteamSpy error:', error);
            return null;
        }
    }

    // Get top games from SteamSpy
    async getTopSteamGames() {
        try {
            const url = `${STEAMSPY_URL}?request=top100in2weeks`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('SteamSpy API error');
            return await response.json();
        } catch (error) {
            console.error('SteamSpy top games error:', error);
            return {};
        }
    }

    // ==========================================
    // FREE-TO-GAME API - Free Games (FREE)
    // ==========================================

    // Get all free-to-play games
    async getFreeToPlayGames(category = null, platform = 'all') {
        try {
            let url = `https://www.freetogame.com/api/games?platform=${platform}`;
            if (category) url += `&category=${category}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('FreeToGame API error');
            return await response.json();
        } catch (error) {
            console.error('FreeToGame error:', error);
            // Return mock free games
            return [
                { id: 1, title: 'Fortnite', genre: 'Battle Royale', platform: 'PC', thumbnail: 'https://www.freetogame.com/g/1/thumbnail.jpg' },
                { id: 2, title: 'League of Legends', genre: 'MOBA', platform: 'PC', thumbnail: 'https://www.freetogame.com/g/2/thumbnail.jpg' },
                { id: 3, title: 'Valorant', genre: 'Shooter', platform: 'PC', thumbnail: 'https://www.freetogame.com/g/3/thumbnail.jpg' },
            ];
        }
    }

    // Get single free game details
    async getFreeGameDetails(gameId) {
        try {
            const url = `https://www.freetogame.com/api/game?id=${gameId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('FreeToGame API error');
            return await response.json();
        } catch (error) {
            console.error('FreeToGame details error:', error);
            return null;
        }
    }

    // ==========================================
    // COMBINED/ENHANCED METHODS
    // ==========================================

    // Get comprehensive game data from multiple sources
    async getFullGameData(gameName, rawgId = null) {
        const results = {
            basic: null,
            deals: [],
            steamData: null,
            freeToPlay: null
        };

        try {
            // Get basic data from RAWG
            if (rawgId) {
                results.basic = await this.getGameDetails(rawgId);
            }

            // Get deals from CheapShark
            results.deals = await this.searchDeals(gameName);

            // Check if it's free-to-play
            const freeGames = await this.getFreeToPlayGames();
            results.freeToPlay = freeGames.find(g => 
                g.title.toLowerCase().includes(gameName.toLowerCase())
            );

        } catch (error) {
            console.error('Full game data error:', error);
        }

        return results;
    }

    // Get best price for a game across all stores
    async getBestPrice(gameName) {
        try {
            const deals = await this.searchDeals(gameName);
            if (deals.length === 0) return null;

            // Sort by sale price
            const sorted = deals.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
            return sorted[0];
        } catch (error) {
            console.error('Best price error:', error);
            return null;
        }
    }

    // Get trending/popular games
    async getTrendingGames() {
        try {
            // Combine data from multiple sources
            const [rawgGames, deals, freeGames] = await Promise.all([
                this.fetchGames({ ordering: '-rating', page_size: 10 }),
                this.getCurrentDeals(),
                this.getFreeToPlayGames()
            ]);

            return {
                topRated: rawgGames.results || [],
                onSale: deals.slice(0, 10),
                freeToPlay: freeGames.slice(0, 10)
            };
        } catch (error) {
            console.error('Trending games error:', error);
            return { topRated: [], onSale: [], freeToPlay: [] };
        }
    }

    // ==========================================
    // SIMILAR GAME RECOMMENDATIONS (RAWG API)
    // ==========================================

    // Get similar games based on a game's series
    async getSimilarGames(gameId) {
        try {
            const url = `${BASE_URL}/games/${gameId}/game-series?key=${API_KEY}&page_size=6`;
            const data = await this.fetchWithRateLimit(url);
            return data?.results || [];
        } catch (error) {
            console.error('Similar games error:', error);
            return [];
        }
    }

    // Get games by same developer
    async getGamesByDeveloper(developerId) {
        try {
            const url = `${BASE_URL}/games?key=${API_KEY}&developers=${developerId}&page_size=6`;
            const data = await this.fetchWithRateLimit(url);
            return data?.results || [];
        } catch (error) {
            console.error('Developer games error:', error);
            return [];
        }
    }

    // Get games by genre
    async getGamesByGenre(genreId, excludeGameId = null) {
        try {
            let url = `${BASE_URL}/games?key=${API_KEY}&genres=${genreId}&page_size=10&ordering=-rating`;
            const data = await this.fetchWithRateLimit(url);
            let results = data?.results || [];
            
            // Exclude current game if specified
            if (excludeGameId) {
                results = results.filter(g => g.id !== parseInt(excludeGameId));
            }
            
            return results.slice(0, 6);
        } catch (error) {
            console.error('Genre games error:', error);
            return [];
        }
    }

    // Get recommendations based on game (combines similar + genre-based)
    async getRecommendations(gameId) {
        try {
            // Get game details first
            const game = await this.getGameDetails(gameId);
            if (!game) return [];

            // Get similar games from series
            const similarGames = await this.getSimilarGames(gameId);

            // If we have enough similar games, return them
            if (similarGames.length >= 4) {
                return similarGames;
            }

            // Otherwise, supplement with genre-based recommendations
            if (game.genres && game.genres.length > 0) {
                const genreId = game.genres[0].id;
                const genreGames = await this.getGamesByGenre(genreId, gameId);
                
                // Combine and deduplicate
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
        } catch (error) {
            console.error('Recommendations error:', error);
            return [];
        }
    }

    // ==========================================
    // PLATFORM AND GENRE ENDPOINTS
    // ==========================================

    // Get list of all platforms
    async getPlatforms() {
        try {
            const url = `${BASE_URL}/platforms?key=${API_KEY}&page_size=20`;
            const data = await this.fetchWithRateLimit(url);
            return data?.results || [];
        } catch (error) {
            console.error('Platforms error:', error);
            return [];
        }
    }

    // Get list of all genres
    async getGenres() {
        try {
            const url = `${BASE_URL}/genres?key=${API_KEY}`;
            const data = await this.fetchWithRateLimit(url);
            return data?.results || [];
        } catch (error) {
            console.error('Genres error:', error);
            return [];
        }
    }

    // Fetch games with filters
    async fetchGamesWithFilters(filters = {}) {
        try {
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
        } catch (error) {
            console.error('Filtered games error:', error);
            return { results: [], count: 0 };
        }
    }

    // Get YouTube trailer for a game
    async getGameTrailer(gameName) {
        try {
            // First try RAWG's own movie/trailer endpoint
            const gameData = await this.searchGames(gameName);
            if (gameData.results && gameData.results[0]) {
                const gameId = gameData.results[0].id;
                const movieUrl = `${BASE_URL}/games/${gameId}/movies?key=${API_KEY}`;
                const movieData = await this.fetchWithRateLimit(movieUrl);
                
                if (movieData && movieData.results && movieData.results.length > 0) {
                    // RAWG has trailers - return the video URL
                    const trailer = movieData.results[0];
                    return {
                        source: 'rawg',
                        id: trailer.id,
                        name: trailer.name,
                        preview: trailer.preview,
                        videoUrl: trailer.data?.max || trailer.data?.['480'] || null
                    };
                }
            }
            
            // Fallback to YouTube search
            const searchQuery = encodeURIComponent(`${gameName} official game trailer`);
            const ytUrl = `${YOUTUBE_API_URL}?part=snippet&q=${searchQuery}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
            
            const response = await fetch(ytUrl);
            if (!response.ok) {
                // If YouTube API fails, return a search link
                return {
                    source: 'youtube-search',
                    searchUrl: `https://www.youtube.com/results?search_query=${searchQuery}`
                };
            }
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                return {
                    source: 'youtube',
                    id: video.id.videoId,
                    title: video.snippet.title,
                    thumbnail: video.snippet.thumbnails.high.url,
                    embedUrl: `https://www.youtube.com/embed/${video.id.videoId}?autoplay=1`
                };
            }
            
            return null;
        } catch (error) {
            console.error('Trailer fetch error:', error);
            // Return YouTube search as fallback
            return {
                source: 'youtube-search',
                searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' trailer')}`
            };
        }
    }
}

export default new Api();
