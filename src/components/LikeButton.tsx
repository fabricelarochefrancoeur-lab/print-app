"use client";

import { useState, useEffect } from "react";

interface Liker {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function LikeButton({ printId }: { printId: string }) {
  const [liked, setLiked] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [showLikers, setShowLikers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prints/${printId}/like`)
      .then((r) => r.json())
      .then((data) => {
        setLiked(data.liked);
        setIsAuthor(data.isAuthor || false);
        if (data.isAuthor) {
          setLikeCount(data.likeCount || 0);
          setLikers(data.likers || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [printId]);

  const toggleLike = async () => {
    const res = await fetch(`/api/prints/${printId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      // Refetch stats if author
      if (isAuthor) {
        const statsRes = await fetch(`/api/prints/${printId}/like`);
        const stats = await statsRes.json();
        setLikeCount(stats.likeCount || 0);
        setLikers(stats.likers || []);
      }
    }
  };

  if (loading) {
    return <div className="h-8" />;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleLike}
        className={`font-pixel text-sm border-2 px-3 py-1 transition-colors ${
          liked
            ? "border-black bg-black text-white"
            : "border-black hover:bg-black hover:text-white"
        }`}
      >
        {liked ? "LIKED" : "LIKE"}
      </button>

      {isAuthor && likeCount > 0 && (
        <button
          onClick={() => setShowLikers(!showLikers)}
          className="font-pixel text-xs text-gray-500 underline hover:text-black transition-colors"
        >
          {likeCount} like{likeCount !== 1 ? "s" : ""}
        </button>
      )}

      {showLikers && likers.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowLikers(false)}
        >
          <div
            className="bg-white border-2 border-black p-4 max-w-sm w-full mx-4 max-h-80 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-sm">
                {likeCount} like{likeCount !== 1 ? "s" : ""}
              </h3>
              <button
                onClick={() => setShowLikers(false)}
                className="font-mono text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {likers.map((liker) => (
                <a
                  key={liker.username}
                  href={`/profile/${liker.username}`}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1 transition-colors"
                >
                  <div className="w-8 h-8 border border-black flex items-center justify-center bg-gray-100 font-mono text-sm flex-shrink-0">
                    {liker.avatarUrl ? (
                      <img
                        src={liker.avatarUrl}
                        alt={liker.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      liker.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-pixel text-sm">
                      {liker.displayName || liker.username}
                    </p>
                    <p className="font-pixel text-xs text-gray-500">
                      @{liker.username}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
