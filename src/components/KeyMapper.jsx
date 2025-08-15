// src/components/JsonKeyMapper.jsx
import React, { useState, useEffect } from "react";
import localforage from "localforage";

export default function JsonKeyMapper({ sourceName, jsonData, onMappingDone }) {
  const standardKeys = ["name", "theme", "price"];
  const [availableKeys, setAvailableKeys] = useState([]);
  const [mapping, setMapping] = useState({});
  const [themeName, setThemeName] = useState("");
  const [showExample, setShowExample] = useState(false);

  // Load existing mapping from localforage
  useEffect(() => {
    localforage.getItem(`mapping_${sourceName}`).then((saved) => {
      if (saved) {
        setMapping(saved.mapping || {});
        setThemeName(saved.themeName || "");
        setAvailableKeys(Object.keys(jsonData[0] || {}));
        setShowExample(true);
      } else {
        setAvailableKeys(Object.keys(jsonData[0] || {}));
      }
    });
  }, [sourceName, jsonData]);

  const handleMap = (standardKey, availKey) => {
    setMapping((prev) => ({ ...prev, [standardKey]: availKey }));
    setAvailableKeys((prev) => prev.filter((k) => k !== availKey));
  };

  const handleUnmap = (standardKey) => {
    const removedKey = mapping[standardKey];
    setAvailableKeys((prev) => [...prev, removedKey]);
    setMapping((prev) => {
      const updated = { ...prev };
      delete updated[standardKey];
      return updated;
    });
  };

  const handleSave = () => {
    const mappedData = jsonData.map((item) => {
      let newObj = { source: sourceName };
      standardKeys.forEach((sk) => {
        if (mapping[sk]) {
          newObj[sk] = item[mapping[sk]];
        }
      });
      if (themeName.trim()) newObj.theme = themeName;
      return newObj;
    });

    localforage.setItem(`mapping_${sourceName}`, { mapping, themeName }).then(() => {
      onMappingDone(mappedData);
    });
  };

  const filteredThemeSuggestions = availableKeys.filter(
    (key) => !/dlp|rate|price/i.test(key)
  );

  const exampleRow = mapping.name
    ? {
        name: jsonData[0]?.[mapping.name],
        theme: themeName || jsonData[0]?.[mapping.theme],
        price: jsonData[0]?.[mapping.price],
      }
    : null;

  if (showExample && exampleRow) {
    return (
      <div className="p-4 border rounded">
        <h2 className="text-lg font-bold mb-2">Example Mapped Data</h2>
        <pre>{JSON.stringify(exampleRow, null, 2)}</pre>
        <button
          className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
          onClick={() => setShowExample(false)}
        >
          Remap
        </button>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={handleSave}
        >
          Confirm Mapping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded grid grid-cols-2 gap-4">
      {/* Left: Standard Keys */}
      <div>
        <h2 className="font-bold mb-2">Standard Keys</h2>
        {standardKeys.map((sk) => (
          <div key={sk} className="mb-2 flex items-center gap-2">
            <span className="w-20 font-medium">{sk}</span>
            {mapping[sk] ? (
              <>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => handleUnmap(sk)}
                >
                  {mapping[sk]}
                </button>
              </>
            ) : (
              <span className="text-gray-400">Not Mapped</span>
            )}
          </div>
        ))}

        {/* Theme Name Input */}
        <div className="mt-4">
          <label className="block mb-1 font-medium">Theme Name</label>
          <input
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="Enter theme"
            className="border p-1 w-full rounded"
          />
          <small className="text-gray-500">You can type your own</small>
        </div>
      </div>

      {/* Right: Available Keys */}
      <div>
        <h2 className="font-bold mb-2">Available Keys</h2>
        <div className="flex flex-wrap gap-2">
          {availableKeys.map((key) => (
            <button
              key={key}
              className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              onClick={() => {
                const sk = prompt(`Map "${key}" to which standard key? (name/theme/price)`);
                if (standardKeys.includes(sk)) handleMap(sk, key);
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-2 mt-4">
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={() => setShowExample(true)}
        >
          Preview Example
        </button>
      </div>
    </div>
  );
}
