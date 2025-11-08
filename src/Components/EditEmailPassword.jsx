import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function EditEmailPassword({ onClose }) {
  const { user, reauthenticate, updateUserEmail, updateUserPassword } =useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdate = async () => {
    try {
      // Reauthenticate user first
      await reauthenticate(currentPassword);

      if (newEmail) await updateUserEmail(newEmail);
      if (newPassword) await updateUserPassword(newPassword);

      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-3">Edit Email / Password</h2>

      <input
        type="password"
        placeholder="Current Password"
        className="border rounded px-3 py-2 w-full mb-3"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />

      <input
        type="email"
        placeholder="New Email"
        className="border rounded px-3 py-2 w-full mb-3"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="New Password"
        className="border rounded px-3 py-2 w-full mb-3"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 rounded bg-[#C9E4C5] hover:bg-[#b8d4b2]"
        >
          Save
        </button>
      </div>
    </div>
  );
}
