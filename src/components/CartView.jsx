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
  
    const allOrders = await getAllOrders();
    let key = orderKey;
  
    // EDIT MODE
    if (key) {
      if (mobile !== selectedOrder.mobile) {
        const yyMM = key.slice(10, 14); // extract YYMM from old key
        let newKey = mobile + yyMM + key.slice(-3); // same serial
  
        if (allOrders[newKey]) {
          if (window.confirm(`Order ${newKey} already exists. Save as NEW order?`)) {
            // generate fresh serial for this month
            const monthSerials = Object.keys(allOrders)
              .filter(k => k.slice(10, 14) === yyMM)
              .map(k => parseInt(k.slice(-3), 10) || 0);
  
            const maxSerial = monthSerials.length ? Math.max(...monthSerials) : 0;
            const newSerial = (maxSerial + 1).toString().padStart(3, "0");
  
            newKey = mobile + yyMM + newSerial;
          } else {
            alert("Save cancelled.");
            return;
          }
        }
        key = newKey;
      }
    }
  
    // NEW ORDER MODE
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
      createdAt: key && orderKey ? selectedOrder.createdAt : now.toISOString(),
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

      {/* Show Order Number if editing */}
    {orderKey && (
      <div className="bg-yellow-100 text-yellow-800 p-2 rounded">
        <strong>Order No:</strong> {orderKey}
      </div>
    )}

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
  {["code", "perticulers","description", "name","dlp", "rate"].map((field) => {
    const entry = Object.entries(item).find(
      ([key]) => key.toLowerCase() === field
    );
    if (!entry) return null; // Skip if not found
    const [key, value] = entry;
    return (
      <>
        
        <span>{value?.toString()}&nbsp;</span>
      </>
    );
  })}
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
