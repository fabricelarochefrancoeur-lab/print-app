"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserCard from "@/components/UserCard";

export default function DiscoverPage() {
  const { status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

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

      <div className="space-y-3">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
