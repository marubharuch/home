import React, { useEffect, useState, lazy, Suspense } from "react";
import localforage from "localforage";
import { loadAndCacheAllJson } from "./utils/jsonLoader";
import Modal from "./components/Modal";

const SearchBar = lazy(() => import("./components/SearchBar"));
const CartView = lazy(() => import("./components/CartView"));

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [itemsCount, setItemsCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [mobileInput, setMobileInput] = useState("");
  const [orderList, setOrderList] = useState([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [selectedOrderKey, setSelectedOrderKey] = useState(null);
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [tempMobile, setTempMobile] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [editMode, setEditMode] = useState(false);

  // ✅ Update cart count
  useEffect(() => {
    const updateCartCount = async () => {
      const cart = (await localforage.getItem("cart")) || {};
      const count = Object.values(cart).reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(count);
    };
    window.addEventListener("cartUpdated", updateCartCount);
    updateCartCount();
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  // ✅ Clear cart for new order
  const handleAddOrder = async () => {
    await localforage.setItem("cart", {});
    window.dispatchEvent(new Event("cartUpdated"));
    setShowCart(false);
    setSelectedOrderKey(null);
    alert("🆕 Started a new order. Cart is cleared.");
  };

  // ✅ Start edit flow
  const handleEditOrder = () => {
    setEditMode(true);
    setShowMobilePopup(true);
  };

  // ✅ Show previous orders for entered mobile
  const handleMobileEnter = async (mobileVal) => {
    const num = (mobileVal || tempMobile).trim();
    let allOrders = await localforage.getItem("orders");
    if (!allOrders || typeof allOrders !== "object") {
      allOrders = {};
      await localforage.setItem("orders", {});
    }

    const matchedOrders = Object.entries(allOrders)
      .filter(([key]) => key.startsWith(num))
      .map(([key, data]) => ({
        key,
        total: Object.values(data.cart || {}).reduce(
          (sum, item) =>
            sum + (parseFloat(item.finalPrice) || 0) * (item.quantity || 0),
          0
        ),
        createdAt: data.createdAt,
      }));

    setOrderList(matchedOrders);
    setShowOrderPopup(true);
  };

  // ✅ Select an order to edit
  const handleOrderSelect = async (orderKey) => {
    const allOrders = (await localforage.getItem("orders")) || {};
    const selectedOrder = allOrders[orderKey];
    if (selectedOrder) {
      await localforage.setItem("cart", selectedOrder.cart);
      window.dispatchEvent(new Event("cartUpdated"));
    }
    setSelectedOrderKey(orderKey);
    setShowOrderPopup(false);
    setShowCart(false); // stay on itemlist
    alert(`✏️ Editing order: ${orderKey}`);
  };

  const handleSaveOrder = async (cartItems) => {
    const mobile = /^\d{10}$/.test(mobileInput) ? mobileInput : "unknown";
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const allOrders = (await localforage.getItem("orders")) || {};
    const userOrders = Object.keys(allOrders).filter((k) =>
      k.startsWith(`${mobile}/${year}/${month}`)
    );
    const lastSerial =
      userOrders.map((k) => parseInt(k.split("/").pop(), 10)).sort((a, b) => b - a)[0] || 0;
    const nextSerial = lastSerial + 1;
    const orderKey = `${mobile}/${year}/${month}/${nextSerial}`;

    await localforage.setItem("orders", {
      ...allOrders,
      [orderKey]: {
        cart: cartItems,
        mobile,
        createdAt: now.toLocaleString(),
        serial: nextSerial,
      },
    });

    const total = Object.values(cartItems).reduce(
      (sum, item) =>
        sum + (parseFloat(item.finalPrice) || 0) * (item.quantity || 0),
      0
    );

    window.open(
      `https://wa.me/91${mobile}?text=${encodeURIComponent(
        `Your order ${orderKey} has been saved. Total: ₹${total}`
      )}`,
      "_blank"
    );
    alert("Order saved successfully!");
  };

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    const { items, errors } = await loadAndCacheAllJson({ forceRefresh });
    setItemsCount(items.length);
    if (errors.length > 0) {
      setLoadError(`${errors.length} file(s) failed to load`);
      console.error("Failed files:", errors);
    } else {
      setLoadError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    (async () => {
      const existing = await localforage.getItem("orders");
      if (!existing) {
        await localforage.setItem("orders", {});
      }
    })();
  }, []);

  if (loading) return <div className="p-4">⏳ Loading data...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center p-4">
        <div className="flex gap-2">
          <button
            onClick={handleAddOrder}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ➕ Add Order
          </button>
          <button
            onClick={handleEditOrder}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            ✏️ Edit Order
          </button>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setShowCart(true)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 relative"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-4">
          Warning: {loadError}
        </div>
      )}

      {/* Order popup */}
      {showOrderPopup && (
        <Modal title="Select Order" onClose={() => setShowOrderPopup(false)}>
          <div className="space-y-2">
            {orderList.length === 0 ? (
              <p className="text-center text-gray-500">No orders found</p>
            ) : (
              orderList.map((o) => (
                <div
                  key={o.key}
                  className="flex justify-between p-3 border rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOrderSelect(o.key)}
                >
                  <span>{o.key}</span>
                  <span className="text-green-700">₹{o.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Mobile popup for edit */}
      {showMobilePopup && (
        <Modal
          title="Enter Mobile"
          onClose={() => {
            setTempMobile("");
            setShowMobilePopup(false);
          }}
        >
          <input
            type="text"
            value={tempMobile}
            onChange={(e) => setTempMobile(e.target.value)}
            placeholder="10-digit number"
            className="border px-2 py-1 rounded w-full mb-3"
          />
          <div className="flex justify-end">
            <button
              disabled={!/^\d{10}$/.test(tempMobile)}
              className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-80"
              onClick={() => {
                handleMobileEnter(tempMobile);
                setMobileInput(tempMobile);
                setShowMobilePopup(false);
              }}
            >
              OK
            </button>
          </div>
        </Modal>
      )}

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        {showCart ? (
          <CartView
            orderKey={selectedOrderKey}
            onSave={handleSaveOrder}
            onModify={() => setShowCart(false)}
          />
        ) : (
          <SearchBar />
        )}
      </Suspense>

      <p className="text-sm text-gray-500 text-right p-2">Loaded items: {itemsCount}</p>
    </div>
  );
}
