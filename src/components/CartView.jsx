import React, { useState, useEffect } from "react";
import localforage from "localforage";

export default function CartView({ orderKey, onSave, onModify }) {
  const [cart, setCart] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [orderInfo, setOrderInfo] = useState({ orderNo: "", createdAt: "" });

  // ✅ Load cart and generate order number
  useEffect(() => {
    const fetchCart = async () => {
      const savedCart = (await localforage.getItem("cart")) || {};
  
      let info = savedCart._orderInfo;
  
      if (!info) {
        const mobile = /^\d{10}$/.test(orderKey) ? orderKey : null;
        let serial = 1;
  
        if (mobile) {
          const allOrders = (await localforage.getItem("orders")) || {};
          const mobileOrders = Object.keys(allOrders).filter(k => k.startsWith(mobile));
          const lastSerial = mobileOrders
            .map(k => parseInt(k.split("/")[1] || "0"))
            .sort((a, b) => b - a)[0] || 0;
          serial = lastSerial + 1;
        }
  
        info = {
          orderNo: mobile ? `${mobile}/${serial}` : `TEMP/${Date.now()}`,
          createdAt: new Date().toLocaleString(),
        };
  
        savedCart._orderInfo = info;
        await localforage.setItem("cart", savedCart);
      }
  
      setOrderInfo(info);
  
      const total = Object.entries(savedCart)
        .filter(([k]) => k !== "_orderInfo")
        .reduce(
          (sum, [, item]) =>
            sum + (parseFloat(item.finalPrice) || 0) * (item.quantity || 0),
          0
        );
      setTotalAmount(total);
      setCart(savedCart);
    };
  
    fetchCart();
  }, [orderKey]);
  

  // ✅ Clear entire cart
  const handleClearCart = async () => {
    if (!window.confirm("Clear all items from the cart?")) return;

    await localforage.setItem("cart", {});
    setCart({});
    setTotalAmount(0);
    setOrderInfo({ orderNo: "", createdAt: "" });

    // ✅ Fire event to update badge
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <div className="p-4">
      {/* ✅ Order Info */}
      {orderInfo.orderNo && (
        <div className="mb-3 p-3 bg-gray-100 border rounded">
          <p className="text-sm font-semibold">🧾 Order No: {orderInfo.orderNo}</p>
          <p className="text-xs text-gray-600">📅 {orderInfo.createdAt}</p>
        </div>
      )}

      {/* Header with Clear button */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">🛒 Cart</h2>
        <button
          onClick={handleClearCart}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Cart
        </button>
      </div>

      {/* Cart items */}
      {Object.keys(cart)
        .filter((k) => k !== "_orderInfo" && k !== "_mobile").length === 0 ? (
        <p className="text-gray-500">Cart is empty</p>
      ) : (
        Object.entries(cart)
          .filter(([k]) => k !== "_orderInfo" && k !== "_mobile")
          .map(([key, item]) => (
            <div key={key} className="border-b py-2">
              <div className="mb-1">
                {Object.entries(item).map(([k, v]) => {
                  const lowerKey = k.toLowerCase();
                  if (["code", "particulars", "description", "name"].includes(lowerKey)) {
                    return (
                      <span key={k} className="mr-2 font-semibold">
                        {lowerKey === "code" ? `[${v}]` : v}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <div className="text-right">
                Qty: {item.quantity} × ₹{item.finalPrice} ={" "}
                <span className="font-bold">
                  ₹{(item.quantity * parseFloat(item.finalPrice)).toFixed(2)}
                </span>
              </div>
            </div>
          ))
      )}

      {/* ✅ Grand Total */}
      {Object.keys(cart)
        .filter((k) => k !== "_orderInfo" && k !== "_mobile").length > 0 && (
        <div className="flex justify-between items-center mt-4 p-2 border-t">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-lg font-bold text-green-700">
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Modify / Save buttons */}
      {Object.keys(cart)
        .filter((k) => k !== "_orderInfo" && k !== "_mobile").length > 0 && (
        <div className="flex justify-between mt-4">
          <button
            onClick={onModify}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Modify
          </button>
          <button
            onClick={() => onSave(cart)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Order
          </button>
        </div>
      )}
    </div>
  );
}
