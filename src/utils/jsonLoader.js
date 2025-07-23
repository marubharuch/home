import localforage from "localforage";

export const jsonFiles = [
  "woodem_plats.json",
  "4x_plats.json",
  "Switchgear.json",
  "woodem_accessories.json",
  "ZINE_ACCESSORIES.json",
  "4x_ACCESSORIES.json",
];

const parseJSONFile = (raw, source) => {
  const items = [];

  // Handle WOODEM PLATES structure
  if (raw?.["WOODEM PLATES PRICELIST - 01.04.2025"]) {
    const categories = raw["WOODEM PLATES PRICELIST - 01.04.2025"];
    Object.entries(categories).forEach(([category, entries]) => {
      if (Array.isArray(entries)) {
        entries.forEach(item => {
          items.push({
            ...item,
            category,
            source,
            // Create a searchable string that includes category
            searchableText: `${Object.values(item).join(' ')} ${category}`.toLowerCase()
          });
        });
      }
    });
  }
  // Handle SWITCHGEAR structure
  else if (raw?.SWITCHGEAR_PRICELIST?.products) {
    raw.SWITCHGEAR_PRICELIST.products.forEach(p => {
      p.items?.forEach(item => {
        items.push({
          ...item,
          category: p.category,
          source,
          searchableText: `${Object.values(item).join(' ')} ${p.category}`.toLowerCase()
        });
      });
    });
  }
  // Handle generic arrays/objects
  else {
    const processItem = (item, category = '') => {
      items.push({
        ...item,
        category,
        source,
        searchableText: `${Object.values(item).join(' ')} ${category}`.toLowerCase()
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

export const loadAndCacheAllJson = async () => {
  const allItems = [];
  const errors = [];

  for (const file of jsonFiles) {
    try {
      const res = await fetch(file.startsWith("http") ? file : `/${file}`);
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