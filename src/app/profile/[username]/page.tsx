"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FollowButton from "@/components/FollowButton";
import PrintCard from "@/components/PrintCard";

import Image from "next/image";

function PendingPrintCard({
  print,
  onUpdate,
  onDelete,
}: {
  print: any;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(print.title);
  const [content, setContent] = useState(print.content);
  const [images, setImages] = useState<string[]>(print.images || []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/prints/${print.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, images }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(print.id, updated);
        setEditing(false);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/prints/${print.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(print.id);
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImages([...images, data.url]);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (editing) {
    return (
      <article className="border-2 border-black p-4 md:p-6 bg-white mb-4">
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-sm mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block font-mono text-sm mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full border-2 border-black px-3 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black resize-y"
            />
          </div>

          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((url: string, i: number) => (
                <div key={i} className="relative w-20 h-20 border border-black group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className={`font-pixel text-sm border border-dashed border-black px-3 py-1 cursor-pointer hover:bg-gray-50 inline-block ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? "Uploading..." : "+ Add image"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <div className="flex gap-2 pt-2 border-t border-dashed border-gray-300">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="font-pixel text-lg border-2 border-black px-4 py-1 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setTitle(print.title);
                setContent(print.content);
                setImages(print.images || []);
                setEditing(false);
              }}
              className="font-pixel text-lg border-2 border-black px-4 py-1 hover:bg-gray-100 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="border-2 border-dashed border-black bg-gray-50 mb-4">
      <div className="flex items-center justify-between p-4 md:p-6 pb-0 mb-2">
        <span className="font-pixel text-xs text-gray-400 border border-gray-300 px-2 py-0.5">
          PENDING
        </span>
        <span className="font-pixel text-xs text-gray-400">
          Created {new Date(print.createdAt).toLocaleDateString("en-GB")}
        </span>
      </div>

      <h3 className="font-mono text-3xl md:text-4xl font-bold leading-none tracking-tight px-4 md:px-6 mb-3">{print.title}</h3>

      {print.images && print.images.length > 0 && (
        <div>
          {print.images.map((url: string, i: number) => (
            <div key={i} className="relative w-full border-t border-b border-black">
              <Image src={url} alt={`Image ${i + 1}`} width={1200} height={800} className="w-full h-auto" />
            </div>
          ))}
        </div>
      )}

      <div className="font-pixel text-lg leading-relaxed whitespace-pre-wrap px-4 md:px-6 pt-3 pb-0 text-gray-700">
        {print.content}
      </div>

      <div className="flex gap-2 pt-3 mx-4 md:mx-6 mb-4 border-t border-dashed border-gray-300">
        <button
          onClick={() => setEditing(true)}
          className="font-pixel text-lg border-2 border-black px-4 py-1 hover:bg-black hover:text-white transition-colors"
        >
          Edit
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="font-pixel text-sm text-red-600">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="font-pixel text-lg border-2 border-red-600 text-red-600 px-4 py-1 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
            >
              {deleting ? "..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-pixel text-lg border-2 border-black px-4 py-1 hover:bg-gray-100 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="font-pixel text-lg border-2 border-red-600 text-red-600 px-4 py-1 hover:bg-red-600 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<any>(null);
  const [publishedPrints, setPublishedPrints] = useState<any[]>([]);
  const [pendingPrints, setPendingPrints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch(`/api/users/${username}`)
        .then((r) => r.json())
        .then((profileData) => {
          setProfile(profileData);
          if (profileData.id) {
            // Fetch published prints
            fetch(`/api/prints?userId=${profileData.id}&status=PUBLISHED`)
              .then((r) => r.json())
              .then((data) => setPublishedPrints(Array.isArray(data) ? data : []));

            // Fetch pending prints only for own profile
            if (profileData.isOwnProfile) {
              fetch(`/api/prints?userId=${profileData.id}&status=PENDING`)
                .then((r) => r.json())
                .then((data) => setPendingPrints(Array.isArray(data) ? data : []));
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router, username]);

  const handlePendingUpdate = (id: string, updated: any) => {
    setPendingPrints((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
  };

  const handlePendingDelete = (id: string) => {
    setPendingPrints((prev) => prev.filter((p) => p.id !== id));
  };

  if (status !== "authenticated" || loading) {
    return (
      <div className="text-center py-20 font-pixel text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  if (!profile || profile.error) {
    return (
      <div className="text-center py-20 font-pixel text-xl text-gray-500">
        User not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="border-2 border-black p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 border-2 border-black flex items-center justify-center bg-gray-100 font-mono text-3xl flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="font-mono text-2xl">
                  {profile.displayName || profile.username}
                </h1>
                <p className="font-pixel text-lg text-gray-500">
                  @{profile.username}
                </p>
              </div>
              {!profile.isOwnProfile && (
                <FollowButton
                  userId={profile.id}
                  initialFollowing={profile.isFollowing}
                />
              )}
            </div>

            {profile.bio && (
              <p className="font-pixel text-lg mt-3">{profile.bio}</p>
            )}

            <div className="flex gap-6 mt-4 font-pixel text-sm text-gray-500">
              <span>
                <strong className="text-black">{profile._count.prints}</strong>{" "}
                prints
              </span>
              <span>
                <strong className="text-black">
                  {profile._count.followers}
                </strong>{" "}
                followers
              </span>
              <span>
                <strong className="text-black">
                  {profile._count.following}
                </strong>{" "}
                following
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending PRINTs - own profile only */}
      {profile.isOwnProfile && pendingPrints.length > 0 && (
        <div className="mb-8">
          <h2 className="font-mono text-xl mb-4 border-b-2 border-dashed border-black pb-2">
            Pending PRINTs
            <span className="font-pixel text-sm text-gray-500 ml-3">
              Will be published at midnight
            </span>
          </h2>
          <div>
            {pendingPrints.map((print: any) => (
              <PendingPrintCard
                key={print.id}
                print={print}
                onUpdate={handlePendingUpdate}
                onDelete={handlePendingDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Published PRINTs */}
      {profile.isOwnProfile ? (
        <div>
          <h2 className="font-mono text-xl mb-4 border-b border-black pb-2">
            Published PRINTs
          </h2>
          {publishedPrints.length === 0 ? (
            <p className="font-pixel text-lg text-gray-500">
              No published PRINTs yet.
            </p>
          ) : (
            <div className="space-y-4">
              {publishedPrints.map((print: any) => (
                <article key={print.id} className="border-2 border-black bg-white">
                  <div className="p-4 md:p-6 pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-pixel text-xs text-gray-400">
                        @{print.author.username}
                      </span>
                      <span className="font-pixel text-xs text-gray-400">
                        Published {print.publishedAt
                          ? new Date(print.publishedAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : new Date(print.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                      </span>
                    </div>
                    <h3 className="font-mono text-3xl md:text-4xl font-bold mb-3 leading-none tracking-tight">
                      {print.title}
                    </h3>
                  </div>
                  {print.images && print.images.length > 0 && (
                    <div>
                      {print.images.map((url: string, i: number) => (
                        <div key={i} className="relative w-full border-t border-b border-black">
                          <Image src={url} alt={`Image ${i + 1}`} width={1200} height={800} className="w-full h-auto" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-4 md:p-6 pt-3">
                    <div className="font-pixel text-lg leading-relaxed whitespace-pre-wrap">
                      {print.content}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        publishedPrints.length > 0 && (
          <div>
            <h2 className="font-mono text-xl mb-4 border-b border-black pb-2">
              Latest published PRINTs
            </h2>
            <div className="space-y-4">
              {publishedPrints.slice(0, 3).map((print: any) => (
                <PrintCard key={print.id} print={print} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
