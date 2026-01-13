"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ConfigurationPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to phone settings by default
    router.replace("/configuration/phone");
  }, [router]);

  return null;
}
