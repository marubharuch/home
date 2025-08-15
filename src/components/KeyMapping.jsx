// src/components/KeyMapping.jsx
import React, { useState } from "react";
import { saveMapping, applyMapping } from "../utils/keyMappingUtils";

export default function KeyMapping({ fileName, availableKeys, standardKeys, onMappingComplete }) {
  const [mapping, setMapping] = useState({});
  const [theme, setTheme] = useState("");

  const handleMap = (standardKey, originalKey) => {
    setMapping(prev => ({ ...prev, [standardKey]: originalKey }));
  };

  const handleSave = async () => {
    if (!theme.trim()) {
      alert("Please enter theme name");
      return;
    }
    await saveMapping(fileName, { ...mapping, _theme: theme });
    onMappingComplete(mapping, theme);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">Map Keys for {fileName}</h2>
      <input
        type="text"
        placeholder="Enter Theme Name"
        value={theme}
        onChange={e => setTheme(e.target.value)}
        className="border px-2 py-1 mb-4 w-full"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Standard Keys</h3>
          {standardKeys.map(stdKey => (
            <div key={stdKey} className="mb-2 flex items-center">
              <span className="w-32">{stdKey}</span>
              <select
                className="border px-2 py-1"
                value={mapping[stdKey] || ""}
                onChange={e => handleMap(stdKey, e.target.value)}
              >
                <option value="">-- Select --</option>
                {availableKeys.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Available Keys</h3>
          <div className="flex flex-wrap gap-2">
            {availableKeys.map(k => (
              <span
                key={k}
                className="bg-gray-200 px-3 py-1 rounded cursor-pointer"
                onClick={() => alert(`Select this from dropdown: ${k}`)}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Save Mapping
      </button>
    </div>
  );
}
