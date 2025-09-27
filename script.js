// ========================================
// DESIGN PATTERNS IMPLEMENTATION
// ========================================

// ========================================
// FACTORY PATTERN - Product Creation
// ========================================

class ProductFactory {
    static createProduct(type, data) {
        switch (type) {
            case 'smartphone':
                return new Smartphone(data);
            case 'laptop':
                return new Laptop(data);
            case 'audio':
                return new AudioDevice(data);
            case 'camera':
                return new Camera(data);
            case 'gaming':
                return new GamingDevice(data);
            case 'smartHome':
                return new SmartHomeDevice(data);
            case 'bundle':
                return new Product(data);
            default:
                throw new Error(`Unknown product type: ${type}`);
        }
    }
}

// Helper: detect if a product already has a discount
function isProductAlreadyDiscounted(data) {
    return !!(data && (data.originalPrice || (data.badge && /sale|%/i.test(String(data.badge)))));
}
// DECORATOR OPTIONS MODAL (UI to apply Gift Wrap, warranty, Discount)
// ========================================
function showDecoratorOptions(productId) {
    const productData = PRODUCTS_CATALOG[productId];
    if (!productData) {
        showNotification('Product not found for options.', 'error');
        return;
    }
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h3>Customize Options</h3>
                <button class="close-modal" aria-label="Close">&times;</button>
            </div>
            <div class="cart-modal-body">
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div>
                        <label><input type="checkbox" id="opt-giftwrap"> Add Gift Wrap (+${Currency.fromUSD(15)})</label>
                    </div>
                    <div>
                        <label><input type="checkbox" id="opt-warranty"> Add 2-Year Warranty (+${Currency.fromUSD(50)})</label>
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:6px;">Discount</label>
                        <select id="opt-discount" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <option value="0">No Discount</option>
                            <option value="10">10% OFF</option>
                            <option value="15">15% OFF</option>
                            <option value="20">20% OFF</option>
                        </select>
                    </div>
                    <div class="cart-total" id="opt-total">Calculating...</div>
                </div>
            </div>
            <div class="cart-modal-footer">
                <button class="btn btn-secondary" id="opt-cancel">Cancel</button>
                <button class="btn btn-primary" id="opt-add">Add to Cart</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);


    const close = () => { modal.remove(); };
    // Ensure the X button closes the decorator options modal
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e)=>{ if (e.target === modal) close(); });
    modal.querySelector('#opt-cancel').addEventListener('click', close);

    const giftEl = modal.querySelector('#opt-giftwrap');
    const warEl = modal.querySelector('#opt-warranty');
    const discEl = modal.querySelector('#opt-discount');
    const totalEl = modal.querySelector('#opt-total');

    // Disable discount if product is already discounted (has originalPrice or Sale/% badge)
    const alreadyDiscounted = isProductAlreadyDiscounted(productData);
    if (alreadyDiscounted && discEl) {
        discEl.value = '0';
        discEl.disabled = true;
        const selectContainer = discEl.parentElement;
        if (selectContainer) selectContainer.style.display = 'none';
    }

    const computePreview = () => {
        try {
            const product = ProductFactory.createProduct(productData.category, productData);
            let decorated = product;
            if (!alreadyDiscounted && discEl && discEl.value && Number(discEl.value) > 0) {
                decorated = new DiscountDecorator(decorated, Number(discEl.value));
            }
            if (giftEl.checked) decorated = new GiftWrapDecorator(decorated);
            if (warEl.checked) decorated = new WarrantyExtensionDecorator(decorated);
            const price = (typeof decorated.getPrice === 'function') ? decorated.getPrice() : decorated.getDisplayPrice();
            totalEl.innerHTML = `<strong>Final price: ${Currency.fromUSD(price.current)}</strong>`;
        } catch (e) {
            console.error('Product price preview failed:', e, { productData, gift: giftEl.checked, warranty: warEl.checked, discount: discEl ? discEl.value : null });
            totalEl.textContent = 'Unable to compute price preview.';
        }
    };
    ['change','input'].forEach(evt => {
        giftEl.addEventListener(evt, computePreview);
        warEl.addEventListener(evt, computePreview);
        if (discEl) discEl.addEventListener(evt, computePreview);
    });
    computePreview();

    modal.querySelector('#opt-add').addEventListener('click', () => {
        const decorators = [];
        const disc = Number(discEl.value || 0);
        // Only apply discount if product isn't already discounted
        if (!alreadyDiscounted && disc > 0) {
            decorators.push((p) => new DiscountDecorator(p, disc));
        }
        if (giftEl.checked) decorators.push(GiftWrapDecorator);
        if (warEl.checked) decorators.push(WarrantyExtensionDecorator);
        addToCartWithDecorators(productId, decorators);
        close();
    });
}


// Base Product Class
class Product {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.price = data.price;
        this.originalPrice = data.originalPrice;
        this.category = data.category;
        this.badge = data.badge;
        this.icon = data.icon;
        this.features = data.features || [];
    }

    getDisplayPrice() {
        return this.originalPrice ? 
            { current: this.price, original: this.originalPrice } : 
            { current: this.price };
    }

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            price: this.getDisplayPrice(),
            category: this.category,
            badge: this.badge,
            icon: this.icon,
            features: this.features
        };
    }
}

// Specific Product Types
class Smartphone extends Product {
    constructor(data) {
        super(data);
        this.screenSize = data.screenSize || '6.1"';
        this.storage = data.storage || '128GB';
        this.features.push('5G Connectivity', 'Wireless Charging');
    }
}

class Laptop extends Product {
    constructor(data) {
        super(data);
        this.processor = data.processor || 'M3 Chip';
        this.ram = data.ram || '16GB';
        this.storage = data.storage || '512GB SSD';
        this.features.push('Retina Display', 'All-day Battery');
    }
}

class AudioDevice extends Product {
    constructor(data) {
        super(data);
        this.batteryLife = data.batteryLife || '6 hours';
        this.noiseCancellation = data.noiseCancellation || true;
        this.features.push('Active Noise Cancellation', 'Spatial Audio');
    }
}

class Camera extends Product {
    constructor(data) {
        super(data);
        this.megapixels = data.megapixels || '45MP';
        this.videoResolution = data.videoResolution || '8K';
        this.features.push('Image Stabilization', '4K Video Recording');
    }
}

class GamingDevice extends Product {
    constructor(data) {
        super(data);
        this.platform = data.platform || 'PC';
        this.genre = data.genre || 'Action';
        this.features.push('High Performance', 'RGB Lighting');
    }
}

class SmartHomeDevice extends Product {
    constructor(data) {
        super(data);
        this.connectivity = data.connectivity || 'WiFi';
        this.voiceControl = data.voiceControl || true;
        this.features.push('Voice Control', 'Smart Integration');
    }
}

// ========================================
// DECORATOR PATTERN - Additional Features
// ========================================

class ProductDecorator {
    constructor(product) {
        this.product = product;
    }

    getInfo() {
        return this.product.getInfo();
    }

    getPrice() {
        // Support chaining: if the wrapped object is already a decorator,
        // prefer its getPrice(); otherwise fall back to base product price getters.
        if (this.product && typeof this.product.getPrice === 'function') {
            return this.product.getPrice();
        }
        if (this.product && typeof this.product.getDisplayPrice === 'function') {
            return this.product.getDisplayPrice();
        }
        // Ultimate fallback if a plain object slips through
        const current = Number((this.product && this.product.price) || 0);
        const original = (this.product && this.product.originalPrice) != null
            ? Number(this.product.originalPrice)
            : null;
        return { current, original };
    }
}

class GiftWrapDecorator extends ProductDecorator {
    constructor(product) {
        super(product);
        this.giftWrapPrice = 15;
    }

    getInfo() {
        const info = super.getInfo();
        info.features.push('Gift Wrap Included');
        return info;
    }

    getPrice() {
        const price = super.getPrice();
        return {
            current: Number(price.current || 0) + Number(this.giftWrapPrice),
            original: price.original != null ? Number(price.original || 0) + Number(this.giftWrapPrice) : null
        };
    }
}

class WarrantyExtensionDecorator extends ProductDecorator {
    constructor(product) {
        super(product);
        this.warrantyPrice = 50;
    }

    getInfo() {
        const info = super.getInfo();
        info.features.push('Extended 2-Year Warranty');
        return info;
    }

    getPrice() {
        const price = super.getPrice();
        return {
            current: Number(price.current || 0) + Number(this.warrantyPrice),
            original: price.original != null ? Number(price.original || 0) + Number(this.warrantyPrice) : null
        };
    }
}

class DiscountDecorator extends ProductDecorator {
    constructor(product, discountPercent) {
        super(product);
        this.discountPercent = discountPercent;
    }

    getInfo() {
        const info = super.getInfo();
        info.badge = `${this.discountPercent}% OFF`;
        return info;
    }

    getPrice() {
        const price = super.getPrice();
        const base = Number(price.current || 0);
        const discountAmount = (base * Number(this.discountPercent || 0)) / 100;
        return {
            current: base - discountAmount,
            original: base
        };
    }
}

const PRODUCTS_CATALOG = {
    // Main page products
    'iphone-15-pro': {
        id: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with advanced features',
        price: 999,
        originalPrice: 1099,
        category: 'smartphone',
        badge: 'New',
        icon: 'fas fa-mobile-alt'
    },
    'macbook-pro-m3': {
        id: 'macbook-pro-m3',
        name: 'MacBook Pro M3',
        description: 'Powerful laptop for professionals',
        price: 1999,
        originalPrice: 2199,
        category: 'laptop',
        badge: 'Sale',
        icon: 'fas fa-laptop'
    },
    'airpods-pro': {
        id: 'airpods-pro',
        name: 'AirPods Pro',
        description: 'Wireless earbuds with noise cancellation',
        price: 249,
        category: 'audio',
        icon: 'fas fa-headphones'
    },
    'canon-eos-r5': {
        id: 'canon-eos-r5',
        name: 'Canon EOS R5',
        description: 'Professional mirrorless camera',
        price: 3899,
        category: 'camera',
        icon: 'fas fa-camera'
    },

    // Smartphones
    'iphone-15-pro-max': {
        id: 'iphone-15-pro-max',
        name: 'iPhone 15 Pro Max',
        description: 'Latest Apple flagship with titanium design and A17 Pro chip',
        price: 1199,
        category: 'smartphone',
        badge: 'New',
        icon: 'fas fa-mobile-alt'
    },
    'samsung-s24-ultra': {
        id: 'samsung-s24-ultra',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium Android smartphone with S Pen and advanced AI features',
        price: 1299,
        category: 'smartphone',
        badge: 'Popular',
        icon: 'fas fa-mobile-alt'
    },
    'pixel-8-pro': {
        id: 'pixel-8-pro',
        name: 'Google Pixel 8 Pro',
        description: 'AI-powered smartphone with exceptional camera capabilities',
        price: 999,
        category: 'smartphone',
        icon: 'fas fa-mobile-alt'
    },
    'oneplus-12': {
        id: 'oneplus-12',
        name: 'OnePlus 12',
        description: 'Flagship killer with Snapdragon 8 Gen 3 and 100W fast charging',
        price: 799,
        originalPrice: 899,
        category: 'smartphone',
        badge: 'Sale',
        icon: 'fas fa-mobile-alt'
    },
    'xiaomi-14-ultra': {
        id: 'xiaomi-14-ultra',
        name: 'Xiaomi 14 Ultra',
        description: 'Professional photography smartphone with Leica optics',
        price: 1199,
        category: 'smartphone',
        icon: 'fas fa-mobile-alt'
    },
    'nothing-phone-2a': {
        id: 'nothing-phone-2a',
        name: 'Nothing Phone (2a)',
        description: 'Unique transparent design with Glyph interface',
        price: 349,
        category: 'smartphone',
        icon: 'fas fa-mobile-alt'
    },

    // Laptops
    'macbook-pro-m3-max': {
        id: 'macbook-pro-m3-max',
        name: 'MacBook Pro M3 Max',
        description: 'Ultimate performance laptop with M3 Max chip and Liquid Retina XDR display',
        price: 3199,
        category: 'laptop',
        badge: 'New',
        icon: 'fas fa-laptop'
    },
    'dell-xps-15': {
        id: 'dell-xps-15',
        name: 'Dell XPS 15',
        description: 'Premium Windows laptop with stunning 4K OLED display',
        price: 2199,
        category: 'laptop',
        badge: 'Popular',
        icon: 'fas fa-laptop'
    },
    'asus-rog-g14': {
        id: 'asus-rog-g14',
        name: 'ASUS ROG Zephyrus G14',
        description: 'Gaming laptop with AMD Ryzen 9 and RTX 4070',
        price: 1599,
        category: 'laptop',
        icon: 'fas fa-laptop'
    },
    'hp-spectre-x360': {
        id: 'hp-spectre-x360',
        name: 'HP Spectre x360',
        description: '2-in-1 convertible laptop with 13th Gen Intel Core i7',
        price: 1299,
        originalPrice: 1499,
        category: 'laptop',
        badge: 'Sale',
        icon: 'fas fa-laptop'
    },
    'thinkpad-x1-carbon': {
        id: 'thinkpad-x1-carbon',
        name: 'Lenovo ThinkPad X1 Carbon',
        description: 'Business laptop with exceptional durability and performance',
        price: 1899,
        category: 'laptop',
        icon: 'fas fa-laptop'
    },
    'surface-laptop-studio-2': {
        id: 'surface-laptop-studio-2',
        name: 'Surface Laptop Studio 2',
        description: 'Creative laptop with dynamic woven hinge and touchscreen',
        price: 1999,
        category: 'laptop',
        icon: 'fas fa-laptop'
    },

    // Audio
    'airpods-pro-2': {
        id: 'airpods-pro-2',
        name: 'AirPods Pro 2nd Gen',
        description: 'Wireless earbuds with active noise cancellation and spatial audio',
        price: 249,
        category: 'audio',
        badge: 'New',
        icon: 'fas fa-headphones'
    },
    'sony-wh1000xm5': {
        id: 'sony-wh1000xm5',
        name: 'Sony WH-1000XM5',
        description: 'Industry-leading noise canceling wireless headphones',
        price: 399,
        category: 'audio',
        badge: 'Popular',
        icon: 'fas fa-headphones'
    },
    'bose-qc-ultra': {
        id: 'bose-qc-ultra',
        name: 'Bose QuietComfort Ultra',
        description: 'Premium noise-canceling headphones with immersive audio',
        price: 429,
        category: 'audio',
        icon: 'fas fa-headphones'
    },
    'sennheiser-hd660s2': {
        id: 'sennheiser-hd660s2',
        name: 'Sennheiser HD 660S2',
        description: 'Reference-class open-back headphones for audiophiles',
        price: 499,
        originalPrice: 599,
        category: 'audio',
        badge: 'Sale',
        icon: 'fas fa-headphones'
    },
    'jbl-live-pro-2': {
        id: 'jbl-live-pro-2',
        name: 'JBL Live Pro 2',
        description: 'True wireless earbuds with JBL Signature Sound',
        price: 149,
        category: 'audio',
        icon: 'fas fa-headphones'
    },
    'ath-m50xbt2': {
        id: 'ath-m50xbt2',
        name: 'Audio-Technica ATH-M50xBT2',
        description: 'Professional monitor headphones with wireless connectivity',
        price: 199,
        category: 'audio',
        icon: 'fas fa-headphones'
    },

    // Cameras
    'canon-r5-mark-ii': {
        id: 'canon-r5-mark-ii',
        name: 'Canon EOS R5 Mark II',
        description: 'Professional mirrorless camera with 8K video recording',
        price: 3899,
        category: 'camera',
        badge: 'New',
        icon: 'fas fa-camera'
    },
    'sony-a7r-v': {
        id: 'sony-a7r-v',
        name: 'Sony A7R V',
        description: 'High-resolution mirrorless camera with 61MP sensor',
        price: 3898,
        category: 'camera',
        badge: 'Popular',
        icon: 'fas fa-camera'
    },
    'nikon-z9': {
        id: 'nikon-z9',
        name: 'Nikon Z9',
        description: 'Flagship mirrorless camera with advanced autofocus',
        price: 5499,
        category: 'camera',
        icon: 'fas fa-camera'
    },
    'fujifilm-xt5': {
        id: 'fujifilm-xt5',
        name: 'Fujifilm X-T5',
        description: 'Compact mirrorless camera with 40MP sensor',
        price: 1699,
        originalPrice: 1899,
        category: 'camera',
        badge: 'Sale',
        icon: 'fas fa-camera'
    },
    'panasonic-gh6': {
        id: 'panasonic-gh6',
        name: 'Panasonic Lumix GH6',
        description: 'Video-focused mirrorless camera with 5.7K recording',
        price: 2197,
        category: 'camera',
        icon: 'fas fa-camera'
    },
    'leica-q3': {
        id: 'leica-q3',
        name: 'Leica Q3',
        description: 'Premium compact camera with 60MP sensor',
        price: 5995,
        category: 'camera',
        icon: 'fas fa-camera'
    },

    // Gaming
    'ps5-pro': {
        id: 'ps5-pro',
        name: 'PlayStation 5 Pro',
        description: 'Next-generation gaming console with enhanced performance',
        price: 699,
        category: 'gaming',
        badge: 'New',
        icon: 'fas fa-gamepad'
    },
    'xbox-series-x': {
        id: 'xbox-series-x',
        name: 'Xbox Series X',
        description: 'Most powerful Xbox console with 4K gaming',
        price: 499,
        category: 'gaming',
        badge: 'Popular',
        icon: 'fas fa-gamepad'
    },
    'switch-oled': {
        id: 'switch-oled',
        name: 'Nintendo Switch OLED',
        description: 'Handheld gaming console with vibrant OLED display',
        price: 349,
        category: 'gaming',
        icon: 'fas fa-gamepad'
    },
    'steam-deck-oled': {
        id: 'steam-deck-oled',
        name: 'Steam Deck OLED',
        description: 'Portable PC gaming device with OLED screen',
        price: 549,
        originalPrice: 649,
        category: 'gaming',
        badge: 'Sale',
        icon: 'fas fa-gamepad'
    },
    'rog-ally': {
        id: 'rog-ally',
        name: 'ASUS ROG Ally',
        description: 'Windows gaming handheld with AMD Ryzen Z1',
        price: 699,
        category: 'gaming',
        icon: 'fas fa-gamepad'
    },
    'razer-edge-5g': {
        id: 'razer-edge-5g',
        name: 'Razer Edge 5G',
        description: '5G-enabled Android gaming handheld',
        price: 399,
        category: 'gaming',
        icon: 'fas fa-gamepad'
    },

    // Smart Home
    'echo-show-15': {
        id: 'echo-show-15',
        name: 'Amazon Echo Show 15',
        description: '15-inch smart display with Alexa and Fire TV',
        price: 249,
        category: 'smartHome',
        badge: 'New',
        icon: 'fas fa-home'
    },
    'nest-hub-max': {
        id: 'nest-hub-max',
        name: 'Google Nest Hub Max',
        description: 'Smart display with Google Assistant and camera',
        price: 229,
        category: 'smartHome',
        badge: 'Popular',
        icon: 'fas fa-home'
    },
    'philips-hue': {
        id: 'philips-hue',
        name: 'Philips Hue Smart Bulbs',
        description: 'Color-changing smart LED bulbs with app control',
        price: 49,
        category: 'smartHome',
        icon: 'fas fa-home'
    },
    'ring-doorbell-pro-2': {
        id: 'ring-doorbell-pro-2',
        name: 'Ring Video Doorbell Pro 2',
        description: 'Smart doorbell with HD video and motion detection',
        price: 199,
        originalPrice: 249,
        category: 'smartHome',
        badge: 'Sale',
        icon: 'fas fa-home'
    },
    'ecobee-thermostat': {
        id: 'ecobee-thermostat',
        name: 'Ecobee Smart Thermostat',
        description: 'Energy-saving smart thermostat with voice control',
        price: 249,
        category: 'smartHome',
        icon: 'fas fa-home'
    },
    'arlo-pro-4': {
        id: 'arlo-pro-4',
        name: 'Arlo Pro 4 Security Camera',
        description: 'Wireless security camera with 2K video and night vision',
        price: 199,
        category: 'smartHome',
        icon: 'fas fa-home'
    },

    // Deals (duplicates allowed if already listed)
    'samsung-s23': {
        id: 'samsung-s23',
        name: 'Samsung Galaxy S23',
        description: 'Flagship smartphone with advanced camera system',
        price: 299,
        originalPrice: 999,
        category: 'smartphone',
        badge: '70% OFF',
        icon: 'fas fa-mobile-alt'
    },
    'dell-xps13': {
        id: 'dell-xps13',
        name: 'Dell XPS 13',
        description: 'Ultra-thin laptop with stunning display',
        price: 799,
        originalPrice: 1999,
        category: 'laptop',
        badge: '60% OFF',
        icon: 'fas fa-laptop'
    },
    'nikon-z6ii': {
        id: 'nikon-z6ii',
        name: 'Nikon Z6 II',
        description: 'Professional mirrorless camera',
        price: 1649,
        originalPrice: 2999,
        category: 'camera',
        badge: '45% OFF',
        icon: 'fas fa-camera'
    },
    'ps5': {
        id: 'ps5',
        name: 'PlayStation 5',
        description: 'Next-gen gaming console',
        price: 269,
        originalPrice: 599,
        category: 'gaming',
        badge: '55% OFF',
        icon: 'fas fa-gamepad'
    },
    'echo-dot': {
        id: 'echo-dot',
        name: 'Amazon Echo Dot',
        description: 'Smart speaker with Alexa',
        price: 29,
        originalPrice: 49,
        category: 'smartHome',
        badge: '40% OFF',
        icon: 'fas fa-home'
    }
};

// ========================================
// OBSERVER PATTERN - Cart Management
// ========================================

class CartObserver {
    update(cart) {
        // Abstract method - to be implemented by concrete observers
    }
}

class CartCountObserver extends CartObserver {
    constructor(cartCountElement) {
        super();
        this.cartCountElement = cartCountElement;
    }

    update(cart) {
        const totalItems = cart.getTotalItems();
        this.cartCountElement.textContent = totalItems;
        this.cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

class CartModalObserver extends CartObserver {
    constructor(modalElement) {
        super();
        this.modalElement = modalElement;
    }

    update(cart) {
        if (this.modalElement) {
            this.updateModalContent(cart);
        }
    }

    updateModalContent(cart) {
        const items = cart.getItems();
        const modalBody = this.modalElement.querySelector('.cart-modal-body');
        
        if (items.length === 0) {
            modalBody.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        let itemsHtml = '<div class="cart-items">';
        items.forEach(item => {
            itemsHtml += `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${Currency.fromUSD(item.price)} each</p>
                    </div>
                    <div class="item-actions" style="display:flex;align-items:center;gap:8px;">
                        <button class="btn" style="padding:6px 10px;" onclick="cart.decrementItem('${item.id}')">-</button>
                        <span aria-label="quantity" style="min-width:24px;text-align:center;">${item.quantity}</span>
                        <button class="btn" style="padding:6px 10px;" onclick="cart.incrementItem('${item.id}')">+</button>
                        <button onclick="cart.removeItem('${item.id}')" class="remove-btn" style="margin-left:8px;">Remove</button>
                    </div>
                </div>
            `;
        });
        itemsHtml += '</div>';
        itemsHtml += `<div class="cart-total"><strong>Total: ${Currency.fromUSD(cart.getTotalPrice())}</strong></div>`;
        
        modalBody.innerHTML = itemsHtml;
    }
}

class CartTotalObserver extends CartObserver {
    constructor(totalElement) {
        super();
        this.totalElement = totalElement;
    }

    update(cart) {
        if (this.totalElement) {
            this.totalElement.textContent = Currency.fromUSD(cart.getTotalPrice());
        }
    }
}

class Cart {
    constructor() {
        this.items = [];
        this.observers = [];
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notifyObservers() {
        this.observers.forEach(observer => observer.update(this));
    }

    addItem(product, decorators = []) {
        let decoratedProduct = product;
        
        // Apply decorators
        decorators.forEach(decorator => {
            // Support decorator classes (new Decorator(product)) and factory functions (p => new Decorator(p, arg))
            if (typeof decorator === 'function') {
                try {
                    const maybe = decorator(decoratedProduct);
                    if (maybe && typeof maybe.getInfo === 'function') {
                        decoratedProduct = maybe;
                    } else {
                        // If factory didn't return instance, assume class
                        decoratedProduct = new decorator(decoratedProduct);
                    }
                } catch (e) {
                    // If calling as function fails (class without new), instantiate as class
                    decoratedProduct = new decorator(decoratedProduct);
                }
            }
        });

        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            // Get price - use getPrice() if it exists (decorated), otherwise use getDisplayPrice()
            let price;
            if (typeof decoratedProduct.getPrice === 'function') {
                price = decoratedProduct.getPrice();
            } else {
                price = decoratedProduct.getDisplayPrice();
            }
            
            this.items.push({
                id: product.id,
                name: product.name,
                price: price.current,
                quantity: 1,
                product: decoratedProduct
            });
        }
        
        this.notifyObservers();
        this.saveToStorage();
    }

    incrementItem(productId) {
        const item = this.items.find(i => i.id === productId);
        if (item) {
            item.quantity += 1;
            this.notifyObservers();
            this.saveToStorage();
        }
    }

    decrementItem(productId) {
        const item = this.items.find(i => i.id === productId);
        if (!item) return;
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            this.items = this.items.filter(i => i.id !== productId);
        }
        this.notifyObservers();
        this.saveToStorage();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.notifyObservers();
        this.saveToStorage();
    }

    getItems() {
        return this.items;
    }

    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getTotalPrice() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    clear() {
        this.items = [];
        this.notifyObservers();
        this.saveToStorage();
    }

    saveToStorage() {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
    }

    loadFromStorage() {
        const savedItems = localStorage.getItem('cartItems');
        if (savedItems) {
            this.items = JSON.parse(savedItems);
            this.notifyObservers();
        }
    }
}

const cart = new Cart();

let mobileMenuToggle, navMenu, cartBtn, cartCount, searchInput, timerElements;

let isMenuOpen = false;

function setupCategoryLinks() {
    const map = new Map([
        ['smartphones', 'smartphones.html'],
        ['laptops', 'laptops.html'],
        ['audio', 'audio.html'],
        ['cameras', 'cameras.html'],
        ['gaming', 'gaming.html'],
        ['smart home', 'smart-home.html'],
    ]);

    document.querySelectorAll('.category-card').forEach(card => {
        const titleEl = card.querySelector('h3');
        if (!titleEl) return;
        const key = titleEl.textContent.trim().toLowerCase();
        const href = map.get(key);
        if (!href) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.location.href = href;
        });
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const path = window.location.pathname;
        if (path.includes('category-') && path.endsWith('.html')) {
            const redirected = path.replace('category-', '');
            const rest = window.location.search + window.location.hash;
            window.location.replace(redirected + rest);
            return;
        }
    } catch (_) { /* no-op */ }
    initializeDOMElements();
    
    initializeCart();
    initializeEventListeners();
    await Currency.init();
    convertPricesOnPage();
    convertBundleTexts();
    startCountdownTimer();
    initializeAnimations();
    
    setTimeout(() => {
        setupAddToCartButtons();
    }, 100);
});

function initializeDOMElements() {
    mobileMenuToggle = document.getElementById('mobileMenuToggle');
    navMenu = document.getElementById('navMenu');
    cartBtn = document.getElementById('cartBtn');
    cartCount = document.querySelector('.cart-count');
    searchInput = document.getElementById('searchInput');
    timerElements = {
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds')
    };
    
    console.log('DOM Elements initialized:', {
        mobileMenuToggle: !!mobileMenuToggle,
        navMenu: !!navMenu,
        cartBtn: !!cartBtn,
        cartCount: !!cartCount,
        searchInput: !!searchInput,
        timerElements: {
            hours: !!timerElements.hours,
            minutes: !!timerElements.minutes,
            seconds: !!timerElements.seconds
        }
    });
}

function showSearchResultsModal(query, results) {
    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h3>Search results for "${query}"</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="cart-modal-body">
                ${results.length === 0 ? '<p>No products found.</p>' : '<div class="cart-items"></div>'}
            </div>
            <div class="cart-modal-footer">
                <button class="btn btn-secondary" onclick="closeCartModal()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', closeCartModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeCartModal(); });

    if (results.length > 0) {
        const body = modal.querySelector('.cart-items');
        let html = '';
        results.forEach(item => {
            html += `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${Currency.fromUSD(Number(item.price))} ${item.originalPrice ? `<span style=\"text-decoration:line-through;color:#999;margin-left:6px;\">${Currency.fromUSD(Number(item.originalPrice))}</span>` : ''}</p>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary add-to-cart" data-product="${item.id}">Add to Cart</button>
                    </div>
                </div>
            `;
        });
        body.innerHTML = html;
        setupAddToCartButtons();
    }
}

function initializeCart() {
    if (cartCount) {
        cart.addObserver(new CartCountObserver(cartCount));
    }
    
    cart.loadFromStorage();
}

function initializeEventListeners() {
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', showCartModal);
    }

    setupCategoryLinks();

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                performSearch();
            });
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (isMenuOpen && !navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });

    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach(button => {
        button.addEventListener('click', handleHeroButtonClick);
    });

    const shopSaleBtn = document.querySelector('.deals .btn-primary');
    if (shopSaleBtn) {
        shopSaleBtn.addEventListener('click', () => {
            window.location.href = 'deals.html';
        });
    }

    setupBundleButtons();
}

function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    console.log('Found add to cart buttons:', addToCartButtons.length);
    
    addToCartButtons.forEach(button => {
        button.removeEventListener('click', handleAddToCartClick);
        button.addEventListener('click', handleAddToCartClick);
    });
}

function handleAddToCartClick(event) {
    event.preventDefault();
    const productId = this.getAttribute('data-product');
    console.log('Add to cart clicked for product:', productId);
    
    if (productId) {
        showDecoratorOptions(productId);
    } else {
        console.error('No product ID found for button:', this);
        showNotification('Error: Product not found', 'error');
    }
}

function addToCart(productId) {
    console.log('Adding to cart:', productId);
    const productData = PRODUCTS_CATALOG[productId];
    if (productData) {
        console.log('Product data found:', productData);
        try {
            if (!cart) {
                throw new Error('Cart not initialized');
            }
            if (!ProductFactory) {
                throw new Error('ProductFactory not available');
            }
            const product = ProductFactory.createProduct(productData.category, productData);
            console.log('Product created:', product);
            cart.addItem(product);
            console.log('Product added to cart successfully');
            
            showNotification('Item added to cart!', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            console.error('Error details:', {
                productId: productId,
                productData: productData,
                cart: cart,
                ProductFactory: ProductFactory,
                error: error.message
            });
            showNotification(`Error adding item to cart: ${error.message}`, 'error');
        }
    } else {
        console.error('Product not found:', productId);
        console.error('Available products:', Object.keys(PRODUCTS_CATALOG));
        showNotification(`Product not found: ${productId}`, 'error');
    }
}

function addToCartWithDecorators(productId, decorators = []) {
    console.log('Adding to cart with decorators:', productId, decorators);
    const productData = PRODUCTS_CATALOG[productId];
    if (!productData) {
        showNotification(`Product not found: ${productId}`, 'error');
        return;
    }
    try {
        const product = ProductFactory.createProduct(productData.category, productData);
        cart.addItem(product, decorators);
        showNotification('Item added to cart!', 'success');
    } catch (e) {
        console.error('Error adding to cart with decorators:', e);
        showNotification('Failed to add item with selected options.', 'error');
    }
}

// Mobile Menu Functions
function toggleMobileMenu() {
    if (isMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    navMenu.classList.add('active');
    mobileMenuToggle.innerHTML = '<i class="fas fa-times"></i>';
    isMenuOpen = true;
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    isMenuOpen = false;
    document.body.style.overflow = 'auto';
}

function showCartModal() {
    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h3>Shopping Cart</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="cart-modal-body">
                <p>Loading cart...</p>
            </div>
            <div class="cart-modal-footer">
                <button class="btn btn-secondary" onclick="closeCartModal()">Continue Shopping</button>
                <button class="btn btn-primary" onclick="proceedToCheckout()">Checkout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
        .cart-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }
        .cart-modal-content {
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease;
        }
        .cart-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
        }
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }
        .item-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .item-info p {
            margin: 0;
            color: #667eea;
            font-weight: 600;
        }
        .remove-btn {
            background: #ff4757;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        .cart-total {
            margin: 20px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            text-align: center;
            font-size: 1.2rem;
        }
        .cart-modal-footer {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    const cartModalObserver = new CartModalObserver(modal);
    cart.addObserver(cartModalObserver);
    
    modal.querySelector('.close-modal').addEventListener('click', closeCartModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCartModal();
        }
    });
    
    cartModalObserver.update(cart);
}

function closeCartModal() {
    const modal = document.querySelector('.cart-modal');
    if (modal) {
        modal.remove();
    }
}

function proceedToCheckout() {
    if (cart.getTotalItems() === 0) {
        showNotification('Your cart is empty. Add items before checking out.', 'error');
        return;
    }
    cart.clear();
    showNotification('Checkout successful! Thank you for your purchase.', 'success');
    closeCartModal();
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    filterProducts(query);
}

function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
        filterProducts(query);
        const lower = query.toLowerCase();
        const results = Object.values(PRODUCTS_CATALOG).filter(p =>
            p.name.toLowerCase().includes(lower) ||
            (p.description && p.description.toLowerCase().includes(lower)) ||
            (p.category && p.category.toLowerCase().includes(lower))
        );
        showSearchResultsModal(query, results);
    }
}

function filterProducts(query) {
    const productCards = document.querySelectorAll('.product-card');
    const categoryCards = document.querySelectorAll('.category-card');
    
    if (!query) {
        productCards.forEach(card => card.style.display = 'block');
        categoryCards.forEach(card => card.style.display = 'block');
        return;
    }
    
    productCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    categoryCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function startCountdownTimer() {
    if (!timerElements.hours || !timerElements.minutes || !timerElements.seconds) {
        return;
    }
    
    const targetTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    
    const timer = setInterval(function() {
        const now = new Date().getTime();
        const distance = targetTime - now;
        
        if (distance < 0) {
            clearInterval(timer);
            resetTimer();
            return;
        }
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timerElements.hours.textContent = hours.toString().padStart(2, '0');
        timerElements.minutes.textContent = minutes.toString().padStart(2, '0');
        timerElements.seconds.textContent = seconds.toString().padStart(2, '0');
    }, 1000);
}

function resetTimer() {
    if (timerElements.hours && timerElements.minutes && timerElements.seconds) {
        timerElements.hours.textContent = '23';
        timerElements.minutes.textContent = '59';
        timerElements.seconds.textContent = '59';
        startCountdownTimer();
    }
}

function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const animatedElements = document.querySelectorAll('.category-card, .product-card, .deals-banner');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        }
        .notification-success { background: #28a745; }
        .notification-info { background: #17a2b8; }
        .notification-error { background: #dc3545; }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

const Currency = {
    symbol: '₱',
    rate: 56.0, // fallback rate; will be updated from API
    lastUpdated: null,
    async init() {
        try {
            // Try cached rate first (valid for 12 hours)
            const cached = localStorage.getItem('usd_php_rate_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.rate && parsed.timestamp && (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000)) {
                    this.rate = parsed.rate;
                    this.lastUpdated = parsed.timestamp;
                    return;
                }
            }
            // Fetch live exchange rate from a free API
            const resp = await fetch('https://open.er-api.com/v6/latest/USD');
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.rates && data.rates.PHP) {
                    this.rate = Number(data.rates.PHP);
                    this.lastUpdated = Date.now();
                    localStorage.setItem('usd_php_rate_cache', JSON.stringify({ rate: this.rate, timestamp: this.lastUpdated }));
                }
            }
        } catch (e) {
            console.warn('Currency rate fetch failed, using fallback rate.', e);
        }
    },
    usdToPhp(amountUSD) {
        const n = Number(amountUSD) || 0;
        return n * this.rate;
    },
    formatPHP(amountPHP) {
        const n = Number(amountPHP) || 0;
        return this.symbol + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    fromUSD(amountUSD) {
        return this.formatPHP(this.usdToPhp(amountUSD));
    }
};

function convertPricesOnPage() {
    // Convert elements with .current-price and .original-price
    document.querySelectorAll('.current-price, .original-price').forEach(el => {
        const txt = el.textContent.trim();
        if (txt.startsWith('$')) {
            const usd = Number(txt.replace(/[$,]/g, ''));
            if (!isNaN(usd)) {
                el.textContent = Currency.fromUSD(usd);
            }
        }
    });
}

function convertBundleTexts() {
    document.querySelectorAll('.bundle-card p').forEach(p => {
        const txt = p.textContent;
        const replaced = txt.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g, (m, num) => {
            const usd = Number(num.replace(/,/g, ''));
            return Currency.fromUSD(usd);
        });
        p.textContent = replaced;
    });
}

function setupBundleButtons() {
    const bundleCards = document.querySelectorAll('.special-offers .bundle-card');
    if (!bundleCards || bundleCards.length === 0) return;

    const bundles = [
        { id: 'bundle-audio', name: 'Audio Bundle', description: 'Sony WH-1000XM5 + AirPods Pro', priceUSD: 399 },
        { id: 'bundle-mobile', name: 'Mobile Bundle', description: 'iPhone 15 Pro + AirPods Pro + Case', priceUSD: 1199 },
        { id: 'bundle-work', name: 'Work Bundle', description: 'MacBook Pro M3 + Magic Mouse + Keyboard', priceUSD: 2199 }
    ];

    bundleCards.forEach((card, index) => {
        const btn = card.querySelector('.btn');
        const info = bundles[index];
        if (btn && info) {
            btn.addEventListener('click', () => showDecoratorOptionsForBundle(info));
        }
    });
}

function addBundleToCart(bundleInfo) {
    try {
        const productData = {
            id: bundleInfo.id,
            name: bundleInfo.name,
            description: bundleInfo.description,
            price: bundleInfo.priceUSD,
            category: 'bundle',
            badge: 'Bundle',
            icon: 'fas fa-boxes'
        };
        const product = ProductFactory.createProduct('bundle', productData);
        cart.addItem(product);
        showNotification(`${bundleInfo.name} added to cart!`, 'success');
    } catch (e) {
        console.error('Failed to add bundle:', e);
        showNotification('Failed to add bundle to cart.', 'error');
    }
}

function showDecoratorOptionsForBundle(bundleInfo) {
    const productData = {
        id: bundleInfo.id,
        name: bundleInfo.name,
        description: bundleInfo.description,
        price: bundleInfo.priceUSD,
        category: 'bundle',
        badge: 'Bundle',
        icon: 'fas fa-boxes'
    };

    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.innerHTML = `
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h3>Customize Bundle</h3>
                <button class="close-modal" aria-label="Close">&times;</button>
            </div>
            <div class="cart-modal-body">
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div>
                        <label><input type="checkbox" id="opt-giftwrap"> Add Gift Wrap (+${Currency.fromUSD(15)})</label>
                    </div>
                    <div>
                        <label><input type="checkbox" id="opt-warranty"> Add 2-Year Warranty (+${Currency.fromUSD(50)})</label>
                    </div>
                    <div class="cart-total" id="opt-total">Calculating...</div>
                </div>
            </div>
            <div class="cart-modal-footer">
                <button class="btn btn-secondary" id="opt-cancel">Cancel</button>
                <button class="btn btn-primary" id="opt-add">Add Bundle</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    // Styles moved to design.css

    const close = () => { modal.remove(); };
    modal.querySelector('.close-modal').addEventListener('click', close);
    modal.addEventListener('click', (e)=>{ if (e.target === modal) close(); });
    modal.querySelector('#opt-cancel').addEventListener('click', close);

    const giftEl = modal.querySelector('#opt-giftwrap');
    const warEl = modal.querySelector('#opt-warranty');
    const discEl = modal.querySelector('#opt-discount');
    const totalEl = modal.querySelector('#opt-total');

    const computePreview = () => {
        try {
            let decorated = ProductFactory.createProduct('bundle', productData);
            if (giftEl.checked) decorated = new GiftWrapDecorator(decorated);
            if (warEl.checked) decorated = new WarrantyExtensionDecorator(decorated);
            const price = (typeof decorated.getPrice === 'function') ? decorated.getPrice() : decorated.getDisplayPrice();
            totalEl.innerHTML = `<strong>Final price: ${Currency.fromUSD(price.current)}</strong>`;
        } catch (e) {
            console.error('Bundle price preview failed:', e);
            totalEl.textContent = 'Unable to compute price preview.';
        }
    };
    ['change','input'].forEach(evt => {
        giftEl.addEventListener(evt, computePreview);
        warEl.addEventListener(evt, computePreview);
    });
    computePreview();

    modal.querySelector('#opt-add').addEventListener('click', () => {
        const decorators = [];
        if (giftEl.checked) decorators.push(GiftWrapDecorator);
        if (warEl.checked) decorators.push(WarrantyExtensionDecorator);
        try {
            const product = ProductFactory.createProduct('bundle', productData);
            cart.addItem(product, decorators);
            showNotification(`${bundleInfo.name} added to cart!`, 'success');
            close();
        } catch (e) {
            console.error('Failed to add bundle with options:', e);
            showNotification('Failed to add bundle with options.', 'error');
        }
    });
}

// Hero Button Functions
function handleHeroButtonClick(e) {
    const buttonText = e.target.textContent;
    
    if (buttonText.includes('Shop Now')) {
        document.getElementById('products').scrollIntoView({
            behavior: 'smooth'
        });
    } else if (buttonText.includes('View Deals')) {
        window.location.href = 'deals.html';
    }
}

// Scroll-to-top functionality
window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 300) {
        if (!document.querySelector('.scroll-to-top')) {
            createScrollToTopButton();
        }
    } else {
        const scrollBtn = document.querySelector('.scroll-to-top');
        if (scrollBtn) {
            scrollBtn.remove();
        }
    }
});

function createScrollToTopButton() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const style = document.createElement('style');
    style.textContent = `
        .scroll-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .scroll-to-top:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(scrollBtn);
}

console.log('TechEase website with Design Patterns loaded successfully!');