import React, { useState, useEffect, useCallback } from "react";
import localforage from "localforage";
import { debounce } from "lodash";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [sources, setSources] = useState([]);

  // Normalize a key for comparison
  const normalizeKey = (key) => key.replace(/[\s._]/g, "").toLowerCase();

  const excludedKeysNormalized = new Set([
    "searchabletext", "source", "no", "no.", "sno","slno", "s.no.",
    "pkgouter", "master", "code", "particulars", "category"
  ]);

  // Function to create number-safe regex
  const createNumberSafeRegex = (term) => {
    if (/^\d+$/.test(term)) {
      return new RegExp(`(^|\\D)${term}(\\D|$)`);
    }
    return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery, sourceFilter) => {
      const q = searchQuery.toLowerCase().trim();

      if (q.length < 3) {
        setFiltered([]);
        setShowMessage(q.length > 0);
        return;
      }

      setShowMessage(false);

      const searchTerms = q.split(/\s+/);

      const result = allItems
        .filter((item) => sourceFilter === "ALL" || item.source === sourceFilter)
        .filter((item) => {
          const text = item.searchableText?.toLowerCase() || "";
          return searchTerms.every((term) => {
            const regex = createNumberSafeRegex(term);
            return regex.test(text);
          });
        });

      setFiltered(result);
    }, 300),
    [allItems]
  );

  useEffect(() => {
    localforage.getItem("allItems").then((data) => {
      if (data) {
        setAllItems(data);
        const uniqueSources = Array.from(new Set(data.map((item) => item.source)));
        setSources(uniqueSources);
      }
    });
  }, []);

  useEffect(() => {
    debouncedSearch(query, selectedSource);
    return () => debouncedSearch.cancel();
  }, [query, selectedSource, debouncedSearch]);

  return (
    <div className="flex flex-col h-screen">
      {/* Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-2">
          {filtered.map((item, idx) => (
            <div key={`${item.CODE || idx}-${idx}`} className="border p-2 rounded bg-gray-50">
              {/* Show main fields first */}
              <div className="flex flex-wrap gap-4 mb-2">
                {Object.entries(item)
                  .filter(([key]) => ["code", "particulars", "category"].includes(normalizeKey(key)))
                  .map(([key, value]) => (
                    <div key={key}>
                      <strong>{String(value)}:</strong> 
                    </div>
                  ))}
              </div>

              {/* Show other fields except excluded and already shown */}
              {Object.entries(item)
                .filter(([key]) => !excludedKeysNormalized.has(normalizeKey(key)))
                .map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}

              {/* Show source */}
              <div className="text-xs text-gray-400">Source: {item.source}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky search bar */}
      <div className="sticky bottom-0 bg-white p-4 border-t space-y-2">
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
            className="border p-2 rounded w-[60%]"
            placeholder="Search (min 3 characters)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && debouncedSearch.flush()}
          />

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded w-[10%] min-w-[64px]"
            onClick={() => debouncedSearch.flush()}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
