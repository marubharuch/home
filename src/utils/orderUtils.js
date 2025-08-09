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
  await localforage.setItem("orders", { ...allOrders, [orderKey]: orderData });
}

export async function generateOrderKey(mobile) {
  if (!mobile || mobile.length !== 10) {
    throw new Error("Invalid mobile number");
  }
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");

  const prefix = `${mobile}${yy}${mm}`;

  const allOrders = (await localforage.getItem("orders")) || {};
  const serials = Object.keys(allOrders)
    .filter(key => key.startsWith(prefix))
    .map(key => parseInt(key.slice(prefix.length), 10) || 0);

  const maxSerial = serials.length ? Math.max(...serials) : 0;
  const newSerial = maxSerial + 1;
  const serialStr = newSerial.toString().padStart(3, "0"); // e.g. 001

  return prefix + serialStr;
}
