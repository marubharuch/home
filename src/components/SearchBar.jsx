import React, { useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { debounce } from "lodash";
import ItemCard from "./ItemCard";
import SearchHeader from "./SearchHeader";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [sources, setSources] = useState([]);
  const [universalDiscount, setUniversalDiscount] = useState(30);
  const [discountMap, setDiscountMap] = useState({});
  const [fileDiscounts, setFileDiscounts] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);
  const [cart, setCart] = useState({});

  const normalizeKey = (key) => key.replace(/[\s._]/g, "").toLowerCase();
  const excludedKeysNormalized = new Set([
    "searchabletext", "source", "no", "no.", "sno", "slno", "s.no.",
    "pkgouter", "master", "code", "particulars", "category", "description",
    "package", "pkg"
  ]);
  const priceKeys = ["price", "rate", "basic", "dlp", "mrpp"];
  const discountOptions = Array.from({ length: (70 - 3) * 2 + 1 }, (_, i) => 3 + i * 0.5);

  // ✅ Load data
  useEffect(() => {
    Promise.all([
      localforage.getItem("allItems"),
      localforage.getItem("fileDiscounts"),
      localforage.getItem("cartItems"),
    ]).then(([data, discounts, savedCart]) => {
      if (data) {
        setAllItems(data);
        const uniqueSources = Array.from(new Set(data.map((item) => item.source)));
        setSources(uniqueSources);
      }
      if (discounts) setFileDiscounts(discounts);
      if (savedCart) setCart(savedCart);
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
    const searchTerms = q.split(/\s+/);

    return allItems
      .filter((item) => selectedSource === "ALL" || item.source === selectedSource)
      .filter((item) => {
        const text = item.searchableText?.toLowerCase() || "";
        return searchTerms.every((term) => {
          const regex = /^\d+$/.test(term)
            ? new RegExp(`(^|\\D)${term}(\\D|$)`)
            : new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
          return regex.test(text);
        });
      });
  }, [allItems, query, selectedSource]);

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
    </div>
  );
}
