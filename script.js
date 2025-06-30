// DOM elements - will be initialized properly in init function
let productsGrid;
let homePage;
let productDetail;
let productDetailOverlay;
let backToTopButton;
let quantityInput;
let orderForm;
let toast;
let mobileNav;
let mobileNavOverlay;
let closeNavBtn;
let menuButton;
let closeDetailBtn;

// Current product
let currentProduct = null;

// Current product selections
let selectedSize = null;
let currentQuantity = 1;

// Function to close product detail
function hideProductDetail() {
    if (productDetail && productDetailOverlay && homePage) {
        productDetail.style.display = 'none';
        productDetailOverlay.style.display = 'none';
        homePage.style.display = 'block';
        document.body.style.overflow = ''; // Reset body overflow
        
        // Reset any form if it exists
        const form = document.getElementById('order-form');
        if (form) {
            form.reset();
        }

        // Reset scroll position
        window.scrollTo(0, window.lastScrollPosition || 0);
    }
}

// Function to show home page
function showHomePage() {
    hideProductDetail();
}

// Function to show products page
function showProductsPage() {
    hideProductDetail();
    if (homePage) {
        homePage.style.display = 'block';
    }
}

// Initialize the page
function init() {
    // Initialize window category filter variable
    window.currentCategory = '';
    console.log('Initializing page - setting window.currentCategory to empty string');
    
    // Initialize DOM elements
    productsGrid = document.getElementById('products-grid');
    homePage = document.getElementById('home-page');
    productDetail = document.getElementById('product-detail');
    productDetailOverlay = document.getElementById('product-detail-overlay');
    backToTopButton = document.getElementById('back-to-top');
    quantityInput = document.getElementById('quantity');
    orderForm = document.getElementById('order-form');
    toast = document.getElementById('toast');
    mobileNav = document.getElementById('mobile-nav');
    mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    closeNavBtn = document.getElementById('close-nav');
    menuButton = document.querySelector('.menu-button');
    closeDetailBtn = document.getElementById('close-product-detail');
    
    // IMPORTANT: Skip the category button initialization - this now happens in products.js
    // after Firebase data is loaded to ensure proper filtering
    console.log('Skipping category button initialization - will be handled after Firebase data loads');
    
    // Mobile navigation setup
    if (menuButton) {
        menuButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (mobileNav && mobileNavOverlay) {
                mobileNav.classList.add('active');
                mobileNavOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (closeNavBtn) {
        closeNavBtn.addEventListener('click', function(e) {
            e.preventDefault();
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Mobile nav links
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Contact modal functionality
    const contactLink = document.getElementById('contact-link');
    const mobileContactLink = document.getElementById('mobile-contact-link');
    const footerContactLink = document.getElementById('footer-contact-link');
    const contactModal = document.getElementById('contact-modal');
    const contactOverlay = document.getElementById('contact-modal-overlay');
    const closeContactBtn = document.getElementById('close-contact-btn');
    
    function showContactModal(e) {
        e.preventDefault();
        if (contactModal && contactOverlay) {
            contactModal.style.display = 'block';
            contactOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideContactModal() {
        if (contactModal && contactOverlay) {
            contactModal.style.display = 'none';
            contactOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    if (contactLink) {
        contactLink.addEventListener('click', showContactModal);
    }
    
    if (mobileContactLink) {
        mobileContactLink.addEventListener('click', showContactModal);
    }
    
    if (footerContactLink) {
        footerContactLink.addEventListener('click', showContactModal);
    }
    
    if (closeContactBtn) {
        closeContactBtn.addEventListener('click', hideContactModal);
    }
    
    if (contactOverlay) {
        contactOverlay.addEventListener('click', hideContactModal);
    }
    
    // Form submission handler
    if (orderForm) {
        // Add a flag to prevent duplicate form submissions
        const formHandlerName = 'billyshop_script_js_handler';
        
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Mark form as being processed
            const submitButton = e.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'جاري الإرسال...';
            }
            
            // Get form data
            const formData = new FormData(e.target);
            
            // Debug each field individually
            console.log('Form field values (from script.js):');
            console.log('productName:', document.getElementById('product-name-input')?.value);
            console.log('productPrice:', document.getElementById('product-price-input')?.value);
            console.log('quantity:', document.getElementById('quantity')?.value);
            console.log('full-name:', document.getElementById('full-name')?.value);
            console.log('phone:', document.getElementById('phone')?.value);
            console.log('address:', document.getElementById('address')?.value);
            console.log('province:', document.getElementById('province')?.value);
            console.log('city:', document.getElementById('city')?.value);
            console.log('delivery-type:', document.getElementById('delivery-type')?.value);
            
            const formObject = {
                productName: document.getElementById('product-name-input')?.value,
                productPrice: document.getElementById('product-price-input')?.value,
                quantity: document.getElementById('quantity')?.value,
                // Get delivery price
                deliveryPrice: document.getElementById('delivery-price')?.textContent.replace('دج', '').trim() || '0',
                // Calculate total price including delivery
                totalPrice: (
                    parseFloat(document.getElementById('product-price-input')?.value || 0) * 
                    parseInt(document.getElementById('quantity')?.value || 1) + 
                    parseFloat(document.getElementById('delivery-price')?.textContent.replace('دج', '').trim() || 0)
                ).toFixed(2),
                'full-name': document.getElementById('full-name')?.value,
                phone: document.getElementById('phone')?.value,
                address: document.getElementById('address')?.value,
                province: document.getElementById('province')?.value,
                city: document.getElementById('city')?.value,
                deliveryType: document.getElementById('delivery-type')?.value,
                timestamp: new Date().toISOString(),
                handler: formHandlerName
            };
            
            // Log the complete form object
            console.log('Complete form object:', formObject);

            try {
                // Log the form data before sending
                console.log('Sending form data from script.js:', formObject);

                // Send data to Make.com webhook
                const response = await fetch('https://hook.eu2.make.com/97ureesiqqg6z8m7uifzxzvqml47d6ps', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formObject)
                });

                // Log the response
                console.log('Webhook response:', response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Webhook result:', result);

                // Show success message
                alert('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.');
                
                // Reset form
                e.target.reset();
                
                // Hide product detail and show home page
                hideProductDetail();
                showHomePage();
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
            } finally {
                // Reset button state
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'تأكيد الطلب';
                }
            }
        });
    }

    // Close button handler
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideProductDetail();
        });
    }

    // Overlay click handler
    if (productDetailOverlay) {
        productDetailOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            hideProductDetail();
        });
    }

    // Prevent closing when clicking inside the product detail
    if (productDetail) {
        productDetail.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Show contact form when clicking contact links
    document.querySelectorAll('.nav-link, .footer-link, .mobile-nav-links a').forEach(link => {
        if (link.textContent.includes('اتصل بنا')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                contactForm.style.display = 'block';
                // Also hide mobile nav if it's open
                const mobileNav = document.getElementById('mobile-nav');
                const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
                if (mobileNav && mobileNavOverlay) {
                    mobileNav.classList.remove('active');
                    mobileNavOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    });

    // Close contact form
    closeContactForm.addEventListener('click', () => {
        contactForm.style.display = 'none';
    });

    // Close contact form when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target === contactForm) {
            contactForm.style.display = 'none';
        }
    });
}

// Update quantity
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newQuantity = parseInt(quantityInput.value) + change;
    
    // Ensure quantity stays within bounds (1-10)
    newQuantity = Math.max(1, Math.min(10, newQuantity));
    
    quantityInput.value = newQuantity;
    currentQuantity = newQuantity;
}

// Calculate discounted price
function calculateDiscountedPrice(price, discount) {
    return Math.round(price * (1 - discount / 100));
}

// Toggle back to top button
function toggleBackToTopButton() {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Mobile navigation functions
function showMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    
    if (mobileNav && mobileNavOverlay) {
        mobileNav.classList.add('active');
        mobileNavOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    
    if (mobileNav && mobileNavOverlay) {
        mobileNav.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Handle navbar scroll behavior
function setupNavbarScroll() {
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('hidden');
            return;
        }
        
        if (currentScroll > lastScroll && !navbar.classList.contains('hidden')) {
            // Scrolling down
            navbar.classList.add('hidden');
        } else if (currentScroll < lastScroll && navbar.classList.contains('hidden')) {
            // Scrolling up
            navbar.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements and event listeners
    init();
    
    // Check if we're on the products page
    const isProductsPage = document.getElementById('products-grid') !== null;
    
    // Load products from Firebase
    if (typeof loadProducts === 'function') {
        loadProducts();
    } else {
        console.warn('loadProducts function not found');
    }
});