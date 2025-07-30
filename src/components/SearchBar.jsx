import React, { useState, useEffect, useMemo } from "react";
import localforage from "localforage";
import { debounce } from "lodash";
import { Percent } from "lucide-react"; // icon for mobile

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [sources, setSources] = useState([]);
  const [universalDiscount, setUniversalDiscount] = useState(30);
  const [discountMap, setDiscountMap] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);

  const normalizeKey = (key) => key.replace(/[\s._]/g, "").toLowerCase();

  const excludedKeysNormalized = new Set([
    "searchabletext", "source", "no", "no.", "sno", "slno", "s.no.",
    "pkgouter", "master", "code", "particulars", "category","description","package","pkg"
  ]);

  const priceKeys = ["price", "rate", "basic","dlp", "mrpp"];
  const discountOptions = Array.from({ length: (70 - 3) * 2 + 1 }, (_, i) => 3 + i * 0.5);

  const createNumberSafeRegex = (term) => {
    if (/^\d+$/.test(term)) {
      return new RegExp(`(^|\\D)${term}(\\D|$)`);
    }
    return new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
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

  // Reset visible count when query or file changes
  useEffect(() => {
    setVisibleCount(20);
  }, [query, selectedSource]);

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    // Show all items of a file when no search
    if (q.length === 0 && selectedSource !== "ALL") {
      setShowMessage(false);
      return allItems.filter((item) => item.source === selectedSource);
    }

    // Show nothing if ALL is selected and no query
    if (q.length === 0) {
      setShowMessage(false);
      return [];
    }

    // Show message if query too short
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
    setShowDiscountDropdown(false);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const debouncedSetQuery = useMemo(() => debounce(setQuery, 200), []);

  return (
    <div className="flex flex-col h-screen max-w-full overflow-x-hidden">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 bg-white p-4 border-b space-y-2 z-20">
        {showMessage && (
          <div className="text-gray-500">Please enter at least 3 characters to search</div>
        )}

<div className="flex  gap-2 w-full">

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
            className="border p-2 rounded w-[45%]"
            placeholder="Search (min 3 characters)..."
            onChange={(e) => debouncedSetQuery(e.target.value)}
          />

          <select
            value={universalDiscount}
            onChange={handleUniversalDiscountChange}
            className="border p-2 rounded w-[25%]"
          >
            {discountOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}%
              </option>
            ))}
          </select>

        {/*  <button
            className="bg-blue-500 text-white px-4 py-2 rounded w-[10%] min-w-[64px]"
            onClick={() => debouncedSetQuery.flush()}
          >
            Search
          </button>
            */}       </div>
      </div>


      {/* Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3">
          {filteredResults.slice(0, visibleCount).map((item, idx) => {
            const id = item.CODE || `${item.source}-${idx}`;
            const discount = discountMap[id] ?? universalDiscount;

            return (
              <div key={id} className="border p-3 rounded bg-white shadow-sm w-full break-words">
                {/* Top info */}
                <div className="flex flex-wrap gap-6 text-sm font-medium mb-2">
                  {Object.entries(item)
                    .filter(([key]) =>
                      ["code", "particulars","description"].includes(normalizeKey(key))
                    )
                    .map(([key, value]) => (
                      <div key={key}>
                        <strong>{String(value)}:</strong> 
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
                      const isPriceField = priceKeys.some((k) =>
                        normalizeKey(key).includes(k)
                      );

                      return (
                        <div
  key={key}
  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm w-full"
>
  <div className="font-semibold whitespace-nowrap">
    {/dlp|rate/i.test(key) && /^[\s]*((dlp|rate)[\s]*)+$/i.test(key)
      ? key
      : key.replace(/dlp|rate/gi, "").trim()}
  </div>
  
  {isNumeric ? (
    isPriceField ? (
      <div className="flex flex-wrap items-center gap-1 text-gray-700">
        <span className="whitespace-nowrap">₹{original}</span>
        <span>@</span>
        <select
          value={discount}
          onChange={(e) => updateItemDiscount(id, parseFloat(e.target.value))}
          className="border border-gray-300 rounded px-1 py-0.5 text-sm"
        >
          {discountOptions.map((opt) => (
            <option key={opt} value={opt}>
              -{opt}%
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap">
          = ₹{(original * (1 - discount / 100)).toFixed(2)}
        </span>
      </div>
    ) : (
      <div className="text-gray-700">{original}</div>
    )
  ) : (
    <div className="text-gray-600">{String(value)}</div>
  )}
</div>

                      );
                    })}
                </div>

                {/* Show ALL keys and values */}
{/*<div className="space-y-1 text-sm">
  {Object.entries(item).map(([key, value]) => {
    const original = parseFloat(value);
    const isNumeric = !isNaN(original);
    const isPriceField = priceKeys.some((k) =>
      normalizeKey(key).includes(k)
    );

    return (
      <div key={key} className="flex items-center gap-2">
        <div className="font-semibold whitespace-nowrap">{key}:</div>
        {isNumeric && isPriceField ? (
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
            = ₹{(original * (1 - discount / 100)).toFixed(2)}
          </div>
        ) : (
          <div className="text-gray-600">{String(value)}</div>
        )}
      </div>
    );
  })}
</div>*/}


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
