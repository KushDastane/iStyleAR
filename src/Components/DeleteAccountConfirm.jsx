import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { FaGoogle, FaExclamationTriangle } from "react-icons/fa";

function DeleteAccountConfirm({ onConfirm, onCancel }) {
  const [textMatch, setTextMatch] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleVerify = (token) => {
    if (token) setCaptchaVerified(true);
  };

  const isEnabled = textMatch && captchaVerified;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
          <FaExclamationTriangle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Confirm Account Deletion</h2>
        </div>

        {/* Warning text */}
        <p className="text-gray-700 mb-4 text-center leading-relaxed">
          This will permanently delete your account and all associated data.
          Please type <strong>DELETE</strong> below and complete the
          verification.
        </p>

        {/* Type DELETE */}
        <input
          type="text"
          placeholder="Type DELETE"
          className="border px-3 py-2 rounded w-full mb-3"
          onChange={(e) => setTextMatch(e.target.value === "DELETE")}
        />

        {/* Google verification message */}
        <div className="bg-gray-100 rounded-xl px-3 py-2 text-gray-700 text-sm mb-3 flex items-center gap-3">
          <FaGoogle className="text-blue-600 w-5 h-5" />
          <span>
            After this step, Google will ask you to verify your identity for
            security.
          </span>
        </div>

        {/* CAPTCHA */}
        <div className="flex justify-center mb-3">
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={handleVerify}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            disabled={!isEnabled}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white ${
              isEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountConfirm;
