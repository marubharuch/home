// src/components/CartView.jsx
import { useEffect, useState } from "react";

import localforage from "localforage";
import {
  calculateTotal,
  saveOrder,
  clearCart,
  generateOrderKey
} from "../utils/orderUtils";

export default function CartView({ orderKey, selectedOrder }) {
  const [cart, setCart] = useState({});
  const [total, setTotal] = useState(0);
  const [mobile, setMobile] = useState("");

  useEffect(() => {
    const loadCart = async () => {
      if (orderKey && selectedOrder) {
        // Load from selected order prop (editing an existing order)
        setCart(selectedOrder.cart || {});
        setTotal(calculateTotal(selectedOrder.cart || {}));
        setMobile(selectedOrder.mobile || "");
      } else {
        // Load from localforage (new order or no order selected)
        const storedCart = (await localforage.getItem("cart")) || {};
        setCart(storedCart);
        setTotal(calculateTotal(storedCart));
        if (storedCart._orderInfo?.mobile) {
          setMobile(storedCart._orderInfo.mobile);
        }
      }
    };
    loadCart();
  }, [orderKey, selectedOrder]);

  const handleQuantityChange = async (id, qty) => {
    const updatedCart = {
      ...cart,
      [id]: { ...cart[id], quantity: qty }
    };
    setCart(updatedCart);
    setTotal(calculateTotal(updatedCart));
    await localforage.setItem("cart", updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
    console.log(`Quantity changed for item ${id}: ${qty}`);
  };

  const handleSaveOrder = async () => {
    if (!mobile) {
      alert("Please enter mobile number before saving");
      return;
    }

    let key = orderKey;
    if (!key) {
      try {
        key = await generateOrderKey(mobile);
      } catch (err) {
        alert("Invalid mobile number for order key generation");
        return;
      }
    }

    const now = new Date();
    const orderData = {
      cart,
      mobile,
      createdAt: now.toISOString(),
    };

    await saveOrder(key, orderData);
    console.log("Order saved:", key, orderData);
    alert(`✅ Order saved successfully (${key})`);
    await clearCart();
    setCart({});
    setTotal(0);
  };

  const handleSendWhatsApp = () => {
    if (!mobile) {
      alert("Please enter mobile number before sending");
      return;
    }
    const message = Object.values(cart)
      .filter(item => item && item.name)
      .map(item => `${item.name} - ₹${item.finalPrice} × ${item.quantity}`)
      .join("\n");
    const waLink = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
    console.log("Opening WhatsApp:", waLink);
    window.open(waLink, "_blank");
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">🛒 Your Cart</h2>

      <div>
        <label className="block mb-1">Mobile Number:</label>
        <input
          type="text"
          value={mobile}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (val.length <= 10) setMobile(val);
          }}
          placeholder="10-digit number"
          className="border px-2 py-1 rounded w-full"
        />
      </div>

      <div className="space-y-2">
      {Object.entries(cart)
  .filter(([key]) => key !== "_orderInfo" && key !== "_mobile")
  .map(([id, item]) => (
    <div key={id} className="border-b py-2">
      {/* Display all item properties */}
      <div className="text-sm space-y-1">
        {Object.entries(item).map(([key, value]) => (
          <div key={key} className="flex gap-1">
            <span className="font-semibold">{key}:</span>
            <span>{value?.toString()}</span>
          </div>
        ))}
      </div>

      <div className="text-right mt-1">
        Qty: {item.quantity} × ₹{item.finalPrice} ={" "}
        <span className="font-bold">
          ₹{(item.quantity * parseFloat(item.finalPrice)).toFixed(2)}
        </span>
      </div>
    </div>
  ))}

      </div>

      <div className="font-bold">Total: ₹{total.toFixed(2)}</div>

      <div className="flex gap-2">
        <button
          onClick={handleSaveOrder}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          💾 Save Order
        </button>
        <button
          onClick={handleSendWhatsApp}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          📲 Send via WhatsApp
        </button>
      </div>
    </div>
  );
}
