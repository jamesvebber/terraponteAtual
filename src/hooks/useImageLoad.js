import { useEffect, useRef } from "react";

/**
 * Adds .loaded class to lazy images after they load, enabling CSS fade-in.
 * Call once at app level or per page.
 */
export function useImageLoad() {
  useEffect(() => {
    const imgs = document.querySelectorAll("img[loading='lazy']");
    imgs.forEach((img) => {
      if (img.complete) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
      }
    });
  });
}

/**
 * Returns ref + onLoad handler for a single image fade-in.
 */
export function useSingleImageLoad() {
  const ref = useRef(null);
  const onLoad = () => {
    if (ref.current) ref.current.style.opacity = "1";
  };
  return { ref, onLoad, style: { opacity: 0, transition: "opacity 0.3s ease" } };
}