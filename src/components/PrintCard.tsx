import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";

interface PrintCardProps {
  print: {
    id: string;
    title: string;
    content: string;
    images: string[];
    createdAt: string;
    author: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
}

export default function PrintCard({ print }: PrintCardProps) {
  return (
    <article className="border-2 border-black bg-white break-inside-avoid mb-6">
      <div className="p-4 md:p-6 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href={`/profile/${print.author.username}`}
            className="font-pixel text-sm hover:underline"
          >
            @{print.author.username}
          </Link>
          <span className="text-gray-400 font-pixel text-xs">
            {print.author.displayName}
          </span>
        </div>

        <h2 className="font-mono text-3xl md:text-4xl font-bold mb-3 leading-none tracking-tight uppercase">
          {print.title}
        </h2>
      </div>

      {print.images && print.images.length > 0 && (
        <div className="space-y-0">
          {print.images.map((url: string, i: number) => (
            <div key={i} className="relative w-full border-t border-b border-black">
              <Image
                src={url}
                alt={`Image ${i + 1}`}
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      )}

      <div className="p-4 md:p-6 pt-3">
        <div className="font-pixel text-lg leading-relaxed whitespace-pre-wrap mb-4">
          {print.content}
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-gray-300 pt-2">
          <LikeButton printId={print.id} />
          <span className="font-pixel text-xs text-gray-400">
            {new Date(print.createdAt).toLocaleDateString("en-GB")}
          </span>
        </div>
      </div>
    </article>
  );
}
