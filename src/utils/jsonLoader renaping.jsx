import React, { useState, useEffect } from "react";
import localforage from "localforage";
import MappingDialog from "./MappingDilog"

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

// Parse JSON dynamically (no change needed here)
const parseJSONFile = (raw, source) => {
  const items = [];
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
  return items;
};

// This is the new, refactored logic
export default function DataLoaderComponent({ onDataLoaded }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    fileName: "",
    sampleItem: {},
    prefilledMapping: {},
    resolve: null,
  });

  const getMappingFromDialog = (file, sample, prefilled = {}) => {
    return new Promise(resolve => {
      setDialogState({
        isOpen: true,
        fileName: file,
        sampleItem: sample,
        prefilledMapping: prefilled,
        resolve, // Store the promise's resolve function
      });
    });
  };

  const handleDialogSubmit = (mapping) => {
    // Hide the dialog and resolve the promise with the new mapping
    if (dialogState.resolve) {
      dialogState.resolve(mapping);
    }
    setDialogState({ isOpen: false, fileName: "", sampleItem: {}, prefilledMapping: {}, resolve: null });
  };

  const handleDialogCancel = () => {
    // Hide the dialog and resolve with an empty object (or null) to skip remapping
    if (dialogState.resolve) {
      dialogState.resolve(null);
    }
    setDialogState({ isOpen: false, fileName: "", sampleItem: {}, prefilledMapping: {}, resolve: null });
  };
  
  useEffect(() => {
    const loadData = async () => {
      const allItems = [];
      const errors = [];
      const fileDiscounts = {};

      let mappingCache = (await localforage.getItem("fileMappings")) || {};

      for (const file of jsonFiles) {
        try {
          const url = file.startsWith("http") ? file : `${import.meta.env.BASE_URL}${file}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const raw = await res.json();

          if (raw.defaultDiscount !== undefined) {
            fileDiscounts[file] = parseFloat(raw.defaultDiscount);
          }

          const parsed = parseJSONFile(raw, file);
          if (parsed.length === 0) continue;

          let mapping;
          const hasMapping = mappingCache[file] && Object.values(mappingCache[file]).some(v => v);

          if (hasMapping) {
            // New logic: Use getMappingFromDialog to await user input
            const shouldRemap = window.confirm(`Mapping already exists for ${file}.\nDo you want to remap it?`);

            if (shouldRemap) {
              mapping = await getMappingFromDialog(file, parsed[0], mappingCache[file]);
              mappingCache[file] = mapping;
            } else {
              mapping = mappingCache[file];
            }
          } else {
            // New logic: Use getMappingFromDialog
            mapping = await getMappingFromDialog(file, parsed[0]);
            mappingCache[file] = mapping;
          }
          
          if (!mapping) {
              // If the user cancelled the dialog
              mapping = mappingCache[file] || {};
          }
          
          const mappedItems = parsed.map(item => {
            const newItem = { ...item, source: file };
            Object.entries(mapping).forEach(([stdKey, origKey]) => {
              if (origKey) newItem[stdKey] = item[origKey];
            });
            return newItem;
          });

          allItems.push(...mappedItems);
          await localforage.setItem("fileMappings", mappingCache);

        } catch (err) {
          console.error(`Error loading ${file}`, err);
          errors.push({ file, error: err.message });
        }
      }

      await localforage.setItem("allItems", allItems);
      await localforage.setItem("loadErrors", errors);
      await localforage.setItem("fileDiscounts", fileDiscounts);

      if (onDataLoaded) {
          onDataLoaded({ items: allItems, errors, discounts: fileDiscounts, mappingInfo: mappingCache });
      }
    };

    loadData();
  }, []); // Run once on component mount

  return (
    <>
      {dialogState.isOpen && (
        <MappingDialog
          fileName={dialogState.fileName}
          sampleItem={dialogState.sampleItem}
          prefilled={dialogState.prefilledMapping}
          onSubmit={handleDialogSubmit}
          onCancel={handleDialogCancel}
        />
      )}
      <div>Loading data...</div>
    </>
  );
}