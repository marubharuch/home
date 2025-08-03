import React from "react";
import ItemCard from "./ItemCard";

export default function ItemList({
  items,
  visibleCount,
  onLoadMore,
  discountMap,
  updateItemDiscount,
  handleQuantityChange,
  universalDiscount,
  priceKeys,
  cart,
}) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid gap-3">
        {items.slice(0, visibleCount).map((item, idx) => (
          <ItemCard
            key={item.CODE || `${item.source}-${idx}`}
            item={item}
            discountMap={discountMap}
            updateItemDiscount={updateItemDiscount}
            handleQuantityChange={handleQuantityChange}
            universalDiscount={universalDiscount}
            priceKeys={priceKeys}
            cart={cart}
          />
        ))}
      </div>

      {items.length > visibleCount && (
        <div className="text-center mt-4">
          <button
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            onClick={onLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
