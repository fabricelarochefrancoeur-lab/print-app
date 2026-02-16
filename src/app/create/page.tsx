"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PrintForm from "@/components/PrintForm";

export default function CreatePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

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
        <h1 className="font-mono text-3xl">Write a PRINT</h1>
        <p className="font-pixel text-lg text-gray-500 mt-2">
          Your PRINT will be published in the midnight edition
        </p>
      </div>
      <PrintForm />
    </div>
  );
}
