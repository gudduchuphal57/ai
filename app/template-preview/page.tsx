import {
  buildSelectedConfig,
  createAboutPageSection,
  createCategoryPageFromHref,
  createCategoryPageFromLabel,
} from "@/app/editor/layout/src/data/templateFlow";
import type { SectionItem } from "@/app/editor/layout/src/types/section";
import TemplatePreviewSite from "./TemplatePreviewSite";

type TemplatePreviewPageProps = {
  searchParams: Promise<{
    templateId?: string;
    category?: string;
  }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type MenuLink = {
  label: string;
  href: string;
};

const getMenuLinks = (value: unknown): MenuLink[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (
          !isRecord(item) ||
          typeof item.label !== "string" ||
          typeof item.href !== "string"
        ) {
          return [];
        }

        return [
          { label: item.label, href: item.href },
          ...getMenuLinks(item.children),
        ];
      })
    : [];

const isSectionItem = (section: SectionItem | null): section is SectionItem =>
  section !== null;

export default async function TemplatePreviewPage({
  searchParams,
}: TemplatePreviewPageProps) {
  const params = await searchParams;
  const templateId = params.templateId ?? "template-1";
  const category = params.category ?? "Business";
  const config = buildSelectedConfig(templateId, category);
  const aboutPage = createAboutPageSection(category);
  const headerSection = config.sections.find(
    (section) => section.type === "Header",
  );
  const headerData =
    headerSection?.data?.[headerSection.variant] ??
    headerSection?.data?.["Header-1"];
  const linkedPageSections = getMenuLinks(headerData?.menu)
    .map(
      ({ label, href }) =>
        createCategoryPageFromHref(category, href) ??
        createCategoryPageFromLabel(category, label),
    )
    .filter(isSectionItem);
  const pageSections = linkedPageSections.some(
    (section) => section.page === "about",
  )
    ? linkedPageSections
    : [aboutPage, ...linkedPageSections];
  const uniquePageSections = Array.from(
    new Map(
      pageSections.map((section) => [section.page ?? section.id, section]),
    ).values(),
  );
  const footerIndex = config.sections.findIndex(
    (section) => section.type === "Footer",
  );
  const sections =
    footerIndex === -1
      ? [...config.sections, ...uniquePageSections]
      : [
          ...config.sections.slice(0, footerIndex),
          ...uniquePageSections,
          ...config.sections.slice(footerIndex),
        ];

  return (
    <>
      <TemplatePreviewSite category={category} sections={sections} />

      <style>{`
        html {
          min-height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          scroll-behavior: auto;
          scrollbar-color: rgba(49, 95, 244, .45) transparent;
          scrollbar-width: thin;
        }

        body {
          min-height: 100%;
          margin: 0;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          background: white;
        }

        .animate-marquee {
          animation: none !important;
          transform: translateX(0) !important;
        }

        body::-webkit-scrollbar {
          width: 8px;
        }

        body::-webkit-scrollbar-track {
          background: transparent;
        }

        body::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(49, 95, 244, .45);
        }
      `}</style>
    </>
  );
}
