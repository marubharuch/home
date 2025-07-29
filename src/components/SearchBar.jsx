import React, { useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { debounce } from "lodash";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [sources, setSources] = useState([]);
  const [universalDiscount, setUniversalDiscount] = useState(30);
  const [discountMap, setDiscountMap] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);

  const normalizeKey = (key) => key.replace(/[\s._]/g, "").toLowerCase();

  const excludedKeysNormalized = new Set([
    "searchabletext", "source", "no", "no.", "sno", "slno", "s.no.",
    "pkgouter", "master", "code", "particulars", "category"
  ]);

  const discountOptions = Array.from({ length: (70 - 3) * 2 + 1 }, (_, i) => 3 + i * 0.5);

  const createNumberSafeRegex = (term) => {
    if (/^\d+$/.test(term)) {
      return new RegExp(`(^|\\D)${term}(\\D|$)`);
    }
    return new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), "i");
  };

  useEffect(() => {
    localforage.getItem("allItems").then((data) => {
      if (data) {
        setAllItems(data);
        const uniqueSources = Array.from(new Set(data.map((item) => item.source)));
        setSources(uniqueSources);
      }
    });
  }, []);

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (q.length < 3) {
      setShowMessage(q.length > 0);
      return [];
    }

    setShowMessage(false);
    const searchTerms = q.split(/\s+/);

    return allItems
      .filter((item) => selectedSource === "ALL" || item.source === selectedSource)
      .filter((item) => {
        const text = item.searchableText?.toLowerCase() || "";
        return searchTerms.every((term) => {
          const regex = createNumberSafeRegex(term);
          return regex.test(text);
        });
      });
  }, [allItems, query, selectedSource]);

  const updateItemDiscount = (id, newDiscount) => {
    setDiscountMap((prev) => ({ ...prev, [id]: newDiscount }));
  };

  const handleUniversalDiscountChange = (e) => {
    const val = parseFloat(e.target.value);
    setUniversalDiscount(val);
    setDiscountMap({});
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 200), []);

  return (
    <div className="flex flex-col h-screen">
      {/* Sticky Search Bar at Top */}
      <div className="sticky top-0 bg-white p-4 border-b space-y-2 z-20">
        {showMessage && (
          <div className="text-gray-500">
            Please enter at least 3 characters to search
          </div>
        )}
  
        <div className="flex gap-2 w-full">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="border p-2 rounded w-[30%]"
          >
            <option value="ALL">All Files</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
  
          <input
            type="text"
            className="border p-2 rounded w-[50%]"
            placeholder="Search (min 3 characters)..."
            onChange={(e) => debouncedSetQuery(e.target.value)}
          />
  
          <select
            value={universalDiscount}
            onChange={handleUniversalDiscountChange}
            className="border p-2 rounded w-[15%]"
          >
            {discountOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}%
              </option>
            ))}
          </select>
  
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded w-[10%] min-w-[64px]"
            onClick={() => debouncedSetQuery.flush()}
          >
            Search
          </button>
        </div>
      </div>
  
      {/* Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3">
          {filteredResults.slice(0, visibleCount).map((item, idx) => {
            const id = item.CODE || `${item.source}-${idx}`;
            const discount = discountMap[id] ?? universalDiscount;
  
            return (
              <div key={id} className="border p-3 rounded bg-white shadow-sm">
                {/* Top info */}
                <div className="flex flex-wrap gap-6 text-sm font-medium mb-2">
                  {Object.entries(item)
                    .filter(([key]) =>
                      ["code", "particulars", "category"].includes(normalizeKey(key))
                    )
                    .map(([key, value]) => (
                      <div key={key}>
                        <strong>{normalizeKey(key)}:</strong> {String(value)}
                      </div>
                    ))}
                </div>
  
                {/* Price Rows */}
                <div className="space-y-1">
                  {Object.entries(item)
                    .filter(([key]) => !excludedKeysNormalized.has(normalizeKey(key)))
                    .map(([key, value]) => {
                      const original = parseFloat(value);
                      const isNumeric = !isNaN(original);
                      const discounted = isNumeric
                        ? (original * (1 - discount / 100)).toFixed(2)
                        : null;
  
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <div className="font-semibold whitespace-nowrap">{key}:</div>
                          {isNumeric ? (
                            <div className="text-gray-700">
                              {original} @{" "}
                              <select
                                value={discount}
                                onChange={(e) =>
                                  updateItemDiscount(id, parseFloat(e.target.value))
                                }
                                className="border border-gray-300 rounded px-1 py-0.5 text-sm"
                              >
                                {discountOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    -{opt}%
                                  </option>
                                ))}
                              </select>{" "}
                              = ₹{discounted}
                            </div>
                          ) : (
                            <div className="text-gray-600">{String(value)}</div>
                          )}
                        </div>
                      );
                    })}
                </div>
  
                <div className="text-xs text-gray-400 mt-2">Source: {item.source}</div>
              </div>
            );
          })}
        </div>
  
        {/* Load More */}
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
