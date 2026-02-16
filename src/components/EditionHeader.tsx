import Image from "next/image";

interface EditionHeaderProps {
  date: string;
  printCount?: number;
}

export default function EditionHeader({ date, printCount }: EditionHeaderProps) {
  const d = new Date(date);
  const formatted = d.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="text-center border-b-4 border-double border-black pb-4 mb-8">
      <div className="flex justify-center mb-2">
        <Image src="/logo.png" alt="Print" width={240} height={80} className="h-16 md:h-20 w-auto" />
      </div>
      <div className="flex items-center justify-center gap-4 font-serif text-lg">
        <span className="border-t border-black flex-1 max-w-[100px]" />
        <span className="uppercase">{formatted}</span>
        <span className="border-t border-black flex-1 max-w-[100px]" />
      </div>
      {printCount !== undefined && (
        <p className="font-serif text-sm text-gray-500 mt-2">
          {printCount} print{printCount !== 1 ? "s" : ""} in this edition
        </p>
      )}
    </div>
  );
}
