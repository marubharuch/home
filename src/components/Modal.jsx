// src/components/Modal.jsx
import React from "react";

export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded shadow-lg w-80">
        <div className="flex justify-between items-center mb-3">
          123
          <h2 className="text-lg font-bold">{title}</h2>
          {/* Small close icon (optional) */}
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✖
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
