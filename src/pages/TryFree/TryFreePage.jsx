import { useState } from "react";

export default function TryFreePage() {
  const [selectedDress, setSelectedDress] = useState(null);

  // Preloaded 3 demo clothes
  const demoClothes = [
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

  return (
    <div className="min-h-screen p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Try Free AR Demo</h1>
      <p className="mb-6 text-gray-600">
        No login required. Try 3 clothes for free!
      </p>

      {/* Dress Selection */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {demoClothes.map((dress) => (
          <div
            key={dress.id}
            className={`border-2 p-2 rounded-lg cursor-pointer ${
              selectedDress?.id === dress.id
                ? "border-blue-500"
                : "border-gray-300"
            }`}
            onClick={() => setSelectedDress(dress)}
          >
            <img
              src={dress.img}
              alt={dress.name}
              className="w-32 h-32 object-contain"
            />
            <p className="text-center mt-2">{dress.name}</p>
          </div>
        ))}
      </div>

      {/* AR Overlay Preview */}
      {selectedDress ? (
        <div className="w-64 h-64 border-2 border-gray-300 rounded-md flex items-center justify-center">
          {/* Replace this img with actual AR canvas overlay later */}
          <img
            src={selectedDress.img}
            alt="try-on"
            className="w-full h-full object-contain rounded-md"
          />
        </div>
      ) : (
        <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
          <span className="text-gray-400">Select a dress to try</span>
        </div>
      )}
    </div>
  );
}
