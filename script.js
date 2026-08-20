let products = [];
let cart = [];
let loggedInUser = null;
let isRegisterMode = false;

const productsContainer = document.getElementById("products");

async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        products = await response.json();

        displayProducts();
    } catch (error) {
        productsContainer.innerHTML =
            "<p>Unable to load products.</p>";
    }
}

function displayProducts() {
    productsContainer.innerHTML = "";

    products.forEach(product => {
        productsContainer.innerHTML += `
            <div class="product-card">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <h3>${product.name}</h3>

                <p>₹${product.price}</p>

                <div class="card-buttons">
                    <button
                        class="details-button"
                        onclick="showProduct(${product._id})"
                    >
                        View Details
                    </button>

                    <button
                        class="cart-button"
                        onclick="addToCart('${product._id}')"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
}

function showProduct(id) {
    const product = products.find(item => item._id === id);

    if (!product) return;

    document.getElementById("detail-image").src = product.image;
    document.getElementById("detail-name").textContent = product.name;
    document.getElementById("detail-price").textContent =
        `₹${product.price}`;
    document.getElementById("detail-description").textContent =
        product.description;

    document.getElementById("detail-cart-button").onclick = () => {
        addToCart(product._id);
        closeProduct();
    };

    document.getElementById("product-modal").style.display = "flex";
}

function closeProduct() {
    document.getElementById("product-modal").style.display = "none";
}

function addToCart(id) {
    const product = products.find(item => item._id === id);

    if (!product) return;

    cart.push(product);

    updateCartCount();

    alert(`${product.name} added to cart!`);
}

function updateCartCount() {
    document.getElementById("cart-count").textContent = cart.length;
}

function showCart() {
    const modal = document.getElementById("cart-modal");
    const items = document.getElementById("cart-items");

    modal.style.display = "flex";
    items.innerHTML = "";

    if (cart.length === 0) {
        items.innerHTML = "<p>Your cart is empty.</p>";
        document.getElementById("cart-total").textContent = "0";
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;

        items.innerHTML += `
            <div class="cart-item">
                <span>
                    ${index + 1}. ${item.name} - ₹${item.price}
                </span>

                <button
                    class="remove-button"
                    onclick="removeFromCart(${index})"
                >
                    Remove
                </button>
            </div>
        `;
    });

    document.getElementById("cart-total").textContent = total;
}

function removeFromCart(index) {
    cart.splice(index, 1);

    updateCartCount();
    showCart();
}

function closeCart() {
    document.getElementById("cart-modal").style.display = "none";
}

async function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const total = cart.reduce(
        (sum, item) => sum + item.price,
        0
    );

    const orderProducts = cart.map(item => ({
        name: item.name,
        price: item.price
    }));

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userEmail: loggedInUser
                    ? loggedInUser.email
                    : "Guest",
                products: orderProducts,
                total
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(
            `Order placed successfully! 🎉\nOrder ID: ${data.orderId}`
        );

        cart = [];

        updateCartCount();
        closeCart();

    } catch (error) {
        alert("Unable to place order.");
    }
}

function openAuth() {
    document.getElementById("auth-modal").style.display = "flex";
    document.getElementById("auth-message").textContent = "";
}

function closeAuth() {
    document.getElementById("auth-modal").style.display = "none";
}

function toggleAuth() {
    isRegisterMode = !isRegisterMode;

    const title = document.getElementById("auth-title");
    const nameField = document.getElementById("name-field");
    const buttonText = document.getElementById("auth-button-text");
    const switchText = document.getElementById("switch-text");

    if (isRegisterMode) {
        title.textContent = "Create Account";
        nameField.classList.remove("hidden");
        buttonText.textContent = "Register";
        switchText.textContent =
            "Already have an account? Login";
    } else {
        title.textContent = "Login";
        nameField.classList.add("hidden");
        buttonText.textContent = "Login";
        switchText.textContent =
            "New user? Create an account";
    }

    document.getElementById("auth-message").textContent = "";
}

async function submitAuth() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password =
        document.getElementById("password").value.trim();

    const message = document.getElementById("auth-message");

    if (!email || !password || (isRegisterMode && !name)) {
        message.textContent = "Please fill all required fields.";
        return;
    }

    const endpoint = isRegisterMode
        ? "/api/register"
        : "/api/login";

    const body = isRegisterMode
        ? { name, email, password }
        : { email, password };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        if (isRegisterMode) {
            alert("Registration successful! Please login.");

            toggleAuth();
            document.getElementById("email").value = email;
            document.getElementById("password").value = "";
        } else {
            loggedInUser = {
                name: data.name,
                email: data.email
            };

            document.getElementById("user-status").textContent =
                `Hi, ${data.name}`;

            alert(`Welcome ${data.name}! 👋`);

            closeAuth();
        }

    } catch (error) {
        message.textContent =
            "Server connection failed.";
    }
}

loadProducts();