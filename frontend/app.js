document.addEventListener('DOMContentLoaded', () => {
    // API Base URLs
    const API_BASE_URL = ''; // An empty string makes it a relative path
// ... now fetch(`${API_BASE_URL}/api/v1/products/`) becomes fetch('/api/v1/products/')
    // --- DOM Element Selectors ---
    const productListContainer = document.getElementById('product-list');
    const authSection = document.getElementById('auth-section');
    const loggedInSection = document.getElementById('logged-in-section');

    // Forms
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const categoryForm = document.getElementById('category-form');
    const productForm = document.getElementById('product-form');
    const logoutButton = document.getElementById('logout-button');

    // --- State Management ---
    let authToken = localStorage.getItem('authToken');

    // --- API Functions ---

    // Fetch and display products
    async function fetchProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/products/`);
            if (!response.ok) throw new Error('Network response was not ok.');
            
            const responseData = await response.json();
            displayProducts(responseData.results);
        } catch (error) {
            console.error("Could not fetch products:", error);
            productListContainer.innerHTML = `<p class="error-message">Failed to load products.</p>`;
        }
    }

    // Display products on the page
    function displayProducts(products) {
        productListContainer.innerHTML = '';
        if (products.length === 0) {
            productListContainer.innerHTML = `<p class="loading-message">No products found. Create one!</p>`;
            return;
        }
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            const imageUrl = product.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image';
            productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h2 class="product-title">${product.name}</h2>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
                        <span class="product-stock">${product.stock_quantity} in stock</span>
                    </div>
                </div>
            `;
            productListContainer.appendChild(productCard);
        });
    }

    // Handle user registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: registerForm['register-username'].value,
                email: registerForm['register-email'].value,
                password: registerForm['register-password'].value
            })
        });
        if (response.ok) {
            alert('Registration successful! Please log in.');
            registerForm.reset();
        } else {
            alert('Registration failed. Username or email may already exist.');
        }
    });

    // Handle user login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const response = await fetch(`${API_BASE_URL}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: loginForm['login-username'].value,
                password: loginForm['login-password'].value
            })
        });
        if (response.ok) {
            const data = await response.json();
            authToken = data.access;
            localStorage.setItem('authToken', authToken);
            updateUIForLoginStatus();
        } else {
            alert('Login failed. Please check your username and password.');
        }
    });

    // Handle user logout
    logoutButton.addEventListener('click', () => {
        authToken = null;
        localStorage.removeItem('authToken');
        updateUIForLoginStatus();
    });
    
    // Generic function for creating items (products, categories)
    async function createItem(url, body) {
        if (!authToken) {
            alert('You must be logged in to perform this action.');
            return;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // <-- This is CRITICAL
            },
            body: JSON.stringify(body)
        });
        if (response.status === 201) {
            alert('Item created successfully!');
            fetchProducts(); // Refresh the product list
            return true;
        } else {
            const errorData = await response.json();
            console.error('Creation failed:', errorData);
            alert(`Creation failed: ${JSON.stringify(errorData)}`);
            return false;
        }
    }

    // Handle category creation
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const success = await createItem(`${API_BASE_URL}/api/v1/categories/`, {
            name: categoryForm['category-name'].value
        });
        if (success) categoryForm.reset();
    });

    // Handle product creation
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const success = await createItem(`${API_BASE_URL}/api/v1/products/`, {
            name: productForm['product-name'].value,
            description: productForm['product-description'].value,
            price: productForm['product-price'].value,
            stock_quantity: productForm['product-stock'].value,
            category: productForm['product-category'].value
        });
        if (success) productForm.reset();
    });


    // --- UI Update Logic ---
    function updateUIForLoginStatus() {
        if (authToken) {
            authSection.classList.add('hidden');
            loggedInSection.classList.remove('hidden');
            fetchProducts(); // Load products now that we are logged in
        } else {
            authSection.classList.remove('hidden');
            loggedInSection.classList.add('hidden');
            productListContainer.innerHTML = '<p class="loading-message">Please log in to manage products.</p>';
        }
    }

    // --- Initial Page Load ---
    updateUIForLoginStatus();
});