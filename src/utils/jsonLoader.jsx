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

// fetchJsonFile
export const fetchJsonFile = async (file) => {
  try {
    const url = file.startsWith("http")
      ? file
      : `${import.meta.env.BASE_URL}${file}?v=${Date.now()}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = await res.json();
    return { rawData: raw, error: null };
  } catch (error) {
    console.error(`❌ Error loading ${file}`, error);
    return { rawData: null, error };
  }
};

// parseJsonData
export const parseJsonData = (raw, source) => {
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

// loadAndCacheAllJson
export const loadAndCacheAllJson = async ({ forceRefresh = false }) => {
  let allItems = [];
  let fileStructures = {};

  for (const file of jsonFiles) {
    let cached = !forceRefresh ? await localforage.getItem(file) : null;

    if (!cached) {
      const { rawData, error } = await fetchJsonFile(file);
      if (error) continue;
      await localforage.setItem(file, rawData);
      cached = rawData;
    }

    fileStructures[file] = cached;
    const parsed = parseJsonData(cached, file);
    allItems = allItems.concat(parsed);
  }

  return { items: allItems, fileStructures };
};
