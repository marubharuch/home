import localforage from "localforage";

export async function getCartCount() {
  const cart = (await localforage.getItem("cart")) || {};
  return Object.values(cart).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
}

export async function clearCart() {
  await localforage.setItem("cart", {});
  window.dispatchEvent(new Event("cartUpdated"));
}

export async function getAllOrders() {
  let orders = await localforage.getItem("orders");
  if (!orders || typeof orders !== "object") {
    orders = {};
    await localforage.setItem("orders", {});
  }
  return orders;
}

export function sortOrdersByDate(orderArray) {
  const parseTS = (d) => {
    const t = Date.parse(d);
    return isNaN(t) ? 0 : t;
  };
  return orderArray.sort((a, b) => parseTS(b.createdAt) - parseTS(a.createdAt));
}

export function calculateTotal(cart) {
  return Object.values(cart || {}).reduce(
    (sum, item) =>
      sum + ((parseFloat(item.finalPrice) || 0) * (item.quantity || 0)),
    0
  );
}
export async function saveOrder(orderKey, orderData) {
  const allOrders = await getAllOrders();
  const now = new Date();
  let finalKey = orderKey;

  // --- New Order ---
  if (!finalKey) {
    finalKey = await generateOrderKey(orderData.mobile);
  } else {
    // --- Editing Order ---
    const existing = allOrders[finalKey];

    if (existing) {
      // Mobile changed during edit
      if (orderData.mobile && existing.mobile !== orderData.mobile) {
        const suffix = finalKey.slice(10); // Keep YYMM + serial same
        finalKey = orderData.mobile + suffix;

        // Remove old entry to avoid duplicates
        delete allOrders[orderKey];
      }
      // Preserve original createdAt
      orderData.createdAt = existing.createdAt || orderData.createdAt;
    }
  }

  // Set timestamps
  orderData.createdAt = orderData.createdAt || now.toISOString();
  orderData.updatedAt = now.toISOString();

  // Save order
  await localforage.setItem("orders", { ...allOrders, [finalKey]: orderData });

  return finalKey; // return so UI can update if needed
}


export async function generateOrderKey(mobile) {
  if (!mobile || mobile.length !== 10) {
    throw new Error("Invalid mobile number");
  }
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");

  // Prefix sirf mobile+date ke liye
  const prefix = `${mobile}${yy}${mm}`;

  const allOrders = (await localforage.getItem("orders")) || {};

  // Month prefix (mobile nahi, sirf date) for global serial search
  const monthPrefix = `${yy}${mm}`;
  const serials = Object.keys(allOrders)
    .filter(key => key.includes(monthPrefix)) // month match
    .map(key => parseInt(key.slice(-3), 10) || 0); // last 3 digits

  const maxSerial = serials.length ? Math.max(...serials) : 0;
  const newSerial = maxSerial + 1;
  const serialStr = newSerial.toString().padStart(3, "0");

  return prefix + serialStr;
}


