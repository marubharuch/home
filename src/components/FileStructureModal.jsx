import React from "react";

export default function FileStructureModal({ fileName, fileStructure, onConfirm, onSkip }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content p-4 bg-white rounded shadow-lg max-w-lg mx-auto mt-20">
        <h2 className="text-xl font-bold mb-4">Structure of {fileName}</h2>
        <pre className="overflow-auto max-h-64 mb-4 bg-gray-100 p-2 rounded">
          {JSON.stringify(fileStructure, null, 2)}
        </pre>
        <div className="flex justify-end gap-4">
          <button onClick={onSkip} className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-200">
            Skip
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
