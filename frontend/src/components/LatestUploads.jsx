import React from "react";

export default function LatestUploads({ images, onViewMatches }) {
  if (!images || images.length === 0) {
    return (
      <p className="text-gray-500 col-span-3 text-center">
        No uploads yet.
      </p>
    );
  }

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
    console.log("Image load failed, using placeholder:", e.target.alt);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((img, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-gray-200 shadow-sm"
        >
          <img
            src={img.image_url || "https://via.placeholder.com/300?text=Image+Not+Available"}
            alt={img.img_alt || "Uploaded image"}
            className="w-full h-64 object-contain hover:scale-105 transition-transform cursor-pointer"
            onError={handleImageError}
            onClick={() => window.open(img.image_url, "_blank")}
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            {img.img_alt || "Uploaded"} •{" "}
            {new Date(img.created_at).toLocaleDateString()}
          </p>
          <button
            onClick={() => onViewMatches(img.id)}
            className="w-full mt-2 bg-emerald-600 text-white px-4 py-1 text-sm rounded-lg hover:bg-emerald-700 transition"
          >
            View Matches
          </button>
        </div>
      ))}
    </div>
  );
}