// src/components/MobilePopup.jsx
import { useState } from "react";
import Modal from "./Modal";

export default function MobilePopup({ onConfirm, onClose }) {
  const [tempMobile, setTempMobile] = useState("");
  const [mobileError, setMobileError] = useState("");

  return (
    <Modal title="Enter Mobile" onClose={onClose}>
      <input
        type="text"
        value={tempMobile}
        onChange={(e) => {
          console.log("Mobile input changed:", e.target.value);
          const val = e.target.value.replace(/\D/g, "");
          if (val.length <= 10) setTempMobile(val);
          if (val.length > 0 && val.length !== 10)
            setMobileError("Mobile number must be exactly 10 digits");
          else setMobileError("");
        }}
        placeholder="10-digit number"
        className="border px-2 py-1 rounded w-full mb-1"
      />
      {mobileError && (
        <div className="text-red-500 text-sm mb-3">{mobileError}</div>
      )}
      <div className="flex justify-end">
        <button
          disabled={!/^\d{10}$/.test(tempMobile)}
          className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-80"
          onClick={() => {
            console.log("Mobile confirmed:", tempMobile);
            onConfirm(tempMobile);
          }}
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
