// wishlist.js
class Wishlist {
    constructor() {
        this.key = 'gameLibrary_wishlist';
        this.wishlist = JSON.parse(localStorage.getItem(this.key) || '[]');
    }

    getWishlist() {
        return this.wishlist;
    }

    isInWishlist(gameId) {
        return this.wishlist.some(g => g.id === gameId);
    }

    addToWishlist(game) {
        if (!this.isInWishlist(game.id)) {
            this.wishlist.push(game);
            localStorage.setItem(this.key, JSON.stringify(this.wishlist));
            this.updateCount();
            return true;
        }
        return false;
    }

    removeFromWishlist(gameId) {
        this.wishlist = this.wishlist.filter(g => g.id !== gameId);
        localStorage.setItem(this.key, JSON.stringify(this.wishlist));
        this.updateCount();
        return true;
    }

    toggleWishlist(game) {
        if (this.isInWishlist(game.id)) {
            this.removeFromWishlist(game.id);
        } else {
            this.addToWishlist(game);
        }
        
        // Update UI immediately
        this.updateWishlistIndicators();
        this.updateCount();
    }

    updateCount() {
        const countElement = document.getElementById('wishlist-count');
        if (countElement) {
            countElement.textContent = `(${this.wishlist.length})`;
        }
        
        // Update empty state on wishlist page
        const emptyState = document.getElementById('empty-wishlist');
        if (emptyState) {
            emptyState.style.display = this.wishlist.length === 0 ? 'block' : 'none';
        }
    }

    updateWishlistIndicators() {
        // Update heart icons on game cards
        document.querySelectorAll('.heart').forEach(heart => {
            const gameId = parseInt(heart.closest('.game-card').dataset.id);
            heart.classList.toggle('active', this.isInWishlist(gameId));
        });
        
        // Update detail page button
        const detailBtn = document.getElementById('wishlist-btn');
        if (detailBtn) {
            const gameId = parseInt(detailBtn.dataset.gameId);
            if (this.isInWishlist(gameId)) {
                detailBtn.classList.add('active');
                detailBtn.innerHTML = '<span>❤️</span> Added to Wishlist';
            } else {
                detailBtn.classList.remove('active');
                detailBtn.innerHTML = '<span>❤️</span> Add to Wishlist';
            }
        }
    }

    init() {
        this.updateCount();
        this.updateWishlistIndicators();
        
        // Add global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.closest('.wishlist-btn')) {
                const btn = e.target.closest('.wishlist-btn');
                const gameId = parseInt(btn.dataset.gameId);
                const game = {
                    id: gameId,
                    name: btn.dataset.gameName,
                    background_image: btn.dataset.gameImage
                };
                
                this.toggleWishlist(game);
            }
            
            // Handle heart icon clicks on game cards
            if (e.target.closest('.heart')) {
                e.preventDefault();
                e.stopPropagation();
                const heart = e.target.closest('.heart');
                const card = heart.closest('.game-card');
                const gameId = parseInt(card.dataset.id);
                const game = {
                    id: gameId,
                    name: card.dataset.name,
                    background_image: card.dataset.image
                };
                
                this.toggleWishlist(game);
            }
        });
    }
}

export { Wishlist };
