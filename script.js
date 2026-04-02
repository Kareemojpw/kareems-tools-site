/* ===== THEME TOGGLE ===== */
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

function updateThemeIcon() {
    themeIcon.innerHTML = html.dataset.theme === 'dark' ? '&#9728;' : '&#9789;';
}

themeToggle.addEventListener('click', () => {
    const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = newTheme;
    updateThemeIcon();
    localStorage.setItem('theme', newTheme);
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.dataset.theme = savedTheme;
    updateThemeIcon();
} else {
    updateThemeIcon();
}

/* ===== MOBILE MENU ===== */
mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('open');
    }
});

/* ===== PREMIUM STATE CHECK ===== */
function isPremiumUser() {
    return localStorage.getItem('kareem_premium') === 'true';
}

/* ===== RENDER TOOLS ===== */
const grid = document.getElementById('toolsGrid');
const toolsCount = document.getElementById('toolsCount');
let currentCategory = 'all';
let currentSearch = '';

function renderTools(filter = 'all', search = '') {
    grid.innerHTML = '';
    const q = search.trim().toLowerCase();

    const filtered = TOOLS.filter(tool => {
        const matchCat = filter === 'all' || tool.category === filter;
        const matchSearch = !q ||
            tool.name.toLowerCase().includes(q) ||
            tool.desc.toLowerCase().includes(q) ||
            tool.category.toLowerCase().includes(q);
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No tools found</h3>
                <p>Try a different search term or category.</p>
            </div>
        `;
        toolsCount.textContent = '0 tools found';
        return;
    }

    const freeCount = TOOLS.filter(t => t.free).length;
    const premiumCount = TOOLS.filter(t => !t.free).length;
    toolsCount.textContent = `Showing ${filtered.length} of ${TOOLS.length} tools (${freeCount} free, ${premiumCount} premium)`;

    const premium = isPremiumUser();

    filtered.forEach((tool, i) => {
        const card = document.createElement('div');
        card.className = 'tool-card' + (!tool.free ? ' premium-card' : '');
        card.style.animationDelay = `${Math.min(i * 0.03, 0.6)}s`;

        const safeName = tool.name.replace(/'/g, "\\'");
        const isLocked = !tool.free && !premium;

        card.innerHTML = `
            <div class="tool-card-header">
                <div class="tool-icon">${tool.icon}</div>
                <span class="tool-badge ${tool.free ? 'badge-free' : 'badge-premium'}">
                    ${tool.free ? 'Free' : 'Premium'}
                </span>
            </div>
            <h3>${tool.name}</h3>
            <p>${tool.desc}</p>
            <span class="tool-category">${tool.category}</span>
            ${isLocked ? `
            <div class="premium-lock" onclick="event.stopPropagation(); showPaywall('${safeName}')">
                <div class="lock-icon">&#128274;</div>
                <div class="lock-text">Premium Tool</div>
                <div class="lock-hint">Unlock with a subscription</div>
                <button class="unlock-btn" onclick="event.stopPropagation(); showPaywall('${safeName}')">Unlock &#8594;</button>
            </div>` : ''}
        `;

        if (tool.free || premium) {
            card.addEventListener('click', () => {
                handleToolClick(tool);
            });
        }

        grid.appendChild(card);
    });
}

function handleToolClick(tool) {
    const msg = `Opening ${tool.name}...\n\nThis is a demo. In production, this would navigate to the tool interface.`;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: grid;
        place-items: center; z-index: 2000; backdrop-filter: blur(4px); animation: modalFadeIn 0.3s ease;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
        background: var(--glass-bg, rgba(255,255,255,0.05)); backdrop-filter: blur(30px);
        border: 1px solid var(--glass-border, rgba(255,255,255,0.1)); border-radius: 16px;
        padding: 2rem 2.5rem; max-width: 400px; text-align: center;
        color: var(--text-primary, #f0f0f5); font-family: Inter, sans-serif;
    `;
    box.innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:0.5rem">${tool.icon}</div>
        <h3 style="font-size:1.2rem;margin-bottom:0.75rem">${tool.name}</h3>
        <p style="color:var(--text-secondary, #a0a0b5);font-size:0.9rem;margin-bottom:1.5rem">${msg}</p>
        <button onclick="this.closest('div').parentElement.remove()" style="
            padding:0.6rem 1.5rem;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);
            color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:0.9rem;
            font-family:Inter,sans-serif;">Close</button>
    `;
    overlay.appendChild(box);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
}

renderTools();

/* ===== SEARCH ===== */
const toolSearch = document.getElementById('toolSearch');
let searchTimeout;
toolSearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = toolSearch.value;
        renderTools(currentCategory, currentSearch);
    }, 150);
});

/* ===== CATEGORY FILTER ===== */
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderTools(currentCategory, currentSearch);
    });
});

/* ===== PAYWALL ===== */
let selectedTier = 'yearly';

function showPaywall(toolName = 'AI Code Refactor Engine') {
    const modal = document.getElementById('paywallModal');
    document.getElementById('paywallToolName').textContent = toolName;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hidePaywall() {
    const modal = document.getElementById('paywallModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('paywallModal').addEventListener('click', (e) => {
    if (e.target.id === 'paywallModal') hidePaywall();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePaywall();
});

function processPayment() {
    alert(`Redirecting to payment for the ${selectedTier} plan.\n\nIn production, this would redirect to Stripe Checkout.\nOn success, localStorage would be set to mark user as premium.`);
    hidePaywall();
}

document.querySelectorAll('.tier').forEach(tier => {
    tier.addEventListener('click', () => {
        document.querySelectorAll('.tier').forEach(t => t.classList.remove('selected'));
        tier.classList.add('selected');
        selectedTier = tier.dataset.tier;
    });
});

document.querySelector('.tier.featured').classList.add('selected');

document.getElementById('upgradeBtn').addEventListener('click', () => showPaywall());

/* ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ===== */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.premium-glass, .about-glass, .hero-stats').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

/* ===== NAVBAR SCROLL EFFECT ===== */
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
        nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.15)';
    } else {
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

/* ===== PERFORMANCE: Debounced resize ===== */
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 900) {
            mobileMenuBtn.classList.remove('active');
            navLinks.classList.remove('open');
        }
    }, 100);
});

console.log(`KareemTools loaded: ${TOOLS.length} tools (${TOOLS.filter(t => t.free).length} free, ${TOOLS.filter(t => !t.free).length} premium)`);