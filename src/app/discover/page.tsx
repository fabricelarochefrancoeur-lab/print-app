"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import UserCard from "@/components/UserCard";

export default function DiscoverPage() {
  const { status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/users/suggestions");
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuggestions();
    }
  }, [status, fetchSuggestions]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {}
  };

  if (status !== "authenticated") {
    return (
      <div className="text-center py-20 font-pixel text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="font-mono text-3xl">Discover</h1>
        <p className="font-pixel text-lg text-gray-500 mt-2">
          Find authors to follow
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username..."
          className="flex-1 border-2 border-black px-4 py-2 font-pixel text-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          disabled={loading}
          className="font-mono border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-colors"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {loading && (
        <div className="text-center font-pixel text-lg animate-pulse">
          Searching...
        </div>
      )}

      {!loading && searched && users.length === 0 && (
        <div className="text-center font-pixel text-lg text-gray-500">
          No users found.
        </div>
      )}

      {searched && (
        <div className="space-y-3 mb-10">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* Random authors suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t-2 border-black pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-pixel text-lg uppercase">
              Random authors you can follow
            </h2>
            <button
              onClick={fetchSuggestions}
              className="font-pixel text-sm text-gray-500 hover:text-black transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {suggestions.map((user) => (
              <div
                key={user.id}
                className="border-2 border-black p-4 flex items-center gap-3"
              >
                <a
                  href={`/profile/${user.username}`}
                  className="w-12 h-12 border-2 border-black flex items-center justify-center bg-gray-100 font-mono text-lg flex-shrink-0"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </a>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/profile/${user.username}`}
                    className="font-mono text-lg truncate block hover:underline"
                  >
                    {user.displayName || user.username}
                  </a>
                  <p className="font-pixel text-sm text-gray-500">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="font-pixel text-sm text-gray-600 mt-1 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleFollow(user.id)}
                  className="font-pixel text-sm border-2 border-black px-4 py-1.5 hover:bg-black hover:text-white transition-colors flex-shrink-0"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestionsLoading && !suggestions.length && (
        <div className="border-t-2 border-black pt-6">
          <div className="text-center font-pixel text-lg animate-pulse text-gray-500">
            Loading suggestions...
          </div>
        </div>
      )}

      {!suggestionsLoading && suggestions.length === 0 && (
        <div className="border-t-2 border-black pt-6">
          <p className="text-center font-pixel text-lg text-gray-500">
            You&apos;re following everyone on PRINT!
          </p>
        </div>
      )}
    </div>
  );
}
