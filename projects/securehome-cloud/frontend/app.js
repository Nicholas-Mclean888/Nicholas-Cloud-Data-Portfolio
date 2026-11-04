"use strict";

const cartButton = document.querySelector("#cart-button");
const closeCartButton = document.querySelector("#close-cart");
const cartPanel = document.querySelector("#cart-panel");
const cartOverlay = document.querySelector("#cart-overlay");
const cartItemsContainer = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-button");
const ordersButton = document.querySelector("#my-orders-button");
const ordersPanel = document.querySelector("#orders-panel");
const closeOrdersButton = document.querySelector("#close-orders");
const ordersList = document.querySelector("#orders-list");
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
  // Close Order History before opening the shopping cart
  ordersPanel.classList.remove("open");
  ordersPanel.setAttribute("aria-hidden", "true");
   // Open the shopping cart
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

function openOrders() {
  // Close the shopping cart if it is open
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartButton.setAttribute("aria-expanded", "false");

  // Open the Order History panel
  ordersPanel.classList.add("open");
  ordersPanel.setAttribute("aria-hidden", "false");

  // Display the shared overlay
  cartOverlay.hidden = false;
  document.body.classList.add("cart-open");

  closeOrdersButton.focus();
}

function closeOrders() {
  ordersPanel.classList.remove("open");
  ordersPanel.setAttribute("aria-hidden", "true");

  cartOverlay.hidden = true;
  document.body.classList.remove("cart-open");

  ordersButton.focus();
}

function getProductName(productId) {
  const productButton = Array.from(addToCartButtons).find(
    (button) => button.dataset.productId === productId
  );

  return productButton
    ? productButton.dataset.productName
    : productId;
}

function renderOrders(orders) {
  ordersList.replaceChildren();

  if (orders.length === 0) {
    const message = document.createElement("p");
    message.textContent = "You haven't placed any orders yet.";
    ordersList.appendChild(message);
    return;
  }

  orders.forEach((order) => {
    const orderCard = document.createElement("div");
    orderCard.className = "order-card";

    const heading = document.createElement("h3");
   heading.textContent = `Order #${order.orderId.slice(0, 8).toUpperCase()}`;

    const date = document.createElement("p");
    date.textContent =
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-AU")}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${order.status}`;

    orderCard.append(heading, date, status);

    (order.items || []).forEach((item) => {
      const product = document.createElement("p");

      product.textContent =
        `Product: ${getProductName(item.productId)} — Quantity: ${item.quantity}`;

      orderCard.appendChild(product);
    });

    ordersList.appendChild(orderCard);
  });
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
}function addToCart

(product) {
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
    checkoutButton.textContent = "Proceed to checkout";
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
closeOrdersButton.addEventListener("click", closeOrders);
cartOverlay.addEventListener("click", () => {
  if (ordersPanel.classList.contains("open")) {
    closeOrders();
  } else if (cartPanel.classList.contains("open")) {
    closeCart();
  }
});

checkoutButton.addEventListener("click", async () => {
  if (cart.length === 0) {
    showNotification("Your cart is empty.");
    return;
  }

  const accessToken = getAccessToken();

  if (!accessToken) {
    showNotification("Please sign in before checkout.");
    return;
  }

  const items = cart.map((item) => ({
    productId: item.id,
    quantity: item.quantity
  }));

  checkoutButton.disabled = true;

  try {
    const response = await fetch(
      "https://lc60ph0ihf.execute-api.ap-southeast-4.amazonaws.com/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ items })
      }
    );

    if (!response.ok) {
      throw new Error(`Order request failed: ${response.status}`);
    }

    const result = await response.json();
    const orderId = result.order?.orderId;

    console.log("Order created:", orderId);

    showNotification(

      orderId
        ? `Order placed successfully! Order ID: ${orderId}`
        : "Order placed successfully!"
    );

    cart.length = 0;
    saveCart();
    renderCart();

  } catch (error) {
    console.error("Checkout failed:", error);
    showNotification("Checkout failed. Please try again.");
  } finally {
    checkoutButton.disabled = cart.length === 0;
  }
});



document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (ordersPanel.classList.contains("open")) {
      closeOrders();
    } else if (cartPanel.classList.contains("open")) {
      closeCart();
    }
  }
});


async function getCustomerOrders(accessToken) {
  try {
    const response = await fetch(
      "https://lc60ph0ihf.execute-api.ap-southeast-4.amazonaws.com/orders",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Unable to retrieve orders: ${response.status}`
      );
    }

    const result = await response.json();

    return result.orders || [];

  } catch (error) {
    console.error("Order history failed:", error);
    throw error;
  }
}

ordersButton.addEventListener("click", async () => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    showNotification("Please sign in to view your orders.");
    return;
  }

  try {
    const orders = await getCustomerOrders(accessToken);
    openOrders();
    renderOrders(orders);
    console.log("Customer orders:", orders);

    showNotification(
      `Successfully retrieved ${orders.length} order(s).`
    );

  } catch (error) {
    console.error("Unable to display order history:", error);
    showNotification("Unable to retrieve your orders.");
  }
});

currentYear.textContent = new Date().getFullYear();

renderCart();

