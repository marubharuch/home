import React, { useEffect, useState } from "react";
import { loadAndCacheAllJson } from "./utils/jsonLoader";
import SearchBar from "./components/SearchBar";
import CartView from "./components/CartView";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [itemsCount, setItemsCount] = useState(0);
  const [showCart, setShowCart] = useState(false); // ✅ Toggle state

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
  }, []);

  if (loading) return <div className="p-4">⏳ Loading data...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-l font-bold text-center">Products</h1>
        <div className="flex gap-2">
          {/* ✅ Cart Button moved to top-right */}
          <button
            onClick={() => setShowCart((prev) => !prev)}
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

      {/* ✅ Toggle between Search and Cart */}
      {showCart ? <CartView /> : <SearchBar />}

      <p className="text-sm text-gray-500 text-right p-2">
        Loaded items: {itemsCount}
      </p>
    </div>
  );
}
