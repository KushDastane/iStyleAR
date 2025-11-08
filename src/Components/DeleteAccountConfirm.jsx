import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

function DeleteAccountConfirm({ onConfirm, onCancel }) {
  const [textMatch, setTextMatch] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleVerify = (token) => {
    if (token) setCaptchaVerified(true);
  };

  const isEnabled = textMatch && captchaVerified;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-red-600 mb-4 text-center">
          Confirm Account Deletion
        </h2>
        <p className="text-gray-700 mb-4 text-center">
          This will permanently delete your account and all associated data.
          <br />
          Type <strong>DELETE</strong> below to confirm and complete the
          reCAPTCHA.
        </p>

        <input
          type="text"
          placeholder="Type DELETE"
          className="border px-3 py-2 rounded w-full mb-3"
          onChange={(e) => setTextMatch(e.target.value === "DELETE")}
        />

        <div className="flex justify-center mb-3">
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={handleVerify}
          />
        </div>

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
