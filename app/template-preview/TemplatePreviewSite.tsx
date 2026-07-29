"use client";

import { useMemo } from "react";

import {
  PreviewProvider,
  usePreview,
} from "@/app/editor/layout/src/components/context/PreviewContext";
import {
  getPageVariantForSlug,
  sectionMatchesPageRoute,
} from "@/app/editor/layout/src/lib/pageVariantRouting";
import { getSectionComponent } from "@/app/editor/layout/src/lib/sectionRegistry";
import type {
  SectionData,
  SectionItem,
} from "@/app/editor/layout/src/types/section";
import PreviewScrollBridge from "./PreviewScrollBridge";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createPageSlug = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, "-");

function TemplatePreviewContent({
  category,
  sections,
}: {
  category: string;
  sections: SectionItem[];
}) {
  const { currentPage } = usePreview();
  const currentPageSlug = createPageSlug(currentPage || "Home");
  const visibleSections = useMemo(() => {
    const pageShellSectionTypes = ["Topbar", "Header", "Footer"];

    return currentPageSlug && currentPageSlug !== "home"
      ? sections.filter(
          (section) =>
            pageShellSectionTypes.includes(section.type) ||
            sectionMatchesPageRoute(section, currentPageSlug),
        )
      : sections.filter((section) => !section.page);
  }, [currentPageSlug, sections]);

  return (
    <main
      data-template-navigation
      className="min-h-screen w-full overflow-x-hidden bg-white"
    >
      <PreviewScrollBridge />

      {visibleSections.map((section) => {
        const activeVariant =
          getPageVariantForSlug(section, currentPageSlug) ?? section.variant;
        const Component = getSectionComponent(
          category,
          section.type,
          activeVariant,
        );
        const defaultVariant = `${section.type}-1`;
        const variantData =
          section.data?.[activeVariant] ?? section.data?.[defaultVariant];
        const sectionData = (
          isRecord(variantData) ? variantData : section.data
        ) as SectionData;

        if (!Component) return null;

        return (
          <Component
            key={`${section.type}-${activeVariant}`}
            data={sectionData}
          />
        );
      })}
    </main>
  );
}

export default function TemplatePreviewSite({
  category,
  sections,
}: {
  category: string;
  sections: SectionItem[];
}) {
  return (
    <PreviewProvider>
      <TemplatePreviewContent category={category} sections={sections} />
    </PreviewProvider>
  );
}
