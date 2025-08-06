import localforage from "localforage";

/**
 * Load a specific order from localforage
 */
export const loadOrder = async (orderKey) => {
  const allOrders = (await localforage.getItem("orders")) || {};
  return allOrders[orderKey] || null;
};

/**
 * Delete a specific order
 */
export const deleteOrder = async (orderKey) => {
  const allOrders = (await localforage.getItem("orders")) || {};
  if (allOrders[orderKey]) {
    delete allOrders[orderKey];
    await localforage.setItem("orders", allOrders);
  }
};

/**
 * Save or update an order.
 * - If order is temporary (TEMP/...), it will be converted to a permanent order.
 */
export const saveOrder = async (orderKey, cartItems, mobile) => {
  const allOrders = (await localforage.getItem("orders")) || {};
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  let finalKey = orderKey;

  if (orderKey.startsWith("TEMP/")) {
    // Convert TEMP order to permanent
    const userOrders = Object.keys(allOrders).filter((k) =>
      k.startsWith(`${mobile}/${year}/${month}`)
    );
    const lastSerial =
      userOrders.map((k) => parseInt(k.split("/").pop(), 10)).sort((a, b) => b - a)[0] || 0;
    const nextSerial = lastSerial + 1;

    finalKey = `${mobile}/${year}/${month}/${nextSerial}`;
    delete allOrders[orderKey]; // remove temporary entry
  }

  allOrders[finalKey] = {
    cart: cartItems,
    mobile,
    createdAt: now.toLocaleString(),
    serial: finalKey.split("/").pop(),
  };

  await localforage.setItem("orders", allOrders);

  return finalKey;
};
