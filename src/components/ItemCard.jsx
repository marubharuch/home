import React from "react";

export default function ItemCard({
  item,
  idx,
  normalizeKey,
  excludedKeysNormalized,
  priceKeys,
  discountMap,
  universalDiscount,
  updateItemDiscount,
  handleQuantityChange,
  cart,
}) {
  const id = item.CODE || `${item.source}-${idx}`;

  return (
    <div className="border p-3 rounded bg-white shadow-sm w-full break-words">
      <div className="flex flex-wrap gap-6 text-sm font-medium mb-2">
        {Object.entries(item)
          .filter(([key]) =>
            ["code", "particulars", "description","name"].includes(normalizeKey(key))
          )
          .map(([key, value]) => (
            <div key={key}><strong>{String(value)}:</strong></div>
          ))}
      </div>

      <div className="space-y-1">
        {Object.entries(item)
          .filter(([key]) => !excludedKeysNormalized.has(normalizeKey(key)))
          .map(([key, value]) => {
            const original = parseFloat(value);
            const isPriceField = priceKeys.some((k) =>
              normalizeKey(key).includes(k)
            );
            if (!isPriceField || isNaN(original)) return null;

            const discountKey = `${id}-${key}`;
            const discount = discountMap[discountKey] ?? universalDiscount;
            const quantity = cart[discountKey]?.quantity || "";

            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm w-full">
                <div className="font-semibold whitespace-nowrap">
                  {/dlp|rate/i.test(key) && /^[\s]*((dlp|rate)[\s]*)+$/i.test(key)
                    ? key
                    : key.replace(/dlp|rate/gi, "").trim()}
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <span className="whitespace-nowrap">₹{original}</span>
                  <span>@</span>

                  <select
                    value={discount}
                    onChange={(e) => updateItemDiscount(discountKey, parseFloat(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {Array.from({ length: (70 - 3) * 2 + 1 }, (_, i) => 3 + i * 0.5)
                      .map((opt) => (
                        <option key={opt} value={opt}>-{opt}%</option>
                      ))}
                  </select>

                  <span>= ₹{(original * (1 - discount / 100)).toFixed(2)}</span>

                  <input
                    type="number"
                    min="0"
                    max="1200"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(discountKey, item, key, e.target.value)
                    }
                    className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm w-16"
                  />
                </div>
              </div>
            );
          })}
      </div>

      <div className="text-xs text-gray-400 mt-2">Source: {item.source}</div>
    </div>
  );
}
