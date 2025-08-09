import React, { useEffect, useState } from "react";
import localforage from "localforage";

export default function OrderList({ onSelect }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const allOrders = (await localforage.getItem("orders")) || {};
    const orderArray = Object.entries(allOrders).map(([key, data]) => {
      const total = Object.values(data.cart || {}).reduce(
        (sum, item) =>
          sum + ((parseFloat(item.finalPrice) || 0) * (item.quantity || 0)),
        0
      );
      return {
        key,
        total,
        createdAt: data.createdAt || "",
      };
    });
    orderArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setOrders(orderArray);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (orderKey, e) => {
    e.stopPropagation();
    const allOrders = (await localforage.getItem("orders")) || {};
    if (orderKey in allOrders) {
      delete allOrders[orderKey];
      await localforage.setItem("orders", allOrders);
      fetchOrders();
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (orders.length === 0)
    return <div className="text-center text-gray-500">No orders found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded shadow-lg max-h-[70vh] overflow-y-auto">
      {orders.map(({ key, total, createdAt }) => (
        <div
          key={key}
          onClick={() => onSelect(key)}
          className="flex justify-between items-center p-4 mb-2 rounded border cursor-pointer hover:bg-gray-100 transition"
          title={`Select order ${key}`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            <span className="font-semibold text-lg">{key} ddd</span>
            <span className="text-gray-600 text-sm"> ssss{createdAt}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-green-700 font-semibold text-lg">₹{total.toFixed(2)}</div>
           fff <button
              onClick={(e) => handleDelete(key, e)}
              className="text-red-600 hover:text-red-800 px-3 py-1 border rounded"
              title="Delete order"
              aria-label={`Delete order ${key}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
