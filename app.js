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

// Maps each category's categoryId to its banner photo in /assets. One
// photo per category, shown above the product grid in that category's
// section. sizzling-steaks-chicken has no dedicated asset yet, so it
// falls back to the general chicken photo.
const CATEGORY_IMAGES = {
    'appetizer': 'cat-appetizer.webp',
    'chinese-soups': 'cat-chinese-soups.webp',
    'fish': 'cat-fish.webp',
    'chicken': 'cat-chicken.webp',
    'rice': 'cat-rice.webp',
    'noodles': 'cat-noodles.webp',
    'chopsuey': 'cat-chopsuey.webp',
    'burgers': 'cat-burgers.webp',
    'sandwiches': 'cat-sandwiches.webp',
    'english-food': 'cat-english-food.webp',
    'sizzling-steaks-chicken': 'cat-chicken.webp',
    'pakistani-food-chicken': 'cat-pakistani-chicken.webp',
    'pakistani-food-mutton': 'cat-pakistani-mutton.webp',
    'bar-b-q': 'cat-bar-bq.webp',
    'special-deals': 'deal-combo.webp',
    'tandoor': 'cat-tandoor.webp',
    'royal-drinks': 'cat-royal-drinks.webp',
    'ice-cream': 'cat-ice-cream.webp',
    'seasonal-fresh-juices': 'cat-juices.webp',
    'milk-shakes': 'cat-milk-shakes.webp',
    'cold-drinks': 'cat-cold-drinks.webp'
};

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
const WHATSAPP_NUMBER = "923099374001";

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
    cartSidebar = document.getElementById('cart-sidebar');

    if (!overlay || !cartSidebar) {
        console.error('Header did not load correctly - the cart button will not work. Try a hard refresh (Ctrl/Cmd+Shift+R).');
    } else {
        // Clicking the dark background closes the cart sidebar
        overlay.addEventListener('click', () => {
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

function getBestDealItems() {
    const items = [];
    menuData.forEach(category => {
        category.items.forEach(item => {
            if (item.bestDeal) items.push(item);
        });
    });
    return items;
}

function renderCategoryNav() {
    const navList = document.getElementById('horizontal-categories');
    if (!navList) return;

    navList.innerHTML = '';

    const hasBestDeals = getBestDealItems().length > 0;
    let isFirst = true;

    if (hasBestDeals) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#best-deals" data-category="best-deals" class="active-category">Best Deals</a>`;
        navList.appendChild(li);
        isFirst = false;
    }

    menuData.forEach((category) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${category.categoryId}" data-category="${category.categoryId}" class="${isFirst ? 'active-category' : ''}">${category.title}</a>`;
        navList.appendChild(li);
        isFirst = false;
    });
}

// Highlights the nav link for whichever category section the user has
// actually scrolled to, and keeps that pill scrolled into sight.
//
// Uses a single "activation line" just below the sticky nav, and picks
// whichever section's top has scrolled above that line (the last one to
// do so). This is deliberately NOT an IntersectionObserver with a large
// trigger band: a big band would mark a very short section (e.g. a
// category with only one item, like "Chinese") active as soon as it
// merely entered the band, even while the user was still looking at the
// previous category above it. Tracking exact section-top position against
// one line stays correct no matter how tall or short a section is.
function initCategoryScrollSpy() {
    const sections = Array.from(document.querySelectorAll('.menu-category'));
    const navList = document.getElementById('horizontal-categories');
    if (!sections.length || !navList) return;

    let lastActiveId = null;
    // On page load, the sticky nav bar sits below the tall hero image in
    // normal document flow (it hasn't "stuck" yet), so it can be entirely
    // off-screen at first paint. Calling scrollIntoView() on its pill at
    // that moment makes the browser auto-scroll the whole page down to
    // reveal it - which pushes the hero image up under the sticky header
    // right on load. We skip scrollIntoView for this first, initial sync
    // and only use it for real changes triggered by the user scrolling.
    let hasSynced = false;

    const setActiveCategory = (id) => {
        if (id === lastActiveId) return;
        lastActiveId = id;

        navList.querySelectorAll('a').forEach(a => a.classList.remove('active-category'));
        const activeLink = navList.querySelector(`a[data-category="${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active-category');
            if (hasSynced) {
                activeLink.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    };

    function getActivationLine() {
        const controls = document.querySelector('.menu-controls');
        return (controls ? controls.getBoundingClientRect().bottom : 140) + 4;
    }

    let ticking = false;
    function updateActive() {
        ticking = false;

        // Within a few px of the very bottom of the page, always activate
        // the last section - handles short trailing categories that might
        // never fully cross the activation line on their own.
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (scrolledToBottom) {
            setActiveCategory(sections[sections.length - 1].id);
            hasSynced = true;
            return;
        }

        const line = getActivationLine();
        let current = sections[0];
        for (const section of sections) {
            if (section.getBoundingClientRect().top <= line) {
                current = section;
            } else {
                break;
            }
        }
        setActiveCategory(current.id);
        hasSynced = true;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateActive);
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateActive();
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

function renderProductCardHTML(item) {
    const descHtml = item.description ? `<p>${item.description}</p>` : '';
    const priceHtml = item.priceFrom ? `<div class="price">From Rs. ${item.price}</div>` : `<div class="price">Rs. ${item.price}</div>`;
    const badgeHtml = item.bestDeal ? `<div class="badge-tag">Best Deal</div>` : (item.badge ? `<div class="badge-tag">${item.badge}</div>` : '');

    return `
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
}

function renderMenuGrid() {
    const gridContainer = document.getElementById('menu-grid');
    gridContainer.innerHTML = ''; // Clear container

    // Virtual "Best Deals" section: pulls in every item tagged as a best
    // deal (via the admin panel) without removing it from its own category
    // below, so the same item legitimately appears in both places.
    const bestDeals = getBestDealItems();
    if (bestDeals.length > 0) {
        const bestSection = document.createElement('section');
        bestSection.classList.add('menu-category');
        bestSection.id = 'best-deals';
        bestSection.innerHTML = `<h2>Best Deals</h2><div class="product-grid">${bestDeals.map(renderProductCardHTML).join('')}</div>`;
        gridContainer.appendChild(bestSection);
    }

    menuData.forEach(category => {
        // Create Section
        const section = document.createElement('section');
        section.classList.add('menu-category');
        section.id = category.categoryId;

        const itemsHtml = category.items.map(renderProductCardHTML).join('');
        const catImage = CATEGORY_IMAGES[category.categoryId];
        const headerHtml = catImage
            ? `<div class="category-header"><img class="category-header-img" src="${imageSrc(catImage)}" alt="${category.title}"><h2>${category.title}</h2></div>`
            : `<h2>${category.title}</h2>`;
        section.innerHTML = `${headerHtml}<div class="product-grid">${itemsHtml}</div>`;
        gridContainer.appendChild(section);
    });
}

// --- Live Search Functionality ---

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
let overlay, cartSidebar;

function toggleCart() {
    if (!cartSidebar) return;
    cartSidebar.classList.toggle('open');
    checkOverlay();
}

function checkOverlay() {
    if (!overlay || !cartSidebar) return;
    if (cartSidebar.classList.contains('open')) {
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

    if (headerBadge) {
        headerBadge.style.display = 'flex';
        headerBadge.innerText = totalItems;
    }
}

// Opens the "Delivery Details" modal so the customer can confirm order
// type, name, phone, and (for delivery) their address before we build the
// WhatsApp message. Pre-fills fields from their last order, if any.
function checkoutViaWhatsApp() {
    if (cart.length === 0) return;

    const overlay = document.getElementById('checkout-details-overlay');
    if (!overlay) return;

    const savedType = localStorage.getItem('orderType') || 'Delivery';
    document.getElementById('cd-name').value = localStorage.getItem('customerName') || '';
    document.getElementById('cd-phone').value = localStorage.getItem('customerPhone') || '';
    document.getElementById('cd-address').value = localStorage.getItem('customerAddress') || '';
    document.getElementById('cd-error').style.display = 'none';
    document.getElementById('cd-location-status').textContent = '';
    document.getElementById('cd-location-status').className = 'cd-location-status';

    selectOrderType(savedType);
    overlay.classList.add('active');
}

function closeCheckoutDetails() {
    const overlay = document.getElementById('checkout-details-overlay');
    if (overlay) overlay.classList.remove('active');
}

// Highlights the chosen order type and shows/hides the address field
// (only Delivery orders need a drop-off address).
function selectOrderType(type) {
    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.orderType === type);
    });
    const addressGroup = document.getElementById('cd-address-group');
    if (addressGroup) addressGroup.style.display = (type === 'Delivery') ? 'block' : 'none';
}

function getSelectedOrderType() {
    const activeBtn = document.querySelector('.order-type-btn.active');
    return activeBtn ? activeBtn.dataset.orderType : 'Delivery';
}

// Uses the browser's geolocation API to grab the customer's exact
// coordinates and appends a Google Maps link to the address field, so the
// delivery rider can navigate straight to the pin instead of relying on a
// written description alone.
function useCurrentLocation() {
    const status = document.getElementById('cd-location-status');
    const addressField = document.getElementById('cd-address');

    if (!navigator.geolocation) {
        status.textContent = 'Location sharing is not supported on this browser.';
        status.className = 'cd-location-status err';
        return;
    }

    status.textContent = 'Getting your location…';
    status.className = 'cd-location-status';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
            // Strip any previously-attached map link before adding the new one.
            const existing = addressField.value.replace(/\s*Pin location: https:\/\/maps\.google\.com\/\?q=[^\s]+/, '').trim();
            addressField.value = existing ? `${existing}\nPin location: ${mapsLink}` : `Pin location: ${mapsLink}`;
            status.textContent = 'Location added ✓ — you can still add landmark details above.';
            status.className = 'cd-location-status ok';
        },
        (err) => {
            let msg = 'Could not get your location. Please type your address instead.';
            if (err.code === err.PERMISSION_DENIED) msg = 'Location access denied. Please type your address instead.';
            status.textContent = msg;
            status.className = 'cd-location-status err';
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Validates the details form, saves it for next time, then hands off to
// the WhatsApp message builder.
function confirmCheckoutDetails() {
    const errorEl = document.getElementById('cd-error');
    const name = document.getElementById('cd-name').value.trim();
    const phone = document.getElementById('cd-phone').value.trim();
    const address = document.getElementById('cd-address').value.trim();
    const orderType = getSelectedOrderType();

    if (!name) return showCdError('Please enter your full name.');
    if (!phone || phone.replace(/\D/g, '').length < 10) {
        return showCdError('Please enter a valid phone number so the rider can reach you.');
    }
    if (orderType === 'Delivery' && !address) {
        return showCdError('Please enter your delivery address, or share your current location.');
    }

    errorEl.style.display = 'none';

    localStorage.setItem('customerName', name);
    localStorage.setItem('customerPhone', phone);
    localStorage.setItem('customerAddress', address);
    localStorage.setItem('orderType', orderType);

    closeCheckoutDetails();
    sendOrderToWhatsApp({ name, phone, address, orderType });
}

function showCdError(message) {
    const errorEl = document.getElementById('cd-error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Builds an itemized order summary (including the customer's name, phone,
// order type, and delivery address) and opens a WhatsApp chat to the
// restaurant's number with the message pre-filled.
function sendOrderToWhatsApp({ name, phone, address, orderType }) {
    if (cart.length === 0) return;

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

    const addressLine = (orderType === 'Delivery' && address) ? `Delivery Address: ${address}\n` : '';

    const message =
`New Order Request - Hot N Spicy

Customer Name: ${name}
Phone: ${phone}
Order Type: ${orderType}
${addressLine}
Items:
${lines}

Total: Rs. ${subtotal}
Tax (15%): Rs. ${tax}
Grand Total: Rs. ${grandTotal}

${readyPlain}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
