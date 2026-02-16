"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
}

export default function FollowButton({
  userId,
  initialFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      setFollowing(data.following);
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`font-pixel text-lg px-4 py-2 border-2 border-black transition-colors ${
        following
          ? "bg-black text-white hover:bg-white hover:text-black"
          : "bg-white text-black hover:bg-black hover:text-white"
      } ${loading ? "opacity-50" : ""}`}
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
