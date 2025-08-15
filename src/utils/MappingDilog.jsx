// MappingDialog.jsx
import React, { useState } from "react";

export default function MappingDialog({ sampleItem, fileName, onSubmit, onCancel, prefilled = {} }) {
  const standardKeys = ["name", "code", "pkg", "master", "theme"];
  const availableKeys = Object.keys(sampleItem);

  const [mapping, setMapping] = useState(() => {
    const initial = {};
    standardKeys.forEach(k => {
      initial[k] = prefilled[k] || "";
    });
    return initial;
  });

  const handleChange = (stdKey, value) => {
    setMapping(prev => ({ ...prev, [stdKey]: value }));
  };

  const handleSubmit = () => {
    // Validate theme field
    if (/dlp|rate|price/i.test(mapping.theme)) {
      alert("Theme field cannot be a price/rate field");
      return;
    }
    onSubmit(mapping);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">Mapping keys for: {fileName}</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {standardKeys.map(stdKey => (
            <div key={stdKey} className="flex flex-col">
              <label className="text-sm font-medium">{stdKey}</label>
              <select
                value={mapping[stdKey]}
                onChange={e => handleChange(stdKey, e.target.value)}
                className="border rounded p-1"
              >
                <option value="">-- Skip --</option>
                {availableKeys.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <button onClick={onCancel} className="px-4 py-1 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-1 bg-blue-500 text-white rounded">OK</button>
        </div>
      </div>
    </div>
  );
}
