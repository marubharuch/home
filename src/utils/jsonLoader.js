import localforage from "localforage";

export const jsonFiles =[
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
]
 ;

const parseJSONFile = (raw, source) => {
  const items = [];

  // WOODEM PLATES structure
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
  }

  // SWITCHGEAR structure
  else if (raw?.SWITCHGEAR_PRICELIST?.products) {
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
  }

  // Generic object or array
  else {
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
  if (!forceRefresh) {
    const cachedItems = await localforage.getItem("allItems");
    const cachedErrors = await localforage.getItem("loadErrors");
    if (cachedItems && cachedItems.length > 0) {
      return { items: cachedItems, errors: cachedErrors || [] };
    }
  }

  const allItems = [];
  const errors = [];

  for (const file of jsonFiles) {
    try {
      const url = file.startsWith("http")
        ? file
        : `${import.meta.env.BASE_URL}${file}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const parsed = parseJSONFile(raw, file);
      allItems.push(...parsed);
    } catch (err) {
      console.error(`Error loading ${file}`, err);
      errors.push({ file, error: err.message });
    }
  }

  await localforage.setItem("allItems", allItems);
  await localforage.setItem("loadErrors", errors);
  return { items: allItems, errors };
};

