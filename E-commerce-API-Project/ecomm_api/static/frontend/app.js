document.addEventListener('DOMContentLoaded', () => {
    // API Base URL. Empty string = same origin (UI and API served by the same Django app).
    // In production (Django serving the UI at /) this resolves to /api/... on this host.
    const API_BASE_URL = '';

    // --- DOM Element Selectors ---
    const authSection = document.getElementById('auth-section');
    const allContentSections = document.querySelectorAll('main section:not(#auth-section)');
    const userInfoHeader = document.getElementById('user-info');
    const welcomeMessage = document.getElementById('welcome-message');
    const saleListContainer = document.getElementById('sale-list');
    const requestListContainer = document.getElementById('request-list');
    const searchInput = document.getElementById('search-input');

    // Forms
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const productForm = document.getElementById('product-form');
    const requestForm = document.getElementById('request-form');
    const profileForm = document.getElementById('profile-form');

    // Buttons
    const logoutButton = document.getElementById('logout-button');
    const showSellerBtn = document.getElementById('show-seller-form-btn');
    const showBuyerBtn = document.getElementById('show-buyer-form-btn');
    const showProfileBtn = document.getElementById('show-profile-btn');
    const backButtons = document.querySelectorAll('.back-btn');

    // --- State Management ---
    let authToken = localStorage.getItem('authToken');

    // --- Helper Functions ---
    function showAlert(message, isError = false) {
        alert(message);
        if (isError) console.error(message);
    }

    // --- Page/View Navigation ---
    function showSection(sectionId) {
        allContentSections.forEach(section => section.classList.add('hidden'));
        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) sectionToShow.classList.remove('hidden');
    }

    // --- API Fetcher with Authentication ---
    async function authenticatedFetch(url, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            showAlert('Your session has expired. Please log in again.', true);
            handleLogout();
            throw new Error('Authentication Failed');
        }
        return response;
    }

    // --- Data Fetching and Displaying ---
    async function fetchSaleListings(searchQuery = '') {
        try {
            let url = `${API_BASE_URL}/api/v1/products/?status=available`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
            
            const response = await authenticatedFetch(url);
            if (!response.ok) throw new Error('Could not load sale listings.');
            
            const data = await response.json();
            displaySaleListings(data.results);
        } catch (error) {
            saleListContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function displaySaleListings(listings) {
        saleListContainer.innerHTML = listings.length === 0 ? '<p class="loading-message">No items currently for sale.</p>' : '';
        listings.forEach(listing => {
            const sellerName = listing.created_by.profile?.display_name || listing.created_by.username;
            const contactInfo = listing.created_by.profile?.contact_info || 'Not provided';
            const statusText = listing.status.replace('_', ' ');
            const statusClass = `status-${listing.status}`;
            const card = document.createElement('div');
            card.className = 'sale-card';
            card.dataset.id = listing.id;

            card.innerHTML = `
                <div class="card-info">
                    <div class="card-status ${statusClass}">${statusText}</div>
                    <h2 class="card-title">${listing.name}</h2>
                    <p class="card-description">${listing.description}</p>
                    <div class="card-footer">
                        <span class="card-price">Asking: $${parseFloat(listing.price).toFixed(2)}</span>
                        <span>Seller: ${sellerName} (${contactInfo})</span>
                        <button class="buy-button">Buy This</button>
                    </div>
                </div>`;
            saleListContainer.appendChild(card);
        });
    }

    async function fetchPurchaseRequests() {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/purchaserequests/`);
            if (!response.ok) throw new Error('Could not load buy requests.');
            const data = await response.json();
            displayPurchaseRequests(data.results);
        } catch (error) {
            requestListContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function displayPurchaseRequests(requests) {
        requestListContainer.innerHTML = requests.length === 0 ? '<p class="loading-message">No purchase requests yet.</p>' : '';
        requests.forEach(req => {
            const buyerName = req.buyer.profile?.display_name || req.buyer.username;
            const contactInfo = req.buyer.profile?.contact_info || 'Not provided';
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <div class="card-info">
                    <h2 class="card-title">WTB: ${req.product_name}</h2>
                    <p class="card-description">${req.description}</p>
                    <div class="card-footer">
                        <span class="card-price">Offering: ~$${parseFloat(req.target_price).toFixed(2)}</span>
                        <span>Buyer: ${buyerName} (${contactInfo})</span>
                    </div>
                </div>`;
            requestListContainer.appendChild(card);
        });
    }

    // --- Profile Management ---
    async function fetchAndDisplayProfile() {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/auth/profile/`);
            if (!response.ok) throw new Error('Could not fetch your profile data.');
            const profileData = await response.json();
            profileForm['profile-display-name'].value = profileData.display_name || '';
            profileForm['profile-contact-info'].value = profileData.contact_info || '';
        } catch (error) {
            showAlert(error.message, true);
        }
    }

    // --- Authentication and Form Handlers ---
    async function handleRegister(e) {
        e.preventDefault();
        const username = registerForm['register-username'].value;
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        const displayName = registerForm['register-display-name'].value;
        const contactInfo = registerForm['register-contact-info'].value;
    
        try {
            const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();
                throw new Error(`Registration failed: ${errorData.username || errorData.email || 'A user with this username/email may already exist.'}`);
            }
    
            const tokenResponse = await fetch(`${API_BASE_URL}/api/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!tokenResponse.ok) throw new Error('User account created, but automatic login failed. Please log in manually.');
            
            const tokenData = await tokenResponse.json();
            const tempAuthToken = tokenData.access;
    
            const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tempAuthToken}` },
                body: JSON.stringify({ display_name: displayName, contact_info: contactInfo })
            });
            if (!profileResponse.ok) throw new Error('User account created, but failed to save profile information.');
            
            showAlert('Registration successful! Please log in to continue.');
            registerForm.reset();
        } catch (error) {
            showAlert(error.message, true);
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/api/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginForm['login-username'].value, password: loginForm['login-password'].value })
            });
            if (response.ok) {
                const data = await response.json();
                authToken = data.access;
                localStorage.setItem('authToken', authToken);
                loginForm.reset();
                updateUIForLoginStatus();
            } else {
                const errorData = await response.json();
                showAlert(`Login failed: ${errorData.detail || 'Invalid credentials.'}`, true);
            }
        } catch (error) { showAlert('A network error occurred during login.', true); }
    }

    function handleLogout() {
        authToken = null;
        localStorage.removeItem('authToken');
        updateUIForLoginStatus();
        showAlert('You have been logged out.');
    }
    
    async function handleProductFormSubmit(e) {
        e.preventDefault();
        try {
            const data = {
                name: productForm['product-name'].value,
                description: productForm['product-description'].value,
                price: parseFloat(productForm['product-price'].value),
                stock_quantity: parseInt(productForm['product-stock'].value),
                category_name: productForm['product-category'].value
            };
            await authenticatedFetch(`${API_BASE_URL}/api/v1/products/`, { method: 'POST', body: JSON.stringify(data) });
            showAlert('Listing created!');
            productForm.reset();
            showSection('dashboard-section');
            fetchSaleListings();
        } catch (error) { showAlert(`Error: ${error.message}`, true); }
    }

    async function handleRequestFormSubmit(e) {
        e.preventDefault();
        try {
            const data = {
                product_name: requestForm['request-product-name'].value,
                description: requestForm['request-description'].value,
                target_price: parseFloat(requestForm['request-target-price'].value)
            };
            await authenticatedFetch(`${API_BASE_URL}/api/v1/purchaserequests/`, { method: 'POST', body: JSON.stringify(data) });
            showAlert('Request posted!');
            requestForm.reset();
            showSection('dashboard-section');
            fetchPurchaseRequests();
        } catch (error) { showAlert(`Error: ${error.message}`, true); }
    }
    
    async function handleProfileUpdate(e) {
        e.preventDefault();
        try {
            const data = {
                display_name: profileForm['profile-display-name'].value,
                contact_info: profileForm['profile-contact-info'].value
            };
            await authenticatedFetch(`${API_BASE_URL}/api/auth/profile/`, { method: 'PUT', body: JSON.stringify(data) });
            showAlert('Profile updated!');
            showSection('dashboard-section');
            fetchSaleListings();
            fetchPurchaseRequests();
        } catch (error) { showAlert(`Error: ${error.message}`, true); }
    }

    // --- Main UI Update Logic ---
    function updateUIForLoginStatus() {
        if (authToken) {
            authSection.classList.add('hidden');
            userInfoHeader.classList.remove('hidden');
            showSection('dashboard-section');
            fetchSaleListings();
            fetchPurchaseRequests();
        } else {
            authSection.classList.remove('hidden');
            userInfoHeader.classList.add('hidden');
            allContentSections.forEach(section => section.classList.add('hidden'));
        }
    }

    // ========================================================
    // ATTACHING ALL EVENT LISTENERS
    // ========================================================

    registerForm.addEventListener('submit', handleRegister);
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);

    showSellerBtn.addEventListener('click', () => showSection('seller-form-section'));
    showBuyerBtn.addEventListener('click', () => showSection('buyer-form-section'));
    showProfileBtn.addEventListener('click', () => { showSection('profile-section'); fetchAndDisplayProfile(); });

    backButtons.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.target));
    });

    productForm.addEventListener('submit', handleProductFormSubmit);
    requestForm.addEventListener('submit', handleRequestFormSubmit);
    profileForm.addEventListener('submit', handleProfileUpdate);

    saleListContainer.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('buy-button')) {
            const card = e.target.closest('.sale-card');
            const listingId = card.dataset.id;
            if (confirm('Are you sure you want to initiate a trade? The seller will be notified.')) {
                try {
                    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/products/${listingId}/initiate_trade/`, { method: 'POST' });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.status || errorData.detail || 'Could not initiate trade.');
                    }
                    showAlert('Trade initiated successfully!');
                    fetchSaleListings();
                } catch (error) {
                    showAlert(`Error: ${error.message}`, true);
                }
            }
        }
    });

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fetchSaleListings(e.target.value), 300);
    });

    // Initial check on page load
    updateUIForLoginStatus();
});

search_inp = document.getElementById("search-input")
let container = document.getElementById("sale-list")
search_inp.oninput = ()=>{
    document.querySelectorAll(".card-title").forEach((item)=>{
        if(item.innerHTML.includes(search_inp.value)){
            item.parentElement.parentElement.style.display="block"
        }else{
            item.parentElement.parentElement.style.display="none"

        }
    })
}