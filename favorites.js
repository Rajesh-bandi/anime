document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth
    Auth.init();
    
    // Check if user is logged in
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load favorites
    await loadFavorites();
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(searchInput.value);
    });
});

async function loadFavorites() {
    try {
        const response = await fetchWithAuth('/api/favorites');
        const data = await response.json();
        
        const favoritesGrid = document.getElementById('favoritesGrid');
        
        if (!data.success || !data.favorites || data.favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-heart-broken"></i>
                    <h3>No favorites yet</h3>
                    <p>Start adding anime to your favorites from the home page</p>
                    <a href="similar.html" class="btn btn-primary">Browse Anime</a>
                </div>
            `;
            return;
        }
        
        // Fetch anime details for each favorite
        const animeDetails = await Promise.all(
            data.favorites.map(animeId => 
                fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
                    .then(res => res.json())
                    .then(data => data.data)
                    .catch(() => null)
            )
        );
        
        // Filter out any null results
        const validAnime = animeDetails.filter(anime => anime !== null);
        
        if (validAnime.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-heart-broken"></i>
                    <h3>No favorites found</h3>
                    <p>We couldn't load your favorites. Please try again later.</p>
                </div>
            `;
            return;
        }
        
        // Display favorites
        favoritesGrid.innerHTML = '';
        validAnime.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'anime-card floating';
            
            const title = anime.title_english || anime.title || 'Unknown Title';
            const imageUrl = anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450/333/fff?text=No+Image';
            const score = anime.score ? anime.score.toFixed(1) : 'N/A';
            const type = anime.type || 'Unknown';
            
            animeCard.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <div class="anime-info">
                    <h3>${title}</h3>
                    <p>${type} • ⭐ ${score}</p>
                </div>
                <div class="anime-details">
                    <h3 class="detail-title">${title}</h3>
                    <button class="btn btn-danger remove-favorite" data-anime-id="${anime.mal_id}">
                        <i class="fas fa-heart-broken"></i> Remove
                    </button>
                </div>
                <a href="watch.html?title=${encodeURIComponent(title)}&season=1&episode=1" class="btn btn-primary watch-now-btn">Watch Now</a>
            `;
            
            favoritesGrid.appendChild(animeCard);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-favorite').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const animeId = button.dataset.animeId;
                await removeFavorite(animeId);
            });
        });
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        document.getElementById('favoritesGrid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading favorites</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function removeFavorite(animeId) {
    try {
        const response = await fetchWithAuth('/api/favorites/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ animeId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh the favorites list
            await loadFavorites();
        } else {
            throw new Error(data.message || 'Failed to remove favorite');
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        alert('Failed to remove favorite: ' + error.message);
    }
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(`http://localhost:5000${url}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        Auth.logout();
        throw new Error('Session expired');
    }
    
    return response;
}

function handleSearch(query) {
    if (query.length < 3) return;
    document.body.classList.add('page-transition');
    setTimeout(() => {
        window.location.href = `search.html?query=${encodeURIComponent(query)}`;
    }, 500);
}