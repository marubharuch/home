import React from "react";

export default function SearchHeader({
  showMessage,
  selectedSource,
  sources,
  universalDiscount,
  discountOptions,
  handleSourceChange,
  handleSearchChange,
  handleUniversalDiscountChange,
}) {
  return (
    <div className="sticky top-0 bg-white p-4 border-b space-y-2 z-20">
      {showMessage && (
        <div className="text-gray-500">Please enter at least 3 characters to search</div>
      )}
      <div className="flex gap-2 w-full">
        <select
          value={selectedSource}
          onChange={handleSourceChange}
          className="border p-2 rounded w-[30%]"
        >
          <option value="ALL">All Files</option>
          {sources.map((src) => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>

        <input
          type="text"
          className="border p-2 rounded w-[45%]"
          placeholder="Search (min 3 characters)..."
          onChange={handleSearchChange}
        />

        <select
          value={universalDiscount}
          onChange={handleUniversalDiscountChange}
          className="border p-2 rounded w-[25%]"
        >
          {discountOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}%</option>
          ))}
        </select>
      </div>
    </div>
  );
}
