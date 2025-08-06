import React, { useEffect, useState } from "react";
import { loadOrder, deleteOrder } from "../utils/orderUtils";

export default function CartView({ orderKey, onSave, onModify }) {
  const [cart, setCart] = useState({});
  const [orderInfo, setOrderInfo] = useState({});

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderKey && orderKey !== "NEW") {
        const order = await loadOrder(orderKey);
        if (order) {
          setCart(order.cart || {});
          setOrderInfo({
            phone: order.mobile,
            serial: order.serial || orderKey.split("/").pop(),
            createdAt: order.createdAt || order.updatedAt,
          });
        }
      }
    };
    fetchOrder();
  }, [orderKey]);

  const handleQtyChange = (itemKey, qty) => {
    setCart((prev) => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], quantity: parseFloat(qty) || 0 },
    }));
  };

  const handleDeleteItem = (itemKey) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[itemKey];
      return updated;
    });
  };

  const handleDeleteOrder = async () => {
    if (window.confirm("Delete entire order?")) {
      await deleteOrder(orderKey);
      onModify(); // go back
    }
  };

  const total = Object.values(cart).reduce(
    (sum, item) =>
      sum + (parseFloat(item.finalPrice) || 0) * (item.quantity || 0),
    0
  );

  return (
    <div className="p-4 bg-white shadow rounded">
      {orderKey?.startsWith("TEMP/") && (
        <div className="mb-3 text-sm text-yellow-700">
          <p>⚠️ This is a temporary order. Enter mobile to finalize.</p>
        </div>
      )}

      {orderKey !== "NEW" && !orderKey?.startsWith("TEMP/") && (
        <div className="mb-3 text-sm text-gray-600">
          <p>📞 Phone: {orderInfo.phone}</p>
          <p>🆔 Order No: {orderInfo.serial}</p>
          <p>📅 Date: {orderInfo.createdAt}</p>
        </div>
      )}

      <div className="space-y-2">
      {Object.entries(cart).map(([key, item]) => (
  <div key={key} className="flex flex-col border-b py-2">
  <div className="flex justify-between items-center">
    <div>
      {/* ✅ Case-insensitive check */}
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
</div>

))}


      </div>

      <div className="mt-4 flex justify-between items-center">
        <p className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</p>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(cart)}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            💾 Save
          </button>
          {orderKey !== "NEW" && !orderKey?.startsWith("TEMP/") && (
            <button
              onClick={handleDeleteOrder}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete Order
            </button>
          )}
          <button
            onClick={onModify}
            className="bg-gray-400 text-white px-3 py-1 rounded"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
