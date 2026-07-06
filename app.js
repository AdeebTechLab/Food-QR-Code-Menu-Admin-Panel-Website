// --- Data Structure ---
// --- Reusable inline SVG icons (outline style, matches header/footer icon set) ---
const ICON_TRASH = '<svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
const ICON_BAG = '<svg class="icon" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
const ICON_FLAME = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5"/></svg>';
const ICON_CHEVRON_LEFT = '<svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>';
const ICON_CHEVRON_RIGHT = '<svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>';
const ICON_LIST = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>';
const ICON_TAG = '<svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42Z"/><path d="M7 7h.01"/></svg>';
const ICON_ARROW_RIGHT = '<svg class="icon" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

// The menu itself now lives in /data/menu-data.json and is served through
// /api/menu, so it can be edited from /admin without a code change or
// redeploy. `menuData` starts empty and is populated by loadMenuData()
// below before anything tries to render it.
let menuData = [];

// Flat lookup of every item by id, tagged with its categoryId - rebuilt
// every time menuData is (re)loaded.
let allItemsById = {};

function rebuildItemIndex() {
    allItemsById = {};
    menuData.forEach(category => {
        category.items.forEach(item => {
            allItemsById[item.id] = { ...item, categoryId: category.categoryId };
        });
    });
}

// Resolves an item's `image` field to a real <img src>. Admin-uploaded
// photos are stored as full Vercel Blob URLs; the original bundled photos
// are just filenames that live in /assets.
function imageSrc(image) {
    if (!image) return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    if (/^https?:\/\//i.test(image) || image.startsWith('data:')) return image;
    return `assets/${image}`;
}

// Fetches the current menu from /api/menu (which serves the admin-edited
// copy from Vercel Blob, falling back to the bundled JSON on the server
// side). Falls back to an empty menu with a console warning if the API
// itself is unreachable, so a network hiccup doesn't throw and block the
// rest of the page's init.
async function loadMenuData() {
    try {
        const response = await fetch('/api/menu', { cache: 'no-store' });
        if (!response.ok) throw new Error(`status ${response.status}`);
        menuData = await response.json();
    } catch (err) {
        console.error('Failed to load menu data from /api/menu.', err);
        menuData = [];
    }
    rebuildItemIndex();
}

// WhatsApp business number (same number shown in the header: +92 309 233 3121)
const WHATSAPP_NUMBER = "923092333121";

// --- Shared Header/Footer Loader ---
// Fetches header.html (overlay, location modal, sidebars, main header)
// and footer.html (site footer + floating action buttons), injecting
// each into any page that includes the matching placeholder div.
// NOTE: requires the page to be served over http/https (e.g. a local dev
// server) - fetch() of local files is blocked under the file:// protocol.
async function loadHeader() {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('header.html?v=20260704d', { cache: 'no-cache' });
        const html = await response.text();
        placeholder.innerHTML = html;
        unwrapPlaceholder(placeholder);
    } catch (err) {
        console.error('Failed to load header.html. Make sure the site is served via a local/live server, not opened directly as a file.', err);
    }
}

async function loadFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('footer.html?v=20260704d', { cache: 'no-cache' });
        const html = await response.text();
        placeholder.innerHTML = html;
        unwrapPlaceholder(placeholder);
    } catch (err) {
        console.error('Failed to load footer.html. Make sure the site is served via a local/live server, not opened directly as a file.', err);
    }
}

// Replaces a wrapper element with its own children, so the injected
// header/footer markup (e.g. .main-header) becomes a direct child of
// <body> instead of being nested inside a placeholder <div>. This matters
// because Chromium's handling of <body>'s propagated overflow can break
// position: sticky for elements nested an extra level deep - moving
// .main-header up to sit alongside .menu-controls (which is a direct
// child of body) keeps both stuck to the top correctly while scrolling.
function unwrapPlaceholder(placeholder) {
    const parent = placeholder.parentNode;
    while (placeholder.firstChild) {
        parent.insertBefore(placeholder.firstChild, placeholder);
    }
    parent.removeChild(placeholder);
}

// --- Initialization & Rendering ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load the shared header/footer and the current menu data (from the
    // admin-editable /api/menu endpoint) in parallel, since nothing below
    // needs them individually - only once both are ready.
    await Promise.all([loadHeader(), loadFooter(), loadMenuData()]);

    // 2. Now that header.html is in the DOM, grab its elements.
    // Guarded with null-checks so that if header.html failed to load (e.g. a
    // stale cached response after a redeploy), the menu/cart buttons still
    // fail gracefully instead of throwing and silently blocking every other
    // click handler on the page.
    overlay = document.getElementById('page-overlay');
    navSidebar = document.getElementById('nav-sidebar');
    cartSidebar = document.getElementById('cart-sidebar');

    if (!overlay || !navSidebar || !cartSidebar) {
        console.error('Header did not load correctly - menu/cart buttons will not work. Try a hard refresh (Ctrl/Cmd+Shift+R).');
    } else {
        // Clicking the dark background closes both sidebars
        overlay.addEventListener('click', () => {
            navSidebar.classList.remove('open');
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // 4. Render Menu Grid (only present on pages that have #menu-grid)
    if (document.getElementById('menu-grid')) {
        renderCategoryNav();
        renderMenuGrid();
        initCategoryScrollSpy();
        initSearchPlaceholderCycle();
    }

    // 5. Keep the category/search bar pinned directly beneath the header,
    // even if the header's real height differs from any fixed assumption.
    initStickyHeaderOffset();

    // 6. Render current cart state (badges, floating button, sticky bar, action buttons)
    updateCartUI();
});

function renderCategoryNav() {
    const navList = document.getElementById('horizontal-categories');
    if (!navList) return;

    navList.innerHTML = '';
    menuData.forEach((category, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${category.categoryId}" data-category="${category.categoryId}" class="${index === 0 ? 'active-category' : ''}">${category.title}</a>`;
        navList.appendChild(li);
    });
}

// Highlights the nav link for whichever category section is currently
// in view as the user scrolls, and keeps that pill scrolled into sight.
function initCategoryScrollSpy() {
    const sections = document.querySelectorAll('.menu-category');
    const navList = document.getElementById('horizontal-categories');
    if (!sections.length || !navList) return;

    const setActiveCategory = (id) => {
        navList.querySelectorAll('a').forEach(a => a.classList.remove('active-category'));
        const activeLink = navList.querySelector(`a[data-category="${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active-category');
            activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActiveCategory(entry.target.id);
            }
        });
    }, { rootMargin: '-140px 0px -50% 0px', threshold: 0 });

    sections.forEach(section => observer.observe(section));

    // Fallback: short trailing categories (like the last one on the page)
    // can end the page's scroll range before their heading ever enters the
    // IntersectionObserver's band above, leaving the previous category
    // stuck as "active". Once the user is within a few px of the bottom of
    // the page, force the last category to be marked active directly.
    const lastSection = sections[sections.length - 1];
    window.addEventListener('scroll', () => {
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (scrolledToBottom) {
            setActiveCategory(lastSection.id);
        }
    }, { passive: true });
}

// Keeps .menu-controls (category nav + search) pinned directly below the
// real, rendered height of .main-header, instead of relying on a fixed
// top offset that could drift out of sync (which previously caused the
// header to appear to "disappear" behind the sticky nav while scrolling).
function initStickyHeaderOffset() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    const setOffset = () => {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    setOffset();

    if (window.ResizeObserver) {
        new ResizeObserver(setOffset).observe(header);
    } else {
        window.addEventListener('resize', setOffset);
    }
}

function renderMenuGrid() {
    const gridContainer = document.getElementById('menu-grid');
    gridContainer.innerHTML = ''; // Clear container

    menuData.forEach(category => {
        // Create Section
        const section = document.createElement('section');
        section.classList.add('menu-category');
        section.id = category.categoryId;
        
        let html = `<h2>${category.title}</h2><div class="product-grid">`;

        // Create Cards
        category.items.forEach(item => {
            const badgeHtml = item.badge ? `<div class="badge-tag">${item.badge}</div>` : '';
            const descHtml = item.description ? `<p>${item.description}</p>` : '';
            const priceHtml = item.priceFrom ? `<div class="price">From Rs. ${item.price}</div>` : `<div class="price">Rs. ${item.price}</div>`;

            html += `
                <div class="product-card" data-name="${item.name.toLowerCase()}" onclick="openProductDetail(${item.id})">
                    <div class="product-info">
                        <div>
                            <h4>${item.name}</h4>
                            ${descHtml}
                        </div>
                        ${priceHtml}
                    </div>
                    <div class="product-image-container">
                        ${badgeHtml}
                        <img class="product-img" src="${imageSrc(item.image)}" alt="${item.name}">
                        <div class="product-action" id="cart-action-${item.id}" onclick="event.stopPropagation()">${renderCartActionHTML(item.id)}</div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        section.innerHTML = html;
        gridContainer.appendChild(section);
    });
}

// --- Live Search Functionality ---
// Scrolls to and focuses the menu search input - used by the floating
// search button. No-op on pages that don't have a search bar (e.g. the
// About Us / Franchise / Timings pages).
function scrollToSearch() {
    const input = document.getElementById('menu-search');
    if (!input) return;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => input.focus(), 400);
}

// Cycles the search bar's placeholder through random dish names, e.g.
// "Search for Crispy Chicken..." -> "Search for FIFA Duo Deal..." - the
// "Search for " prefix stays fixed, only the dish name rotates.
function initSearchPlaceholderCycle() {
    const input = document.getElementById('menu-search');
    if (!input) return;

    const names = menuData.flatMap(category => category.items.map(item => item.name));
    if (names.length === 0) return;

    // Shuffle once so the rotation order isn't the same as menu order
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    let idx = 0;

    const setPlaceholder = () => {
        input.placeholder = `Search for ${shuffled[idx]}...`;
        idx = (idx + 1) % shuffled.length;
    };

    setPlaceholder();
    setInterval(setPlaceholder, 2500);
}


function filterMenu() {
    const query = document.getElementById('menu-search').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    const categories = document.querySelectorAll('.menu-category');

    // Filter Cards
    cards.forEach(card => {
        const name = card.getAttribute('data-name');
        if (name.includes(query)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });

    // Hide empty category headers
    categories.forEach(category => {
        const totallyHidden = category.querySelectorAll('.product-card[style="display: none;"]').length;
        const totalCards = category.querySelectorAll('.product-card').length;

        if (totallyHidden === totalCards) {
            category.style.display = "none";
        } else {
            category.style.display = "block";
        }
    });
}


// --- Sidebar & Overlay Logic ---
// These are assigned once header.html has been injected into the page (see loadHeader/init below)
let overlay, navSidebar, cartSidebar;

function toggleNav() {
    if (!navSidebar) return;
    navSidebar.classList.toggle('open');
    checkOverlay();
}

function toggleCart() {
    if (!cartSidebar) return;
    cartSidebar.classList.toggle('open');
    checkOverlay();
}

function checkOverlay() {
    if (!overlay || !navSidebar || !cartSidebar) return;
    if (navSidebar.classList.contains('open') || cartSidebar.classList.contains('open')) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}


// --- Toast Notification ---
let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = `<span class="toast-check"><svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24" stroke="white"><path d="M20 6 9 17l-5-5"/></svg></span> ${message}`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}


// --- Shopping Cart Logic ---
let cart = [];

// Returns the HTML for a product card's action area: a plain "+" button
// if the item isn't in the cart yet, or a remove/qty/add stepper if it is.
function renderCartActionHTML(id) {
    const cartItem = cart.find(i => i.id === id);
    const item = allItemsById[id];
    if (!item) return '';

    if (cartItem) {
        const removeIcon = ICON_TRASH;
        return `
            <div class="qty-stepper">
                <button class="qty-btn qty-remove" onclick="updateQty(${id}, -1)" aria-label="Remove">${removeIcon}</button>
                <span class="qty-count">${cartItem.qty}</span>
                <button class="qty-btn qty-add" onclick="updateQty(${id}, 1)" aria-label="Add">+</button>
            </div>`;
    }

    return `<button class="add-btn" onclick="addToCart(${id})">+</button>`;
}

// Re-renders every product card's action area (called after any cart change)
function refreshCartActionButtons() {
    document.querySelectorAll('[id^="cart-action-"]').forEach(el => {
        const id = parseInt(el.id.replace('cart-action-', ''), 10);
        el.innerHTML = renderCartActionHTML(id);
    });
}

function addToCart(id, qty = 1, instructions = '') {
    const item = allItemsById[id];
    if (!item) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += qty;
        if (instructions) existing.instructions = instructions;
    } else {
        cart.push({ id, name: item.name, price: item.price, qty, instructions: instructions || '' });
    }
    showToast('Item added to cart');
    updateCartUI();
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
}


// --- Product Detail Modal ---
let pdCurrentId = null;
let pdQty = 1;

function openProductDetail(id) {
    const item = allItemsById[id];
    if (!item) return;

    pdCurrentId = id;
    pdQty = 1;

    document.getElementById('pd-image').src = imageSrc(item.image);
    document.getElementById('pd-image').alt = item.name;
    document.getElementById('pd-name').innerText = item.name;
    document.getElementById('pd-price').innerText = item.priceFrom ? `From Rs. ${item.price}` : `Rs. ${item.price}`;
    document.getElementById('pd-description').innerText = item.description || '';
    document.getElementById('pd-description').style.display = item.description ? 'block' : 'none';
    document.getElementById('pd-instructions-input').value = '';
    document.getElementById('pd-char-count').innerText = '0/500';
    document.getElementById('pd-qty').innerText = pdQty;
    document.getElementById('pd-add-price').innerText = `Rs. ${item.price}`;

    document.getElementById('product-detail-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
    document.getElementById('product-detail-overlay').classList.remove('active');
    document.body.style.overflow = '';
    pdCurrentId = null;
}

function updatePdQty(change) {
    pdQty = Math.max(1, pdQty + change);
    document.getElementById('pd-qty').innerText = pdQty;
    const item = allItemsById[pdCurrentId];
    if (item) {
        document.getElementById('pd-add-price').innerText = `Rs. ${item.price * pdQty}`;
    }
}

function updatePdCharCount() {
    const input = document.getElementById('pd-instructions-input');
    document.getElementById('pd-char-count').innerText = `${input.value.length}/500`;
}

function addPdToCart() {
    if (pdCurrentId === null) return;
    const instructions = document.getElementById('pd-instructions-input').value.trim();
    addToCart(pdCurrentId, pdQty, instructions);
    closeProductDetail();
}

function shareProductDetail() {
    if (pdCurrentId === null) return;
    const item = allItemsById[pdCurrentId];
    if (!item) return;

    const shareData = {
        title: `${item.name} - Hot N Spicy`,
        text: `${item.name} - Rs. ${item.price}\n${item.description || ''}`
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
        showToast('Copied to clipboard');
    }
}

// Picks a handful of add-on items from any category other than the ones
// already in the cart (e.g. if only FIFA/Mashup Deals exist, this simply
// has nothing to suggest and the upsell section stays hidden - it will
// pick back up automatically if more categories are added later).
function getUpsellItems() {
    const cartIds = new Set(cart.map(i => i.id));
    const cartCategoryIds = new Set(cart.map(i => allItemsById[i.id]?.categoryId));

    let pool = menuData
        .filter(category => !cartCategoryIds.has(category.categoryId))
        .flatMap(category => category.items);

    if (pool.length === 0) {
        pool = menuData.flatMap(category => category.items);
    }

    pool = pool.filter(i => !cartIds.has(i.id));

    // De-duplicate by id, cap at 6 suggestions
    const seen = new Set();
    return pool.filter(i => (seen.has(i.id) ? false : seen.add(i.id))).slice(0, 6);
}

function renderUpsellCarousel() {
    const items = getUpsellItems();
    if (items.length === 0) return '';

    const cardsHtml = items.map(item => `
        <div class="upsell-card">
            <div class="upsell-img-wrap">
                <img src="${imageSrc(item.image)}" alt="${item.name}">
                <button class="upsell-add-btn" onclick="addToCart(${item.id})">+</button>
            </div>
            <div class="upsell-price">Rs. ${item.price}</div>
            <div class="upsell-name">${item.name}</div>
        </div>
    `).join('');

    return `
        <div class="upsell-section">
            <div class="upsell-header">
                <span class="upsell-title">${ICON_FLAME} Popular with your order</span>
                <div class="upsell-nav">
                    <button class="upsell-nav-btn" onclick="scrollUpsell(-1)" aria-label="Previous">${ICON_CHEVRON_LEFT}</button>
                    <button class="upsell-nav-btn" onclick="scrollUpsell(1)" aria-label="Next">${ICON_CHEVRON_RIGHT}</button>
                </div>
            </div>
            <div class="upsell-track" id="upsell-track">${cardsHtml}</div>
        </div>
    `;
}

function scrollUpsell(direction) {
    const track = document.getElementById('upsell-track');
    if (!track) return;
    track.scrollBy({ left: direction * 140, behavior: 'smooth' });
}

// Builds a human-readable "ready in 45 minutes" message based on the
// order type the person picked in the location modal.
function getReadyTimeText(orderType) {
    const future = new Date(Date.now() + 45 * 60000);
    const dateStr = future.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = future.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let action = 'ready';
    if (orderType === 'Delivery') action = 'delivered';
    else if (orderType === 'Pick-Up') action = 'ready for pick-up';
    else if (orderType === 'Car hop') action = 'ready for car-hop';
    else if (orderType === 'Dine-In') action = 'ready for dine-in';

    return { text: `Your order will be ${action} in 45 minutes on <strong>${dateStr}</strong> at <span class="ready-time-highlight">${timeStr}</span>.`, dateStr, timeStr };
}

function updateCartUI() {
    const cartBody = document.getElementById('cart-content');
    const cartFooter = document.getElementById('cart-footer-actions');
    const floatingBtn = document.getElementById('floating-cart-btn');
    const floatingBadge = document.getElementById('floating-cart-badge');
    const viewCartBar = document.getElementById('sticky-viewcart-bar');
    const viewCartBadge = document.getElementById('viewcart-badge');
    const viewCartTotal = document.getElementById('viewcart-total');
    const headerBadge = document.getElementById('cart-badge');

    // Keep every product card's +/stepper button in sync
    refreshCartActionButtons();

    if (!cartBody || !cartFooter) return; // header not loaded yet on this render pass

    let subtotal = 0;
    let totalItems = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
        totalItems += item.qty;
    });

    if (cart.length === 0) {
        cartBody.classList.add('empty');
        cartBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${ICON_BAG}</div>
                <h4>Your cart is empty</h4>
                <p>Looks like you haven't added anything yet</p>
                <button class="browse-btn" onclick="toggleCart()">Browse Products</button>
            </div>`;
        cartFooter.style.display = 'none';
        cartFooter.innerHTML = '';

        if (floatingBtn) floatingBtn.style.display = 'none';
        if (viewCartBar) viewCartBar.style.display = 'none';
        if (headerBadge) headerBadge.style.display = 'none';
        return;
    }

    cartBody.classList.remove('empty');

    const itemsHtml = cart.map(item => {
        const menuItem = allItemsById[item.id];
        const img = menuItem ? imageSrc(menuItem.image) : '';
        const removeIcon = ICON_TRASH;
        const noteHtml = item.instructions ? `<span class="cart-item-note">Note: ${item.instructions}</span>` : '';
        return `
            <div class="cart-item">
                <img class="cart-item-img" src="${img}" alt="${item.name}" onerror="this.onerror=null;this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <span class="cart-item-price">Rs. ${item.price}</span>
                    ${noteHtml}
                </div>
                <div class="qty-stepper">
                    <button class="qty-btn qty-remove" onclick="updateQty(${item.id}, -1)" aria-label="Remove">${removeIcon}</button>
                    <span class="qty-count">${item.qty}</span>
                    <button class="qty-btn qty-add" onclick="updateQty(${item.id}, 1)" aria-label="Add">+</button>
                </div>
            </div>
        `;
    }).join('');

    cartBody.innerHTML = `
        ${itemsHtml}
        <button class="add-more-items-btn" onclick="toggleCart()">+ Add more items</button>
        ${renderUpsellCarousel()}
    `;

    const tax = Math.round(subtotal * 0.15);
    const grandTotal = subtotal + tax;
    const orderType = localStorage.getItem('orderType') || 'Delivery';
    const ready = getReadyTimeText(orderType);

    cartFooter.style.display = 'block';
    cartFooter.innerHTML = `
        <div class="cart-summary">
            <div class="summary-row"><span>${ICON_LIST} Total</span><span>Rs. ${subtotal}</span></div>
            <div class="summary-row"><span>${ICON_TAG} Tax (15%)</span><span>Rs. ${tax}</span></div>
            <div class="summary-row grand-total-row"><span>Grand Total</span><span>Rs. ${grandTotal}</span></div>
        </div>
        <button class="checkout-btn" onclick="checkoutViaWhatsApp()">Checkout ${ICON_ARROW_RIGHT}</button>
        <p class="ready-time-text">${ready.text}</p>
    `;

    if (floatingBtn && floatingBadge) {
        floatingBtn.style.display = 'flex';
        floatingBadge.innerText = totalItems;
    }
    if (viewCartBar && viewCartBadge && viewCartTotal) {
        viewCartBar.style.display = 'block';
        viewCartBadge.innerText = totalItems;
        viewCartTotal.innerText = `Rs. ${grandTotal}`;
    }
    if (headerBadge) {
        headerBadge.style.display = 'flex';
        headerBadge.innerText = totalItems;
    }
}

// Builds an itemized order summary and opens a WhatsApp chat to the
// restaurant's number with the message pre-filled.
function checkoutViaWhatsApp() {
    if (cart.length === 0) return;

    const orderType = localStorage.getItem('orderType') || 'Delivery';
    const location = localStorage.getItem('location') || 'Not selected';

    let subtotal = 0;
    const lines = cart.map(item => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        const note = item.instructions ? ` (Note: ${item.instructions})` : '';
        return `- ${item.name} x${item.qty} = Rs. ${lineTotal}${note}`;
    }).join('\n');

    const tax = Math.round(subtotal * 0.15);
    const grandTotal = subtotal + tax;
    const ready = getReadyTimeText(orderType);
    const readyPlain = ready.text.replace(/<[^>]*>/g, '');

    const message =
`New Order Request - Hot N Spicy

Order Type: ${orderType}
Location/Branch: ${location}

Items:
${lines}

Total: Rs. ${subtotal}
Tax (15%): Rs. ${tax}
Grand Total: Rs. ${grandTotal}

${readyPlain}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}


// --- Franchise Inquiry Form (franchise.html) ---
// Builds a pre-filled WhatsApp message from the franchise form fields.
function submitFranchiseInquiry(event) {
    event.preventDefault();

    const fullName = document.getElementById('franchise-name')?.value.trim();
    const email = document.getElementById('franchise-email')?.value.trim();
    const phone = document.getElementById('franchise-phone')?.value.trim();
    const city = document.getElementById('franchise-city')?.value.trim();
    const capacity = document.getElementById('franchise-capacity')?.value;
    const messageText = document.getElementById('franchise-message')?.value.trim();

    if (!fullName || !phone) {
        alert('Please fill in at least your Full Name and Phone number.');
        return;
    }

    const message =
`New Franchise Inquiry - Hot N Spicy

Full Name: ${fullName}
Email: ${email || '-'}
Phone: ${phone}
City: ${city || '-'}
Investment Capacity: ${capacity || '-'}

Message:
${messageText || '-'}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
