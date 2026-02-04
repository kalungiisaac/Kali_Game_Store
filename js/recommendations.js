// recommendations.js - Similar game recommendation algorithm
import api from './api.js';

class RecommendationEngine {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Get cached data if valid
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // Set cache
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Get recommendations for a game
    async getRecommendationsForGame(gameId) {
        const cacheKey = `recommendations_${gameId}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const recommendations = await api.getRecommendations(gameId);
            this.setCache(cacheKey, recommendations);
            return recommendations;
        } catch (error) {
            console.error('Recommendation error:', error);
            return [];
        }
    }

    // Get similar games based on multiple factors
    async getSimilarGames(game) {
        if (!game) return [];

        const cacheKey = `similar_${game.id}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const results = [];
            
            // Get games from same series
            const seriesGames = await api.getSimilarGames(game.id);
            results.push(...seriesGames);

            // Get games by same genre (if we don't have enough)
            if (results.length < 6 && game.genres?.length > 0) {
                for (const genre of game.genres.slice(0, 2)) {
                    const genreGames = await api.getGamesByGenre(genre.id, game.id);
                    for (const g of genreGames) {
                        if (!results.find(r => r.id === g.id) && g.id !== game.id) {
                            results.push(g);
                        }
                        if (results.length >= 6) break;
                    }
                    if (results.length >= 6) break;
                }
            }

            this.setCache(cacheKey, results.slice(0, 6));
            return results.slice(0, 6);
        } catch (error) {
            console.error('Similar games error:', error);
            return [];
        }
    }

    // Get personalized recommendations based on wishlist
    async getPersonalizedRecommendations(wishlist) {
        if (!wishlist || wishlist.length === 0) return [];

        try {
            const allRecommendations = [];
            const seenIds = new Set(wishlist.map(g => g.id));

            // Get recommendations based on each wishlisted game
            for (const game of wishlist.slice(0, 3)) {
                const recs = await this.getRecommendationsForGame(game.id);
                for (const rec of recs) {
                    if (!seenIds.has(rec.id)) {
                        allRecommendations.push(rec);
                        seenIds.add(rec.id);
                    }
                }
            }

            // Sort by rating and return top results
            return allRecommendations
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 10);
        } catch (error) {
            console.error('Personalized recommendations error:', error);
            return [];
        }
    }

    // Calculate similarity score between two games
    calculateSimilarityScore(game1, game2) {
        let score = 0;

        // Genre match (up to 30 points)
        const genres1 = new Set(game1.genres?.map(g => g.id) || []);
        const genres2 = new Set(game2.genres?.map(g => g.id) || []);
        const genreOverlap = [...genres1].filter(g => genres2.has(g)).length;
        score += Math.min(genreOverlap * 10, 30);

        // Platform match (up to 20 points)
        const platforms1 = new Set(game1.parent_platforms?.map(p => p.platform.id) || []);
        const platforms2 = new Set(game2.parent_platforms?.map(p => p.platform.id) || []);
        const platformOverlap = [...platforms1].filter(p => platforms2.has(p)).length;
        score += Math.min(platformOverlap * 5, 20);

        // Rating similarity (up to 20 points)
        const rating1 = game1.rating || 0;
        const rating2 = game2.rating || 0;
        const ratingDiff = Math.abs(rating1 - rating2);
        score += Math.max(0, 20 - ratingDiff * 10);

        // Release year similarity (up to 15 points)
        const year1 = new Date(game1.released).getFullYear();
        const year2 = new Date(game2.released).getFullYear();
        const yearDiff = Math.abs(year1 - year2);
        score += Math.max(0, 15 - yearDiff);

        // Metacritic similarity (up to 15 points)
        const meta1 = game1.metacritic || 0;
        const meta2 = game2.metacritic || 0;
        const metaDiff = Math.abs(meta1 - meta2);
        score += Math.max(0, 15 - metaDiff / 5);

        return score;
    }

    // Rank games by similarity to a reference game
    rankBySimilarity(referenceGame, games) {
        return games
            .map(game => ({
                ...game,
                similarityScore: this.calculateSimilarityScore(referenceGame, game)
            }))
            .sort((a, b) => b.similarityScore - a.similarityScore);
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;
