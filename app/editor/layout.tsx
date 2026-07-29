"use client";

import { PreviewProvider } from "./layout/src/components/context/PreviewContext";
import { generalSansMedium } from "@/app/fonts";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreviewProvider>
      <div className={generalSansMedium.className}>{children}</div>
    </PreviewProvider>
  );
}
