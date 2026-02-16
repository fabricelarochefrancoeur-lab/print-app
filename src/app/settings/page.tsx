"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const username = (session?.user as any)?.username;
      if (username) {
        fetch(`/api/users/${username}`)
          .then((r) => r.json())
          .then((data) => {
            setDisplayName(data.displayName || "");
            setBio(data.bio || "");
            setAvatarUrl(data.avatarUrl || "");
            setProfileLoading(false);
          })
          .catch(() => setProfileLoading(false));
      }
    }
  }, [status, router, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) setAvatarUrl(data.url);
    } catch {
      alert("Failed to upload image");
    }
  };

  if (status !== "authenticated" || profileLoading) {
    return (
      <div className="text-center py-20 font-pixel text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="font-mono text-3xl">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <div className="w-24 h-24 border-2 border-black mx-auto flex items-center justify-center bg-gray-100 font-mono text-3xl mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              ((session?.user as any)?.username || "?")[0].toUpperCase()
            )}
          </div>
          <label className="font-pixel text-sm cursor-pointer underline">
            Change avatar
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block font-mono text-sm mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block font-mono text-sm mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black resize-y"
            placeholder="Tell us about yourself..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-lg border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </form>
    </div>
  );
}
