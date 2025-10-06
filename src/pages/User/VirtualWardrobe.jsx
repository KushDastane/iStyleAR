import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function VirtualWardrobe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wardrobe, setWardrobe] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Preloaded catalog clothes in Cloudinary
  const catalog = [
    {
      id: 1,
      name: "Red Shirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683904/red_zbtczb.png",
    },
    {
      id: 2,
      name: "Blue Jacket",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683919/blue_kbphud.png",
    },
    {
      id: 3,
      name: "Green Hoodie",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683905/green_sfbxnt.png",
    },
  ];

  useEffect(() => {
    if (!user) return;
    fetchWardrobe();
  }, [user]);

  // Fetch user's wardrobe
  const fetchWardrobe = async () => {
    const clothesSnap = await getDocs(
      collection(db, "users", user.uid, "wardrobe")
    );
    const clothesData = clothesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setWardrobe(clothesData);
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  // Add cloth (catalog or uploaded)
  const handleAddCloth = async (cloth) => {
    if (!user) return toast.error("Login first!");
    setUploading(true);

    try {
      let imageUrl = cloth.img;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", "wardrobe");
        formData.append("folder", `wardrobe/${user.uid}`);

        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dyiaqidiq/image/upload",
          formData
        );
        imageUrl = res.data.secure_url;
      }

      await addDoc(collection(db, "users", user.uid, "wardrobe"), {
        name: cloth.name,
        imageUrl,
        addedAt: serverTimestamp(),
        source: selectedFile ? "userUpload" : "catalog",
      });

      toast.success("Cloth added to your wardrobe!");
      setSelectedFile(null);
      fetchWardrobe();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add cloth.");
    }
    setUploading(false);
  };

  // Delete cloth
  const handleDeleteCloth = async (clothId) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "wardrobe", clothId));
      toast.success("Cloth deleted!");
      fetchWardrobe();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete cloth.");
    }
  };

  // Edit cloth name
  const handleEditCloth = async (clothId) => {
    const newName = prompt("Enter new name for this cloth:");
    if (!newName) return;

    try {
      await updateDoc(doc(db, "users", user.uid, "wardrobe", clothId), {
        name: newName,
      });
      toast.success("Cloth name updated!");
      fetchWardrobe();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update name.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center">Virtual Wardrobe</h1>

      {/* Catalog section */}
      <h2 className="text-xl font-semibold mb-2">Add from Catalog</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {catalog.map((cloth) => (
          <div
            key={cloth.id}
            className="border p-2 rounded-lg flex flex-col items-center cursor-pointer hover:border-blue-500"
          >
            <img
              src={cloth.img}
              alt={cloth.name}
              className="w-32 h-32 object-contain"
            />
            <p className="mt-2">{cloth.name}</p>
            <button
              onClick={() => handleAddCloth(cloth)}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
              disabled={uploading}
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* Upload your own cloth */}
      <h2 className="text-xl font-semibold mb-2">Upload Your Cloth</h2>
      <div className="mb-6 flex items-center space-x-2">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <input
          type="text"
          placeholder="Name your cloth"
          className="border p-1 rounded"
          id="userClothName"
        />
        <button
          onClick={() => {
            const nameInput =
              document.getElementById("userClothName").value || "My Cloth";
            handleAddCloth({ name: nameInput, img: null });
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
          disabled={uploading || !selectedFile}
        >
          Upload
        </button>
      </div>

      {/* Wardrobe display */}
      <h2 className="text-xl font-semibold mb-2">Your Wardrobe</h2>
      {wardrobe.length === 0 ? (
        <p className="text-gray-500">No clothes added yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {wardrobe.map((cloth) => (
            <div
              key={cloth.id}
              className="border p-2 rounded-lg flex flex-col items-center"
            >
              <img
                src={cloth.imageUrl}
                alt={cloth.name}
                className="w-32 h-32 object-contain"
              />
              <p className="mt-2">{cloth.name}</p>

              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => handleEditCloth(cloth.id)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCloth(cloth.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    navigate(`/user/try-on`, { state: { cloth } })
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Try On
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
