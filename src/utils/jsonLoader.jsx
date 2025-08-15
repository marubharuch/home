import localforage from "localforage";

export const jsonFiles = [
  "4x_ACCESSORIES.json",
  "4x_plats.json",
  "diwali.json",
  "FAN_fybros.json",
  "other.json",
  "rapid.json",
  "Switchgear.json",
  "wire.json",
  "woodem_accessories.json",
  "woodem_plats.json",
  "ZINE_ACCESSORIES.json"
];

const parseJSONFile = (raw, source) => {
  console.log(`📄 Parsing file: ${source}`);
  const items = [];

  if (raw?.["WOODEM PLATES PRICELIST - 01.04.2025"]) {
    const categories = raw["WOODEM PLATES PRICELIST - 01.04.2025"];
    Object.entries(categories).forEach(([category, entries]) => {
      if (Array.isArray(entries)) {
        entries.forEach(item => {
          items.push({
            ...item,
            category,
            source,
            searchableText: `${Object.values(item).join(" ")} ${category}`.toLowerCase(),
          });
        });
      }
    });

  } else if (raw?.SWITCHGEAR_PRICELIST?.products) {
    raw.SWITCHGEAR_PRICELIST.products.forEach(p => {
      p.items?.forEach(item => {
        items.push({
          ...item,
          category: p.category,
          source,
          searchableText: `${Object.values(item).join(" ")} ${p.category}`.toLowerCase(),
        });
      });
    });

  } else {
    const processItem = (item, category = "") => {
      items.push({
        ...item,
        category,
        source,
        searchableText: `${Object.values(item).join(" ")} ${category}`.toLowerCase(),
      });
    };

    if (Array.isArray(raw)) {
      raw.forEach(item => processItem(item));
    } else if (typeof raw === "object") {
      Object.entries(raw).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => processItem(item, key));
        } else if (typeof value === "object") {
          processItem(value, key);
        }
      });
    }
  }
  return items;
};

export const loadAndCacheAllJson = async ({ forceRefresh = false } = {}) => {
  console.log("🚀 loadAndCacheAllJson started", { forceRefresh });

  const allItems = [];
  const errors = [];
  const fileDiscounts = {};

  // ✅ If no force refresh, try to load from cache
  if (!forceRefresh) {
    const cachedAll = await localforage.getItem("allItems");
    const cachedDiscounts = await localforage.getItem("fileDiscounts");
    if (cachedAll && cachedAll.length > 0) {
      console.log("✅ Using cached data");
      return { items: cachedAll, errors: [], discounts: cachedDiscounts || {} };
    }
  }

  console.log("♻ Fetching JSON files from server...");
  for (const file of jsonFiles) {
    try {
      const url = file.startsWith("http")
        ? file
        : `${import.meta.env.BASE_URL}${file}?v=${Date.now()}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      if (raw.defaultDiscount !== undefined) {
        fileDiscounts[file] = parseFloat(raw.defaultDiscount);
      }

      const parsed = parseJSONFile(raw, file);
      allItems.push(...parsed);

    } catch (err) {
      console.error(`❌ Error loading ${file}`, err);
      errors.push({ file, error: err.message });

      // Fallback: try cached version for this file
      const cachedAll = await localforage.getItem("allItems");
      if (cachedAll && cachedAll.length > 0) {
        const fileItems = cachedAll.filter(item => item.source === file);
        if (fileItems.length > 0) {
          allItems.push(...fileItems);
        }
      }
    }
  }

  // ✅ Update cache in background (non-blocking for UI update)
  localforage.setItem("allItems", allItems);
  localforage.setItem("loadErrors", errors);
  localforage.setItem("fileDiscounts", fileDiscounts);

  console.log("✅ Fetched & returned fresh data to UI");
  return { items: allItems, errors, discounts: fileDiscounts };
};
