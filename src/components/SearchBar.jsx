import React, { useState, useEffect, useCallback } from "react";
import localforage from "localforage";
import { debounce } from "lodash";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showMessage, setShowMessage] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      const q = searchQuery.toLowerCase().trim();
      
      // Clear results if query is too short
      if (q.length < 3) {
        setFiltered([]);
        setShowMessage(q.length > 0);
        return;
      }
      
      setShowMessage(false);
      
      // Split query into individual terms
      const searchTerms = q.split(/\s+/);
      
      const result = allItems.filter((item) => {
        const text = item.searchableText || '';
        
        // Check if all search terms appear in the text (in any order)
        return searchTerms.every(term => 
          text.includes(term)
        );
      });
      
      setFiltered(result);
    }, 300),
    [allItems]
  );

  useEffect(() => {
    localforage.getItem("allItems").then((data) => {
      if (data) setAllItems(data);
    });
  }, []);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  return (
    <div className="flex flex-col h-screen">
      {/* Results area that takes up remaining space and scrolls */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-2">
          {filtered.map((item, idx) => (
            <div key={`${item.CODE || idx}-${idx}`} className="border p-2 rounded bg-gray-50">
              {Object.entries(item)
                .filter(([key]) => !["searchableText", "source"].includes(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Sticky search bar at the bottom */}
      <div className="sticky bottom-0 bg-white p-4 border-t">
        {showMessage && (
          <div className="text-gray-500 mb-2">
            Please enter at least 3 characters to search
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            className="border p-2 rounded w-full"
            placeholder="Search (minimum 3 characters)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && debouncedSearch.flush()}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => debouncedSearch.flush()}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}