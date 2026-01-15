"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import BeerLoader from "./BeerLoader";

function NavigationLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStartTime, setNavigationStartTime] = useState(0);

  useEffect(() => {
    if (isNavigating) {
      const currentTime = Date.now();
      const elapsed = currentTime - navigationStartTime;
      const minDuration = 1500; // 1.5 seconds

      if (elapsed < minDuration) {
        const timer = setTimeout(() => {
          setIsNavigating(false);
        }, minDuration - elapsed);
        return () => clearTimeout(timer);
      } else {
        setIsNavigating(false);
      }
    }
  }, [pathname, searchParams, isNavigating, navigationStartTime]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          !anchor.href.includes("#") &&
          anchor.target !== "_blank") {
        
        const currentUrl = window.location.href.split('?')[0];
        const targetUrl = anchor.href.split('?')[0];
        
        if (currentUrl !== targetUrl) {
          setIsNavigating(true);
          setNavigationStartTime(Date.now());
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  if (!isNavigating) return null;

  return <BeerLoader />;
}

export default function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderContent />
    </Suspense>
  );
}
