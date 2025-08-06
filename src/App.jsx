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
  const [mobileInput, setMobileInput] = useState("New Order");
  const [orderList, setOrderList] = useState([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [selectedOrderKey, setSelectedOrderKey] = useState(null);
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [tempMobile, setTempMobile] = useState("");

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
        console.log("Initialized empty orders object");
      }
    })();
  }, []);

  const handleMobileEnter = async (mobileVal) => {
    const num = (mobileVal || mobileInput).trim();
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

  const handleCartClick = async () => {
    const num = mobileInput.trim();

    if (!/^\d{10}$/.test(num)) {
      setShowMobilePopup(true);
      return;
    }

    const allOrders = (await localforage.getItem("orders")) || {};
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

    if (matchedOrders.length > 0) {
      setOrderList(matchedOrders);
      setShowOrderPopup(true);
    } else {
      setSelectedOrderKey("NEW");
      setShowCart(true);
    }
  };

  const handleOrderSelect = (orderKey) => {
    setSelectedOrderKey(orderKey);
    setShowOrderPopup(false);
    if (orderKey === "NEW") {
      setShowCart(true);
    } else {
      setShowCart(true);
    }
  };

  const handleSaveOrder = async (cartItems) => {
    const mobile = /^\d{10}$/.test(mobileInput)
      ? mobileInput
      : "unknown";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const allOrders = (await localforage.getItem("orders")) || {};
    const userOrders = Object.keys(allOrders).filter((k) =>
      k.startsWith(`${mobile}/${year}/${month}`)
    );
    const nextSerial = userOrders.length + 1;

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

  if (loading) return <div className="p-4">⏳ Loading data...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center p-4">
        <input
          type="text"
          value={mobileInput}
          onChange={(e) => {
            const val = e.target.value;
            setMobileInput(val);
            if (/^\d{10}$/.test(val)) {
              handleMobileEnter(val);
            } else if (showOrderPopup) {
              setShowOrderPopup(false);
            }
          }}
          placeholder="Enter Mobile or New Order"
          className="border px-2 py-1 rounded w-48"
        />
        <div className="flex gap-2">
          <button
            onClick={handleCartClick}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            🛒 Cart
          </button>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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

      {/* Order selection popup */}
      {showOrderPopup && (
        <Modal
          title="Select Order"
          onClose={() => setShowOrderPopup(false)}
        >
          <ul className="space-y-2">
            <li
              className="p-2 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => handleOrderSelect("NEW")}
            >
              ➕ New Order
            </li>
            {orderList.map((o) => (
              <li
                key={o.key}
                className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                onClick={() => handleOrderSelect(o.key)}
              >
                {o.key} - ₹{o.total.toFixed(2)}
                <div className="text-xs text-gray-500">{o.createdAt}</div>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* Mobile number popup */}
      {showMobilePopup && (
        <Modal
          title="Enter Mobile Number"
          onClose={() => {
            if (tempMobile.trim()) setMobileInput(tempMobile);
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
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-1 bg-gray-400 text-white rounded"
              onClick={() => {
                if (tempMobile.trim()) setMobileInput(tempMobile);
                setTempMobile("");
                setShowMobilePopup(false);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-1 bg-green-500 text-white rounded"
              onClick={() => {
                if (/^\d{10}$/.test(tempMobile)) {
                  setMobileInput(tempMobile);
                  setShowMobilePopup(false);
                  handleCartClick();
                } else {
                  alert("Invalid mobile number");
                }
              }}
            >
              OK
            </button>
          </div>
        </Modal>
      )}

      <Suspense fallback={<div className="p-4">Loading component...</div>}>
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

      <p className="text-sm text-gray-500 text-right p-2">
        Loaded items: {itemsCount}
      </p>
    </div>
  );
}
