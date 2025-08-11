import Modal from "./Modal";
import localforage from "localforage";

export default function OrderPopup({ orders, onSelect, onClose, onDelete }) {
  const handleDelete = async (key, e) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Are you sure you want to delete order ${key}?`
    );
    if (!confirmDelete) return;

    const allOrders = (await localforage.getItem("orders")) || {};
    delete allOrders[key];
    await localforage.setItem("orders", allOrders);
    if (onDelete) onDelete(); // Refresh orders list
  };

  return (
    <Modal
      title="Select Order"
      onClose={onClose}
      className="w-full sm:w-[500px] max-w-full"
    >
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500">No orders found</p>
        ) : (
          orders.map((o) => (
            <div
              key={o.key}
              className="flex justify-between items-center p-3 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => onSelect(o.key)}
            >
              <span className="break-all">{o.key}</span>
              <div className="flex items-center gap-4">
                <span className="text-green-700">
                  ₹{o.total.toFixed(2)}
                </span>
                <button
                  onClick={(e) => handleDelete(o.key, e)}
                  className="text-red-600 hover:text-red-800 p-1 rounded"
                  aria-label={`Delete order ${o.key}`}
                >
                  {/* Unicode X — can replace with SVG if desired */}
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
