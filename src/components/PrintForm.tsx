"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";

export default function PrintForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/prints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, images }),
      });

      if (!res.ok) throw new Error("Failed to create print");

      setSuccess(true);
      setTitle("");
      setContent("");
      setImages([]);
    } catch (error) {
      console.error("Create print error:", error);
      alert("Failed to create PRINT");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <h2 className="font-mono text-2xl mb-4">PRINT sent!</h2>
        <p className="font-pixel text-lg text-gray-600 mb-6">
          Your PRINT will be published in the next midnight edition.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="font-pixel text-lg border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Write another PRINT
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-mono text-lg mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your PRINT title"
          className="w-full border-2 border-black px-4 py-3 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
          required
        />
      </div>

      <div>
        <label className="block font-mono text-lg mb-2">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your PRINT..."
          rows={8}
          className="w-full border-2 border-black px-4 py-3 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black resize-y"
          required
        />
      </div>

      <ImageUpload
        images={images}
        onUpload={(url) => setImages([...images, url])}
      />

      <button
        type="submit"
        disabled={loading || !title.trim() || !content.trim()}
        className={`w-full font-mono text-xl border-2 border-black px-6 py-3 transition-colors ${
          loading
            ? "opacity-50"
            : "hover:bg-black hover:text-white"
        }`}
      >
        {loading ? "Sending..." : "PUBLISH MY PRINT"}
      </button>

      <p className="font-pixel text-sm text-gray-500 text-center">
        Your PRINT will appear in tomorrow&apos;s midnight edition.
      </p>
    </form>
  );
}
