// src/utils/keyMappingUtils.js
import localforage from "localforage";

/**
 * Load JSON from public folder
 */
export async function loadJsonFromPublic(fileName) {
  const response = await fetch(`/${fileName}`);
  if (!response.ok) throw new Error(`Failed to load ${fileName}`);
  return await response.json();
}

/**
 * Extract available keys from JSON array
 */
export function getAvailableKeys(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  return Object.keys(data[0]);
}

/**
 * Save mapping to localforage
 */
export async function saveMapping(fileName, mapping) {
  await localforage.setItem(`mapping_${fileName}`, mapping);
}

/**
 * Load saved mapping if available
 */
export async function loadMapping(fileName) {
  return await localforage.getItem(`mapping_${fileName}`);
}

/**
 * Apply mapping to JSON data
 */
export function applyMapping(data, mapping) {
  return data.map(item => {
    const newItem = {};
    for (const [standardKey, originalKey] of Object.entries(mapping)) {
      newItem[standardKey] = item[originalKey] ?? "";
    }
    return newItem;
  });
}
