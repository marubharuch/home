import React, { useEffect, useState } from "react";
import localforage from "localforage";

export default function CartView() {
  const [cartItems, setCartItems] = useState({});

  useEffect(() => {
    (async () => {
      const saved = await localforage.getItem("cartItems");
      if (saved) setCartItems(saved);
    })();
  }, []);

  const handleDelete = async (id) => {
    const updated = { ...cartItems };
    delete updated[id];
    setCartItems(updated);
    await localforage.setItem("cartItems", updated);
  };

  const handleQuantityChange = async (id, qty) => {
    const updated = {
      ...cartItems,
      [id]: { ...cartItems[id], quantity: parseInt(qty, 10) || 0 },
    };
    setCartItems(updated);
    await localforage.setItem("cartItems", updated);
  };

  const total = Object.values(cartItems).reduce(
    (sum, item) => sum + (parseFloat(item.finalPrice) || 0) * (item.quantity || 0),
    0
  );

  if (!Object.keys(cartItems).length)
    return <div className="p-4 text-gray-500">🛒 Cart is empty</div>;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold mb-2">🛒 Cart</h2>
      {Object.entries(cartItems).map(([id, item]) => (
        <div
          key={id}
          className="border rounded p-3 shadow-sm bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="flex flex-col text-sm flex-1">
            <div className="font-medium">{item.CODE || "Unnamed"}</div>
            <div className="text-gray-600">{item.description || item.particulars}</div>
            <div className="text-gray-500">
              Price: ₹{item.finalPrice} ×
              <input
                type="number"
                value={item.quantity}
                min="0"
                onChange={(e) => handleQuantityChange(id, e.target.value)}
                className="border rounded px-2 py-0.5 ml-1 w-16"
              />
            </div>
            <div className="text-gray-400">Discount: {item.discount}%</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-semibold text-green-600">
              ₹{(item.finalPrice * item.quantity).toFixed(2)}
            </div>
            <button
              onClick={() => handleDelete(id)}
              className="text-red-500 border px-2 py-1 rounded hover:bg-red-50"
            >
              ❌
            </button>
          </div>
        </div>
      ))}
      <div className="text-right font-bold text-lg mt-4">Total: ₹{total.toFixed(2)}</div>
    </div>
  );
}
