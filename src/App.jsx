import React, { useEffect, useState, lazy, Suspense } from "react";
import localforage from "localforage";

import { loadAndCacheAllJson } from "./utils/jsonLoader";
import {
  getCartCount,
  getAllOrders,
  sortOrdersByDate,
  calculateTotal,
  clearCart,
} from "./utils/orderUtils";

import OrderPopup from "./components/OrderPopup";
import MobilePopup from "./components/MobilePopup";
import FileStructureModal from "./components/FileStructureModal";

const SearchBar = lazy(() => import("./components/SearchBar"));
const CartView = lazy(() => import("./components/CartView"));

export default function App() {
  const [loading, setLoading] = useState(true);
  const [itemsCount, setItemsCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [mobileInput, setMobileInput] = useState("");
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [selectedOrderKey, setSelectedOrderKey] = useState(null);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [items, setItems] = useState([]);

  // For file structure modal
  const [fileStructures, setFileStructures] = useState({});
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const fileNames = Object.keys(fileStructures);

  const loadData = async (forceRefresh = false) => {
    console.log("loadData called, refresh:", forceRefresh);
    const { items, fileStructures } = await loadAndCacheAllJson({ forceRefresh });
    setItems(items);
    setItemsCount(items.length);
    setFileStructures(fileStructures);
    setLoading(false);
  };

  const updateCartCount = async () => {
    setCartCount(await getCartCount());
  };

  useEffect(() => {
    loadData(false);
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  const handleAddOrder = async () => {
    await clearCart();
    setShowCart(false);
    setSelectedOrderKey(null);
    setSelectedOrderData(null);
    setMobileInput("");
    alert("🆕 Started a new order. Cart is cleared.");
  };

  const reloadOrders = async () => {
    const allOrders = await getAllOrders();
    const orderArray = Object.entries(allOrders).map(([key, data]) => ({
      key,
      total: calculateTotal(data.cart),
      createdAt: data.createdAt || "",
    }));
    setOrderList(sortOrdersByDate(orderArray));
  };

  const handleEditOrder = async () => {
    await reloadOrders();
    setShowOrderPopup(true);
  };

  const handleOrderSelect = async (orderKey) => {
    const allOrders = await getAllOrders();
    const selectedOrder = allOrders[orderKey];
    if (selectedOrder) {
      setSelectedOrderData(selectedOrder);
    } else {
      setSelectedOrderData(null);
    }
    setSelectedOrderKey(orderKey);
    setShowOrderPopup(false);
    setShowCart(true);
  };

  const handleFileConfirm = () => {
    if (currentFileIndex < fileNames.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      setFileStructures({});
    }
  };

  const handleFileSkip = () => {
    if (currentFileIndex < fileNames.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      setFileStructures({});
    }
  };
  
  if (loading) return <div className="p-4">⏳ Loading...</div>;

  // Show modal if there are still files to review
  if (fileNames.length > 0 && currentFileIndex < fileNames.length) {
    const fileName = fileNames[currentFileIndex];
    return (
      <FileStructureModal
        fileName={fileName}
        fileStructure={fileStructures[fileName]}
        onConfirm={handleFileConfirm}
        onSkip={handleFileSkip}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between p-4">
        <div className="flex gap-2">
          v 1.0
          <button onClick={handleAddOrder}>➕ Add Order</button>
          <button onClick={handleEditOrder}>✏️ Edit Order</button>
        </div>
        <div className="flex gap-2 relative">
          <button onClick={() => setShowCart(true)}>
            🛒 Cart {cartCount > 0 && <span>{cartCount}</span>}
          </button>
          <button onClick={() => loadData(true)}>🔄 Refresh</button>
        </div>
      </div>

      {showOrderPopup && (
        <OrderPopup
          orders={orderList}
          onSelect={handleOrderSelect}
          onClose={() => setShowOrderPopup(false)}
          onDelete={reloadOrders}
        />
      )}

      {showMobilePopup && (
        <MobilePopup
          onConfirm={(num) => {
            setMobileInput(num);
            setShowMobilePopup(false);
            setShowCart(true);
          }}
          onClose={() => setShowMobilePopup(false)}
        />
      )}

      <Suspense fallback={<div>Loading...</div>}>
        {showCart ? (
          <CartView
            orderKey={selectedOrderKey}
            selectedOrder={selectedOrderData}
          />
        ) : (
          <SearchBar items={items} />
        )}
      </Suspense>

      <p className="text-sm text-gray-500 text-right p-2">
        Loaded items: {itemsCount}
      </p>
    </div>
  );
}
