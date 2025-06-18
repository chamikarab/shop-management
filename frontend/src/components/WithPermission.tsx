"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  required: string;
  children: React.ReactNode;
}

export default function WithPermission({ required, children }: Props) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (!res.ok) {
          setHasPermission(false);
          return;
        }

        const data = await res.json();
        const allowed = data?.user?.permissions?.includes(required);
        setHasPermission(!!allowed);

        if (!allowed) {
          router.push("/unauthorized"); // ✅ only redirect inside useEffect
        }
      } catch (err) {
        console.error("Permission check failed:", err);
        setHasPermission(false);
        router.push("/unauthorized");
      }
    };

    fetchUser();
  }, [required, router]);

  if (hasPermission === null) {
    return (
      <div className="text-center py-12 text-gray-500">Checking access...</div>
    );
  }

  return hasPermission ? <>{children}</> : null;
}