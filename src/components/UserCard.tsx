import Link from "next/link";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="block border-2 border-black p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 border-2 border-black flex items-center justify-center bg-gray-100 font-mono text-lg flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            user.username[0].toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-lg truncate">
            {user.displayName || user.username}
          </p>
          <p className="font-pixel text-sm text-gray-500">@{user.username}</p>
          {user.bio && (
            <p className="font-pixel text-sm text-gray-600 mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
