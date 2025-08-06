// src/components/Modal.jsx
import React from "react";

export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded shadow-lg w-80">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <div>{children}</div>
        <div className="flex justify-end mt-3">
          <button
            className="px-4 py-1 bg-red-500 text-white rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
