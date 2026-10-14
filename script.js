const SUPABASE_URL = "https://tnllgluxyduoqrgjfxwv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GvdqXmfHY2l9TASrolBi4A_a6GGTe7M";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentSearchQuery = '';
let currentSearchType = 'artist';
let currentBatchOffset = 0;
const BATCH_LIMIT = 40; 
let allCurrentResults = [];
let searchAttemptMultiplier = 0;

function setSearchMode(mode) {
    currentSearchType = mode;
    const modeArtistBtn = document.getElementById('modeArtistBtn');
    const modeSongBtn = document.getElementById('modeSongBtn');
    const searchInput = document.getElementById('searchInput');

    if (mode === 'artist') {
        modeArtistBtn.classList.add('active');
        modeSongBtn.classList.remove('active');
        searchInput.placeholder = "Digite o nome do artista (ex: BTS, Coldplay)...";
    } else {
        modeSongBtn.classList.add('active');
        modeArtistBtn.classList.remove('active');
        searchInput.placeholder = "Digite o nome da música (ex: Butter, Yellow)...";
    }
}

async function checkUserSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentUser = session ? session.user : null;
        updateAuthUI();
    } catch(e) { 
        currentUser = null;
        updateAuthUI();
    }
}

function updateAuthUI() {
    const container = document.getElementById('authContainer');
    const savedSongsBtn = document.getElementById('mySavedSongsBtn');

    if (currentUser) {
        container.innerHTML = `<button class="btn btn-outline-success btn-sm rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal"><i class="fa-solid fa-user-check me-1"></i> ${currentUser.email.split('@')[0]} (Sair)</button>`;
        savedSongsBtn.classList.remove('d-none');
    } else {
        container.innerHTML = `<button class="btn btn-primary btn-sm rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#authModal"><i class="fa-solid fa-user me-1"></i> Entrar</button>`;
        savedSongsBtn.classList.add('d-none');
    }
}

document.getElementById('confirmLogoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateAuthUI();
    clearAuthInputs();
    bootstrap.Modal.getInstance(document.getElementById('logoutConfirmModal')).hide();
    showToast('Sessão encerrada com segurança.');
});

function clearAuthInputs() {
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
}

document.getElementById('authModal').addEventListener('hidden.bs.modal', () => {
    clearAuthInputs();
});

document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Recuperação de senha em desenvolvimento (em breve)!', 'fa-clock');
});

document.getElementById('supabaseLoginBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        showToast(error.message, 'fa-triangle-exclamation');
    } else {
        currentUser = data.user;
        updateAuthUI();
        clearAuthInputs();
        bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
        showToast('Login efetuado com sucesso!');
    }
});

document.getElementById('supabaseSignupBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        showToast(error.message, 'fa-triangle-exclamation');
    } else {
        clearAuthInputs();
        showToast('Conta criada! Verifique seu e-mail.');
    }
});

// Carrega músicas salvas do Supabase
document.getElementById('savedSongsModal').addEventListener('show.bs.modal', async () => {
    const container = document.getElementById('savedSongsListContainer');
    if (!currentUser) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-4"><p>Faça login para ver suas músicas salvas.</p></div>`;
        return;
    }

    container.innerHTML = `<div class="col-12 text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i><p class="small">Buscando faixas salvas...</p></div>`;

    const { data, error } = await supabaseClient
        .from('saved_songs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="col-12 text-center text-danger py-4"><p>Erro ao carregar: ${error.message}</p></div>`;
    } else if (data && data.length > 0) {
        let html = '';
        data.forEach((item) => {
            const safeTitle = item.song_title.replace(/'/g, "\\'");
            const safeArtist = item.artist_name.replace(/'/g, "\\'");
            const safeLyrics = (item.lyrics || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');

            html += `
                <div class="col-md-6" id="saved-card-${item.id}">
                    <div class="card song-card p-3 h-100 shadow-sm" onclick="pushSavedToSearch('${safeTitle}', '${safeArtist}', '${safeLyrics}')">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-success bg-opacity-10 text-success">Música Salva</span>
                                <button class="btn btn-sm btn-outline-danger border-0 p-1" onclick="event.stopPropagation(); deleteSavedSong('${item.id}')" title="Remover">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                            <h5 class="fw-bold mb-1 text-truncate text-light">${item.song_title}</h5>
                            <p class="text-muted small mb-0">Artista: ${item.artist_name}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="fa-solid fa-bookmark-slash fs-1 mb-3 text-secondary"></i>
                <h5>Nenhuma música salva ainda</h5>
                <p class="small">Busque por artistas ou faixas e clique em "Salvar Música" para adicioná-las aqui.</p>
            </div>
        `;
    }
});

function pushSavedToSearch(title, artist, lyrics) {
    const savedModalEl = document.getElementById('savedSongsModal');
    const savedModal = bootstrap.Modal.getInstance(savedModalEl);
    if (savedModal) savedModal.hide();

    setSearchMode('song');
    document.getElementById('searchInput').value = title;

    currentActiveSong = { title: title, artist: artist, lyrics: lyrics };
    
    document.getElementById('modalArtistName').innerText = artist;
    document.getElementById('modalSongTitle').innerText = title;
    document.getElementById('modalLyricsContent').innerText = lyrics || 'Nenhuma letra disponível.';
    
    document.getElementById('modalInspirationText').innerHTML = `
        A faixa <strong>"${title}"</strong> de <strong>${artist}</strong> expressa uma atmosfera marcante, combinando lirismo expressivo com arranjos marcantes. A obra explora temas profundos de identidade, emoção e momentos reflexivos da trajetória do artista.
    `;

    document.getElementById('searchBtn').click();

    setTimeout(() => {
        const songModal = new bootstrap.Modal(document.getElementById('songModal'));
        songModal.show();
    }, 300);
}

async function deleteSavedSong(id) {
    const { error } = await supabaseClient.from('saved_songs').delete().eq('id', id);
    if (error) {
        showToast('Erro ao remover música: ' + error.message, 'fa-triangle-exclamation');
    } else {
        const card = document.getElementById(`saved-card-${id}`);
        if (card) card.remove();
        showToast('Música removida dos salvos!');
    }
}

window.addEventListener('DOMContentLoaded', checkUserSession);

function showToast(message, icon = 'fa-check-circle') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = `<i class="fa-solid ${icon} text-success fs-5"></i><span class="small fw-medium">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

document.getElementById('searchBtn').addEventListener('click', async () => {
    currentSearchQuery = document.getElementById('searchInput').value.trim();
    const resultsSection = document.getElementById('resultsSection');
    
    if(!currentSearchQuery) {
        showToast('Digite o termo de busca.', 'fa-triangle-exclamation');
        return;
    }

    allCurrentResults = [];
    currentBatchOffset = 0;
    searchAttemptMultiplier = 0;
    resultsSection.innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i><p>Buscando na internet...</p></div>`;

    await fetchMoreSongsFromAPI();
});

async function fetchMoreSongsFromAPI() {
    const resultsSection = document.getElementById('resultsSection');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Buscando mais músicas...`;

    try {
        let url = '';
        if (currentSearchType === 'artist') {
            url = `https://itunes.apple.com/search?term=${encodeURIComponent(currentSearchQuery)}&entity=song&limit=${BATCH_LIMIT}&offset=${currentBatchOffset}`;
        } else {
            url = `https://itunes.apple.com/search?term=${encodeURIComponent(currentSearchQuery)}&entity=song&attribute=songTerm&limit=${BATCH_LIMIT}&offset=${currentBatchOffset}`;
        }

        let response = await fetch(url);
        let data = await response.json();

        if (currentSearchType === 'artist' && (!data || !data.results || data.results.length === 0) && searchAttemptMultiplier < 3) {
            searchAttemptMultiplier++;
            currentBatchOffset = 0;
            const queryVariations = [
                currentSearchQuery + ' album',
                currentSearchQuery + ' deluxe',
                currentSearchQuery + ' hits'
            ];
            let nextQuery = queryVariations[searchAttemptMultiplier - 1];
            response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(nextQuery)}&entity=song&limit=${BATCH_LIMIT}&offset=0`);
            data = await response.json();
        }

        if(data && data.results && data.results.length > 0) {
            const newSongs = data.results.map(item => ({
                title: item.trackName,
                artist: item.artistName
            }));

            let addedCount = 0;
            newSongs.forEach(newSong => {
                const exists = allCurrentResults.some(existing => 
                    existing.title.toLowerCase() === newSong.title.toLowerCase() && 
                    existing.artist.toLowerCase() === newSong.artist.toLowerCase()
                );
                if (!exists) {
                    allCurrentResults.push(newSong);
                    addedCount++;
                }
            });

            currentBatchOffset += BATCH_LIMIT;
            renderSongsList();

            if (addedCount > 0 && currentBatchOffset < 200) {
                loadMoreContainer.classList.remove('d-none');
                showToast(`${addedCount} músicas carregadas!`);
            } else {
                loadMoreContainer.classList.add('d-none');
                showToast('Todas as faixas disponíveis foram carregadas!');
            }
        } else {
            loadMoreContainer.classList.add('d-none');
            if (allCurrentResults.length === 0) {
                resultsSection.innerHTML = `
                    <div class="col-md-6 text-center py-5">
                        <div class="card p-4 shadow-sm border-secondary">
                            <i class="fa-solid fa-circle-exclamation text-warning fs-1 mb-3"></i>
                            <h5 class="fw-bold mb-2">Nenhum resultado encontrado</h5>
                            <p class="text-muted small mb-0">Não encontramos registros para "<strong>${currentSearchQuery}</strong>".</p>
                        </div>
                    </div>
                `;
            } else {
                showToast('Fim dos resultados para esta busca!');
            }
        }
    } catch (error) {
        loadMoreContainer.classList.add('d-none');
        showToast('Erro ao buscar novas faixas.', 'fa-triangle-exclamation');
    } finally {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = `<i class="fa-solid fa-rotate-right me-2"></i>Carregar mais músicas`;
    }
}

function renderSongsList() {
    const resultsSection = document.getElementById('resultsSection');
    let htmlContent = '';

    allCurrentResults.forEach((item, index) => {
        htmlContent += `
            <div class="col-md-4">
                <div class="card song-card p-3 h-100 shadow-sm" data-bs-toggle="modal" data-bs-target="#songModal" onclick="fetchFullSongDetails(${index})">
                    <div class="card-body">
                        <span class="badge bg-success bg-opacity-10 text-success mb-2">Música Encontrada</span>
                        <h5 class="fw-bold mb-1 text-truncate">${item.title}</h5>
                        <p class="text-muted small mb-0">Artista: ${item.artist}</p>
                    </div>
                </div>
            </div>
        `;
    });

    resultsSection.innerHTML = htmlContent;
}

document.getElementById('loadMoreBtn').addEventListener('click', () => {
    fetchMoreSongsFromAPI();
});

let currentActiveSong = {};

async function fetchFullSongDetails(index) {
    const item = allCurrentResults[index];
    currentActiveSong = { title: item.title, artist: item.artist };
    
    document.getElementById('modalArtistName').innerText = item.artist;
    document.getElementById('modalSongTitle').innerText = item.title;
    document.getElementById('modalLyricsContent').innerText = 'Carregando letra completa...';
    
    document.getElementById('modalInspirationText').innerHTML = `
        A faixa <strong>"${item.title}"</strong> de <strong>${item.artist}</strong> expressa uma atmosfera marcante, combinando lirismo expressivo com arranjos marcantes. A obra explora temas profundos de identidade, emoção e momentos reflexivos da trajetória do artista.
    `;

    try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(item.artist)}/${encodeURIComponent(item.title)}`);
        const songData = await res.json();

        if(songData && songData.lyrics) {
            currentActiveSong.lyrics = songData.lyrics;
            document.getElementById('modalLyricsContent').innerText = songData.lyrics;
        } else {
            document.getElementById('modalLyricsContent').innerText = 'Letra completa não disponibilizada na base externa.';
        }
    } catch(e) {
        document.getElementById('modalLyricsContent').innerText = 'Erro ao carregar a letra.';
    }
}

document.getElementById('copyLyricsBtn').addEventListener('click', () => {
    const lyrics = document.getElementById('modalLyricsContent').innerText;
    navigator.clipboard.writeText(lyrics);
    showToast('Texto copiado com sucesso!');
});

document.getElementById('saveSongBtn').addEventListener('click', async () => {
    if (!currentUser) {
        showToast('Você precisa entrar para salvar músicas!', 'fa-triangle-exclamation');
        bootstrap.Modal.getInstance(document.getElementById('songModal')).hide();
        new bootstrap.Modal(document.getElementById('authModal')).show();
        return;
    }

    const { error } = await supabaseClient.from('saved_songs').insert([
        { 
            user_id: currentUser.id, 
            song_title: currentActiveSong.title, 
            artist_name: currentActiveSong.artist, 
            lyrics: currentActiveSong.lyrics || ''
        }
    ]);

    if (error) {
        showToast('Erro ao salvar no banco: ' + error.message, 'fa-triangle-exclamation');
    } else {
        showToast('Música gravada na sua conta Supabase!');
    }
});