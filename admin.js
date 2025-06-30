// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, reauthenticateWithCredential, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5mKX5troDUNaNX7fez6qLZnWYTSFv7iE",
    authDomain: "cazalux-3e967.firebaseapp.com",
    projectId: "cazalux-3e967",
    storageBucket: "cazalux-3e967.firebasestorage.app",
    messagingSenderId: "892518167961",
    appId: "1:892518167961:web:3e3a1740cd13d53a808f08",
    measurementId: "G-8ZVJNVXKM3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage();

// Global variables to store app data
let allCategories = [];

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const pageTitle = document.getElementById('pageTitle');
const totalProducts = document.getElementById('totalProducts');
const totalOrders = document.getElementById('totalOrders');
const totalCustomers = document.getElementById('totalCustomers');
const totalRevenue = document.getElementById('totalRevenue');
const recentProducts = document.getElementById('recentProducts');
const productList = document.getElementById('productList');
const toastNotification = document.getElementById('toast-notification');

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        adminPanel.style.display = 'flex';
        
        // Update user information in dropdown
        const userNameSpan = document.querySelector('.user-dropdown-btn span');
        if (userNameSpan) {
            userNameSpan.textContent = user.email || 'Admin';
        }
        
        // Update admin email in settings
        const adminEmailInput = document.getElementById('adminEmail');
        if (adminEmailInput) {
            adminEmailInput.value = user.email || '';
        }
        
        loadDashboard();
    } else {
        // User is signed out
        loginSection.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
});

// Login function
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Login successful - the onAuthStateChanged listener will handle the UI update
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        // Logout successful - the onAuthStateChanged listener will handle the UI update
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load total products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsCount = productsSnapshot.size;
        totalProducts.textContent = productsCount;
        
        // Calculate total revenue from products
        let totalRevenueValue = 0;
        productsSnapshot.forEach((doc) => {
            const product = doc.data();
            const discountedPrice = product.discount ? 
                product.price * (1 - product.discount / 100) : 
                product.price;
            totalRevenueValue += discountedPrice;
        });
        totalRevenue.textContent = `${totalRevenueValue.toFixed(2)} DA`;
        
        // Load recent products
        const recentProductsQuery = query(
            collection(db, 'products'),
            orderBy('createdAt', 'desc'),
            limit(4)
        );
        
        const recentProductsSnapshot = await getDocs(recentProductsQuery);
        recentProducts.innerHTML = '';
        
        recentProductsSnapshot.forEach((doc) => {
            const product = doc.data();
            const productCard = createProductCard(product, doc.id);
            recentProducts.appendChild(productCard);
        });
        
        // Load all products for the products tab
        loadProducts();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Update settings
async function updateSettings() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const adminEmail = document.getElementById('adminEmail').value;

    // Validate current password
    if (currentPassword) {
        try {
            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
        } catch (error) {
            alert('Current password is incorrect');
            return;
        }
    }

    // Update email if changed
    if (adminEmail && adminEmail !== auth.currentUser.email) {
        try {
            await updateEmail(auth.currentUser, adminEmail);
        } catch (error) {
            alert('Error updating email: ' + error.message);
            return;
        }
    }

    // Update password if changed
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }
        try {
            await updatePassword(auth.currentUser, newPassword);
            alert('Settings updated successfully');
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } catch (error) {
            alert('Error updating password: ' + error.message);
            return;
        }
    }
}

// Show toast notification
function showToast(message, duration = 3000) {
    // Set message if provided
    if (message) {
        const messageElement = toastNotification.querySelector('.toast-notification-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
    
    // Show the toast
    toastNotification.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, duration);
}

// Convert image file to base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Function to load categories from Firestore
async function loadCategories() {
    try {
        // Get categories collection
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(categoriesQuery);
        
        // Store categories in memory
        allCategories = [];
        if (querySnapshot.empty) {
            console.log('No categories found, creating default categories');
            // Add default categories if none exist
            await createDefaultCategories();
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const category = doc.data();
            category.id = doc.id;
            allCategories.push(category);
        });
        
        // Update categories table
        updateCategoriesTable();
        
        // Update product form checkboxes
        updateCategoryCheckboxes();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Create default categories if none exist
async function createDefaultCategories() {
    try {
        const defaultCategories = [
            { key: 'skin_care', name: 'العناية بالبشرة', productCount: 0 },
            { key: 'health_care', name: 'العناية الصحية', productCount: 0 },
            { key: 'hair_care', name: 'العناية بالشعر', productCount: 0 },
            { key: 'makeup', name: 'مكياج', productCount: 0 }
        ];
        
        // Add each default category
        for (const category of defaultCategories) {
            await addDoc(collection(db, 'categories'), {
                key: category.key,
                name: category.name,
                productCount: 0,
                createdAt: serverTimestamp()
            });
        }
        
        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error('Error creating default categories:', error);
    }
}

// Update categories table
function updateCategoriesTable() {
    const categoriesTable = document.getElementById('categoriesTable');
    if (!categoriesTable) return;
    
    const tbody = categoriesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    allCategories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td>${category.key}</td>
            <td>${category.productCount || 0}</td>
            <td>
                <button class="btn-edit" onclick="editCategory('${category.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteCategory('${category.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update category checkboxes in product forms
function updateCategoryCheckboxes() {
    const productCategoriesContainer = document.getElementById('productCategoriesContainer');
    const editProductCategoriesContainer = document.getElementById('editProductCategoriesContainer');
    
    if (productCategoriesContainer) {
        productCategoriesContainer.innerHTML = '';
        
        allCategories.forEach(category => {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'checkbox-container';
            checkboxLabel.innerHTML = `
                <input type="checkbox" name="category" value="${category.key}">
                <span class="checkbox-label">${category.name}</span>
            `;
            productCategoriesContainer.appendChild(checkboxLabel);
        });
    }
    
    if (editProductCategoriesContainer) {
        editProductCategoriesContainer.innerHTML = '';
        
        allCategories.forEach(category => {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'checkbox-container';
            checkboxLabel.innerHTML = `
                <input type="checkbox" name="editCategory" value="${category.key}">
                <span class="checkbox-label">${category.name}</span>
            `;
            editProductCategoriesContainer.appendChild(checkboxLabel);
        });
    }
}

// Add category
async function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const key = document.getElementById('categoryKey').value.trim();
    
    // Validate inputs
    if (!name || !key) {
        alert('Please enter both category name and key');
        return;
    }
    
    // Check if key is valid (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        alert('Category key must contain only letters, numbers, and underscores');
        return;
    }
    
    // Check if key already exists
    const keyExists = allCategories.some(cat => cat.key === key);
    if (keyExists) {
        alert('A category with this key already exists');
        return;
    }
    
    try {
        // Add to Firestore
        await addDoc(collection(db, 'categories'), {
            key: key,
            name: name,
            productCount: 0,
            createdAt: serverTimestamp()
        });
        
        // Show success message
        showToast('تم إضافة الفئة بنجاح');
        
        // Clear form
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryKey').value = '';
        
        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category: ' + error.message);
    }
}

// Edit category
async function editCategory(categoryId) {
    const category = allCategories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    const newName = prompt('Enter new category name:', category.name);
    if (!newName || newName.trim() === '') return;
    
    try {
        // Update in Firestore
        await updateDoc(doc(db, 'categories', categoryId), {
            name: newName.trim(),
            updatedAt: serverTimestamp()
        });
        
        // Show success message
        showToast('تم تحديث الفئة بنجاح');
        
        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error('Error updating category:', error);
        alert('Error updating category: ' + error.message);
    }
}

// Delete category
async function deleteCategory(categoryId) {
    const category = allCategories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This will not remove it from existing products.`)) {
        return;
    }
    
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'categories', categoryId));
        
        // Show success message
        showToast('تم حذف الفئة بنجاح');
        
        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category: ' + error.message);
    }
}

// Update category product counts
async function updateCategoryProductCounts() {
    try {
        // Get all products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        
        // Initialize counter for each category
        const categoryCounts = {};
        allCategories.forEach(category => {
            categoryCounts[category.key] = 0;
        });
        
        // Count products in each category
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            if (product.categories && Array.isArray(product.categories)) {
                product.categories.forEach(categoryKey => {
                    if (categoryCounts[categoryKey] !== undefined) {
                        categoryCounts[categoryKey]++;
                    }
                });
            }
        });
        
        // Update each category document
        for (const category of allCategories) {
            await updateDoc(doc(db, 'categories', category.id), {
                productCount: categoryCounts[category.key] || 0
            });
        }
        
        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error('Error updating category counts:', error);
    }
}

// Add product with new fields
async function addProduct() {
    const name = document.getElementById('productName').value;
    const categories = Array.from(document.querySelectorAll('#productCategoriesContainer input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    const price = parseFloat(document.getElementById('productPrice').value);
    const discount = parseFloat(document.getElementById('productDiscount').value) || 0;
    const imageUrl = document.getElementById('productImage').value;
    
    // Get additional image URLs
    const additionalImages = Array.from(document.querySelectorAll('.image-url-input-group input'))
        .slice(1) // Skip the first input (main image)
        .map(input => input.value)
        .filter(url => url.trim() !== '');

    // Validate required fields
    if (!name || categories.length === 0 || !price || !imageUrl) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        // Add product to Firestore
        await addDoc(collection(db, 'products'), {
            name,
            categories,
            price,
            discount,
            imageUrl,
            additionalImages,
            createdAt: serverTimestamp()
        });

        // Show success toast
        showToast('تم إضافة المنتج بنجاح');

        // Clear form
        document.getElementById('addProductForm').reset();
        
        // Reload dashboard
        loadDashboard();
    } catch (error) {
        console.error('Error adding product:', error);
        alert('خطأ في إضافة المنتج: ' + error.message);
    }
}

// Load all products
async function loadProducts() {
    try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        productList.innerHTML = '';
        
        productsSnapshot.forEach((doc) => {
            const product = doc.data();
            const productCard = createProductCard(product, doc.id);
            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Create product card
function createProductCard(product, productId) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Calculate discounted price
    const discountedPrice = product.discount ? 
        product.price * (1 - product.discount / 100) : 
        product.price;
    
    // Format categories
    const categoryDisplay = product.categories && product.categories.length > 0 
        ? `<div class="product-categories">${product.categories.join(', ')}</div>` 
        : '';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="product-details">
            <div class="product-text">
                <h3 class="product-name">${product.name}</h3>
                ${categoryDisplay}
            </div>
            <div class="product-price-container">
                ${product.discount ? 
                    `<span class="original-price">${product.price.toFixed(2)} DA</span>
                     <span class="discounted-price">${discountedPrice.toFixed(2)} DA</span>
                     <span class="discount-badge">-${product.discount}%</span>` :
                    `<span class="product-price">${product.price.toFixed(2)} DA</span>`
                }
            </div>
            <div class="product-actions">
                <button class="btn-delete" data-product-id="${productId}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    const deleteButton = card.querySelector('.btn-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            const pId = deleteButton.getAttribute('data-product-id');
            deleteProduct(pId);
        });
    }

    return card;
}

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showToast('تم حذف المنتج بنجاح');
            loadDashboard();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product: ' + error.message);
        }
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Add product form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        // Add a flag to prevent multiple listeners if the script is somehow executed multiple times
        if (!addProductForm.dataset.listenerAttached) {
            addProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Add product form submitted');
                await addProduct();
            });
            addProductForm.dataset.listenerAttached = 'true';
        }
    }
    
    // Settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateSettings();
        });
    }
    
    // Navigation menu items
    const navItems = document.querySelectorAll('.sidebar-menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            
            // Update active menu item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section
            contentSections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
            
            // Update page title
            document.getElementById('pageTitle').textContent = item.querySelector('span').textContent;
        });
    });

    // Load categories
    loadCategories();
});

// Make functions globally available
window.login = login;
window.logout = logout;
window.addProduct = addProduct;
window.deleteProduct = deleteProduct;
window.addCategory = addCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.updateCategoryProductCounts = updateCategoryProductCounts; 