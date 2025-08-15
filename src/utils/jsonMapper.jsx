// src/utils/jsonMapper.js
import localforage from "localforage";

// Detect theme keys
function isThemeKey(key) {
  return /(dlp|rate|price)/i.test(key);
}

export async function mapAndSaveJson(fileName, jsonData, userMappings, themeNames) {
  const mappedData = jsonData.map((item) => {
    const newItem = { source: fileName };

    // Map normal keys
    Object.entries(userMappings).forEach(([fileKey, stdKey]) => {
      if (stdKey && item[fileKey] !== undefined) {
        newItem[stdKey] = item[fileKey];
      }
    });

    // Map themes
    const themes = [];
    Object.entries(item).forEach(([key, value]) => {
      if (isThemeKey(key)) {
        const patterns = key
          .replace(/dlp|rate|price/gi, "")
          .split("/")
          .map((p) => p.trim())
          .filter(Boolean);

        patterns.forEach((pattern) => {
          themes.push({
            theme: themeNames[key] || key,
            pattern,
            price: parseFloat(value) || value
          });
        });
      }
    });

    newItem.themes = themes;
    return newItem;
  });

  // Save to localForage
  await localforage.setItem(`mappedData:${fileName}`, mappedData);

  // Return preview
  return mappedData.slice(0, 3); // first 3 for preview
}
