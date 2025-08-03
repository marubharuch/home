import React, { useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import ItemCard from "./ItemCard";
import SearchHeader from "./SearchHeader";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [sources, setSources] = useState([]);
  const [universalDiscount, setUniversalDiscount] = useState(30);
  const [discountMap, setDiscountMap] = useState({});
  const [fileDiscounts, setFileDiscounts] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);
  const [cart, setCart] = useState({});
  const [loadingIndex, setLoadingIndex] = useState(true);

  const normalizeKey = (key) => key.replace(/[\s._]/g, "").toLowerCase();
  const excludedKeysNormalized = new Set([
    "searchabletext", "source", "no", "no.", "sno", "slno", "s.no.",
    "pkgouter", "master", "code", "particulars", "category", "description",
    "package", "pkg"
  ]);
  const priceKeys = ["price", "rate", "basic", "dlp", "mrpp"];
  const discountOptions = Array.from({ length: (70 - 3) * 2 + 1 }, (_, i) => 3 + i * 0.5);

  // ✅ Load cached data and build Fuse instance
  useEffect(() => {
    setLoadingIndex(true);
    Promise.all([
      localforage.getItem("allItems"),
      localforage.getItem("fileDiscounts"),
      localforage.getItem("cartItems"),
    ]).then(([data, discounts, savedCart]) => {
      if (data) {
        setAllItems(data);
        setSources([...new Set(data.map((item) => item.source))]);
        setFuse(new Fuse(data, { keys: ["searchableText"], threshold: 0.3 }));
      }
      if (discounts) setFileDiscounts(discounts);
      if (savedCart) setCart(savedCart);

      setLoadingIndex(false);
    });
  }, []);

  useEffect(() => setVisibleCount(20), [query, selectedSource]);

  useEffect(() => {
    if (selectedSource !== "ALL") {
      setUniversalDiscount(fileDiscounts[selectedSource] ?? 30);
    } else {
      setUniversalDiscount(10);
    }
  }, [selectedSource, fileDiscounts]);

  // ✅ Optimized search using Fuse
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (q.length === 0 && selectedSource !== "ALL") {
      setShowMessage(false);
      return allItems.filter((item) => item.source === selectedSource);
    }
    if (q.length === 0) {
      setShowMessage(false);
      return [];
    }
    if (q.length < 3) {
      setShowMessage(true);
      return [];
    }

    setShowMessage(false);

    if (fuse) {
      const results = fuse.search(q).map(r => r.item);
      return selectedSource === "ALL"
        ? results
        : results.filter(item => item.source === selectedSource);
    }

    return [];
  }, [query, selectedSource, allItems, fuse]);

  const updateItemDiscount = (discountKey, newDiscount) => {
    setDiscountMap((prev) => ({ ...prev, [discountKey]: newDiscount }));
  };

  const handleUniversalDiscountChange = (e) => {
    const val = parseFloat(e.target.value);
    setUniversalDiscount(val);

    if (selectedSource !== "ALL") {
      setFileDiscounts((prev) => ({
        ...prev,
        [selectedSource]: val,
      }));
    }
    setDiscountMap({});
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + 20);

  const handleQuantityChange = async (discountKey, item, fieldKey, qty) => {
    const quantity = parseInt(qty, 10) || 0;
    const discount = discountMap[discountKey] ?? universalDiscount;
    const price = parseFloat(item[fieldKey]) || 0;

    const updatedCart = {
      ...cart,
      [discountKey]: {
        ...item,
        discount,
        fieldKey,
        quantity,
        finalPrice: (price * (1 - discount / 100)).toFixed(2),
      },
    };

    setCart(updatedCart);
    await localforage.setItem("cartItems", updatedCart);
  };

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 200), []);

  return (
    <div className="flex flex-col h-screen max-w-full overflow-x-hidden">
      <SearchHeader
        showMessage={showMessage}
        selectedSource={selectedSource}
        sources={sources}
        universalDiscount={universalDiscount}
        discountOptions={discountOptions}
        handleSourceChange={(e) => setSelectedSource(e.target.value)}
        handleSearchChange={(e) => debouncedSetQuery(e.target.value)}
        handleUniversalDiscountChange={handleUniversalDiscountChange}
      />

      {loadingIndex ? (
        <div className="text-center mt-8 text-gray-500">Loading search index...</div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-3">
            {filteredResults.slice(0, visibleCount).map((item, idx) => (
              <ItemCard
                key={idx}
                item={item}
                idx={idx}
                normalizeKey={normalizeKey}
                excludedKeysNormalized={excludedKeysNormalized}
                priceKeys={priceKeys}
                discountMap={discountMap}
                universalDiscount={universalDiscount}
                updateItemDiscount={updateItemDiscount}
                handleQuantityChange={handleQuantityChange}
                cart={cart}
              />
            ))}
          </div>

          {filteredResults.length > visibleCount && (
            <div className="text-center mt-4">
              <button
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                onClick={handleLoadMore}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
