"use strict";

const cartButton = document.querySelector("#cart-button");
const closeCartButton = document.querySelector("#close-cart");
const cartPanel = document.querySelector("#cart-panel");
const cartOverlay = document.querySelector("#cart-overlay");
const cartItemsContainer = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-button");
const addToCartButtons = document.querySelectorAll(".add-to-cart");
const currentYear = document.querySelector("#current-year");

let cart = loadCart();

function loadCart() {
  try {
    const savedCart = localStorage.getItem("securehome-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.warn("The saved cart could not be loaded.", error);
    return [];
  }
}

function saveCart() {
  localStorage.setItem("securehome-cart", JSON.stringify(cart));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
  }).format(value);
}

function openCart() {
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  cartButton.setAttribute("aria-expanded", "true");
  cartOverlay.hidden = false;
  document.body.classList.add("cart-open");
  closeCartButton.focus();
}

function closeCart() {
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartButton.setAttribute("aria-expanded", "false");
  cartOverlay.hidden = true;
  document.body.classList.remove("cart-open");
  cartButton.focus();
}

function showNotification(message) {
  const existingNotification = document.querySelector(".notification");

  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.setAttribute("role", "status");
  notification.textContent = message;

  document.body.appendChild(notification);

  window.setTimeout(() => {
    notification.remove();
  }, 2500);
}

function addToCart(product) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  showNotification(`${product.name} added to cart`);
}

function removeOneItem(productId) {
  const existingItem = cart.find((item) => item.id === productId);

  if (!existingItem) {
    return;
  }

  if (existingItem.quantity > 1) {
    existingItem.quantity -= 1;
  } else {
    cart = cart.filter((item) => item.id !== productId);
  }

  saveCart();
  renderCart();
}

function createCartItem(item) {
  const cartItem = document.createElement("article");
  cartItem.className = "cart-item";

  const itemDetails = document.createElement("div");

  const itemName = document.createElement("h3");
  itemName.textContent = item.name;

  const itemInformation = document.createElement("p");
  itemInformation.textContent =
    `${item.quantity} × ${formatCurrency(item.price)}`;

  itemDetails.append(itemName, itemInformation);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-item";
  removeButton.type = "button";
  removeButton.textContent = "Remove one";
  removeButton.setAttribute(
    "aria-label",
    `Remove one ${item.name} from the cart`
  );

  removeButton.addEventListener("click", () => {
    removeOneItem(item.id);
  });

  cartItem.append(itemDetails, removeButton);

  return cartItem;
}

function renderCart() {
  cartItemsContainer.replaceChildren();

  const totalQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  cartCount.textContent = totalQuantity;
  cartTotal.textContent = formatCurrency(totalPrice);

  if (cart.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-cart-message";
    emptyMessage.textContent = "Your cart is currently empty.";
    cartItemsContainer.appendChild(emptyMessage);

    checkoutButton.disabled = true;
    checkoutButton.textContent = "Checkout coming soon";
    return;
  }

  cart.forEach((item) => {
    cartItemsContainer.appendChild(createCartItem(item));
  });

  checkoutButton.disabled = false;
  checkoutButton.textContent = "Proceed to checkout";
}

addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const product = {
      id: button.dataset.productId,
      name: button.dataset.productName,
      price: Number(button.dataset.productPrice)
    };

    addToCart(product);
  });
});

cartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

checkoutButton.addEventListener("click", () => {
  showNotification("Secure checkout will be connected in a later project phase.");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartPanel.classList.contains("open")) {
    closeCart();
  }
});

currentYear.textContent = new Date().getFullYear();

renderCart();

