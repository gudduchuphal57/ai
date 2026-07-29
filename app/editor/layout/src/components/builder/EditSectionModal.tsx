"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Menu, Plus, Trash, X } from "lucide-react";
import { agrandirBolt, generalSansMedium } from "@/app/fonts";
import {
  BannerSlideData,
  ButtonData,
  FormFieldData,
  SectionData,
  SocialLinkData,
} from "../../types/section";
import { getSectionComponent } from "../../lib/sectionRegistry";
import {
  getCategoryLayoutOptions,
  getCategoryPageLayoutOptions,
} from "../../data/templateFlow";
import { PageLink, usePreview } from "../context/PreviewContext";

type MenuItem = {
  label: string;
  href: string;
  children?: MenuItem[];
};

type SectionItem = {
  id?: string;
  page?: string;
  type: string;
  variant: string;
  data: Record<string, SectionData>;
};

type HeaderBackgroundType = "solid" | "gradient";
type TopbarBackgroundType = "solid" | "gradient";
type FooterBackgroundType = "solid" | "gradient";
type StickySectionType = "scroll" | "sticky";
type BannerBackgroundMode = "image" | "video" | "solid" | "gradient";
type EditSectionModalProps = {
  category: string;
  sectionId: string;
  sectionType: string;
  sections: SectionItem[];
  onClose: () => void;
  onSave: (sectionType: string) => void;
  onSelectVariant: (type: string, variant: string) => void;
  onUpdateSectionData: (
    type: string,
    newData: Record<string, SectionData>,
  ) => void;
};

const aboutPageLayouts = [
  { id: "AboutPage-1", name: "About Page" },
  { id: "AboutPage-2", name: "About Page Two" },
  { id: "AboutPage-3", name: "About Page Three" },
];

const galleryPageLayouts = [{ id: "GalleryPage-1", name: "Gallery Page" }];

const servicePageLayouts = [{ id: "ServicePage-1", name: "Service Page" }];

const contactPageLayouts = [
  { id: "ContactPage-1", name: "Contact Page" },
  { id: "ContactPage-2", name: "Contact Page Two" },
];

const pageLayoutsBySection: Record<string, { id: string; name: string }[]> = {
  About: aboutPageLayouts,
  Service: servicePageLayouts,
  Gallery: galleryPageLayouts,
  Contact: contactPageLayouts,
};

const MAX_MENU_LINKS = 7;
const MAX_DROPDOWN_LINKS = 10;
const MAX_TOPBAR_SOCIAL_LINKS = 5;
const MAX_HEADER_BUTTONS = 3;
const MAX_BANNER_BUTTONS = 3;
const MAX_FORM_FIELDS = 5;
const MAX_LINK_TEXT_LENGTH = 20;
const DEFAULT_WHATSAPP_LINK = "https://api.whatsapp.com/send?phone=962786336414";
const DEFAULT_CALL_LINK = "tel:+919876543210";

const toPageLinks = (menu: MenuItem[], limit = MAX_MENU_LINKS): PageLink[] =>
  menu.slice(0, limit).map((item) => ({
    label: item.label,
    href: item.href,
    children: item.children
      ? toPageLinks(item.children, MAX_DROPDOWN_LINKS)
      : undefined,
  }));

const getPageNames = (links: PageLink[]): string[] =>
  links.flatMap((link) => [
    link.label,
    ...(link.children ? getPageNames(link.children) : []),
  ]);

const getMediaKindFromKey = (key: string): "image" | "video" | null => {
  const normalizedKey = key.toLowerCase();

  if (
    normalizedKey.includes("title") ||
    normalizedKey.includes("alt") ||
    normalizedKey.includes("label") ||
    normalizedKey.includes("href")
  ) {
    return null;
  }

  if (normalizedKey === "poster") return "image";
  if (normalizedKey === "image" || normalizedKey.endsWith("image")) {
    return "image";
  }
  if (normalizedKey === "video" || normalizedKey.endsWith("video")) {
    return "video";
  }

  return null;
};

const getMediaUploadLabel = (value: string, mediaKind: "image" | "video") => {
  if (!value) return `Choose ${mediaKind}`;

  return value.startsWith("data:") ? "Selected from desktop" : value;
};

const socialLinkLabels: SocialLinkData["label"][] = [
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
];

const sidebarItemsBySection: Record<string, string[]> = {
  Topbar: ["Topbar Layout", "Topbar Content"],
  Header: ["Header Content", "Header Layout", "Navigation Menu"],
  Banner: ["Banner Content", "Banner Layout"],
  About: ["About Content", "About Layout"],
  Service: ["Service Content", "Service Layout"],
  Product: ["Product Content", "Product Layout"],
  WhyChooseUs: ["WhyChooseUs Content", "WhyChooseUs Layout"],
  Gallery: ["Gallery Content", "Gallery Layout"],
  Contact: ["Contact Content", "Contact Layout"],
  FAQ: ["FAQ Content", "FAQ Layout"],
  Testimonial: ["Our Clients Content", "Our Clients Layout"],
  FormDetail: ["Form Content", "Form Layout"],
  Footer: ["Footer Layout", "Footer Content", "External Link"],
};

const componentContentFieldsByVariant: Record<string, string[]> = {
  "About-1": ["title", "desc", "backgroundImage", "backgroundImageTitle", "buttons"],
  "About-2": ["pretitle", "title", "subtitle", "desc", "backgroundImage", "backgroundImageTitle", "sideImage", "sideImageTitle", "philosophyTitle", "philosophyDesc", "buttons"],
  "AboutPage-1": ["pretitle", "title", "subtitle", "desc", "desc2", "sideImage", "sideImageTitle", "philosophyTitle", "philosophyDesc"],
  "AboutPage-2": ["pretitle", "title", "desc", "desc2", "sideImage", "sideImageTitle"],
  "AboutPage-3": ["pretitle", "title", "subtitle", "desc", "desc2", "philosophyTitle", "philosophyDesc"],
  "ServicePage-1": ["pretitle", "title", "subtitle", "desc", "desc2", "sideImage", "sideImageTitle", "productSectionTitle", "productItems", "productSlides"],
  "Product-1": ["productSlides", "productFeatures", "productTotalPrice", "productShippingText"],
  "Product-2": ["productSectionTitle", "productItems"],
  "Product-3": ["pretitle", "title", "desc", "buttons", "productItems"],
  "WhyChooseUs-1": ["pretitle", "title", "whyChooseUsItems"],
  "WhyChooseUs-2": ["title", "whyChooseUsItems"],
  "WhyChooseUs-3": ["title", "whyChooseUsItems"],
  "WhyChooseUs-4": ["title", "whyChooseUsItems"],
  "Gallery-1": ["title", "desc", "galleryItems"],
  "Gallery-2": ["title", "galleryItems"],
  "Gallery-3": ["title", "galleryItems"],
  "Gallery-4": ["pretitle", "title", "desc", "galleryItems"],
  "Gallery-5": ["title", "desc", "galleryItems"],
  "Gallery-6": ["title", "galleryItems"],
  "GalleryPage-1": ["pretitle", "title", "desc", "galleryItems"],
  "ContactPage-1": ["pretitle", "title", "desc", "sideImage", "sideImageTitle", "footerContact", "formFields", "formSubmitLabel"],
  "ContactPage-2": ["pretitle", "title", "desc", "footerContact", "formFields", "formSubmitLabel"],
  "FAQ-1": ["pretitle", "title", "desc", "faqItems"],
  "FAQ-2": ["title", "faqItems"],
  "FAQ-3": ["title", "faqItems"],
  "FAQ-4": ["title", "faqItems"],
  "Testimonial-1": ["pretitle", "title", "testimonialItems"],
  "Testimonial-2": ["pretitle", "title", "desc", "testimonialItems"],
  "Testimonial-3": ["pretitle", "title", "testimonialItems"],
  "FormDetail-1": ["pretitle", "title", "desc", "backgroundImage", "backgroundImageTitle", "sideImage", "galleryItems", "formFields", "formSubmitLabel"],
  "FormDetail-2": ["title", "formFields", "formSubmitLabel"],
  "FormDetail-3": ["title", "desc", "phone", "email", "location", "formFields", "formSubmitLabel"],
  "FormDetail-4": ["title", "desc", "formFields", "formSubmitLabel"],
};

const knownContentFieldsBySection: Record<string, Set<string>> = {
  About: new Set(["pretitle", "title", "subtitle", "desc", "desc2", "backgroundImage", "backgroundImageTitle", "sideImage", "sideImageTitle", "philosophyTitle", "philosophyDesc", "buttons"]),
  Service: new Set(["pretitle", "title", "subtitle", "desc", "desc2", "sideImage", "sideImageTitle", "productSectionTitle", "productItems", "productSlides"]),
  Product: new Set(["pretitle", "title", "desc", "buttons", "productSlides", "productFeatures", "productTotalPrice", "productShippingText", "productSectionTitle", "productItems"]),
  WhyChooseUs: new Set(["pretitle", "title", "desc", "whyChooseUsItems"]),
  Gallery: new Set(["pretitle", "title", "desc", "galleryItems"]),
  Contact: new Set(["pretitle", "title", "desc", "sideImage", "sideImageTitle", "footerContact", "formFields", "formSubmitLabel"]),
  FAQ: new Set(["pretitle", "title", "desc", "faqItems"]),
  Testimonial: new Set(["pretitle", "title", "desc", "testimonialItems"]),
  FormDetail: new Set(["pretitle", "title", "desc", "backgroundImage", "backgroundImageTitle", "sideImage", "galleryItems", "phone", "email", "location", "formFields", "formSubmitLabel"]),
};

const normalizeSectionType = (sectionType: string) => {
  const normalized = sectionType.trim().toLowerCase();
  const aliases: Record<string, string> = {
    faq: "FAQ",
    formdetail: "FormDetail",
    testimonial: "Testimonial",
    whychooseus: "WhyChooseUs",
  };

  if (aliases[normalized]) return aliases[normalized];

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getDefaultTab = (sectionType: string) =>
  sidebarItemsBySection[normalizeSectionType(sectionType)]?.[0] ??
  "Header Layout";

const formatSectionTitle = (sectionType: string) =>
  normalizeSectionType(sectionType);

const limitLinkText = (value: string) => value.slice(0, MAX_LINK_TEXT_LENGTH);

const clampBannerHeight = (height: number) => {
  if (!Number.isFinite(height)) return 70;

  return Math.min(100, Math.max(40, height));
};

const getDefaultBannerData = (
  variant: string,
  sourceData: SectionData = {},
): SectionData | undefined => {
  const sourceImage = sourceData.backgroundImage ?? "/bg1.jpg";
  const sourceVideo = sourceData.backgroundVideo ?? "/video.mp4";
  const sourceSlides = Array.isArray(sourceData.bannerSlides)
    ? sourceData.bannerSlides
    : [];

  if (variant === "Banner-4") {
    return {
      ...sourceData,
      bannerHeight: 70,
      bannerSlides: sourceSlides.length
        ? sourceSlides.map((slide) => ({
            ...slide,
            image: slide.image || sourceImage,
            video: slide.video || sourceVideo,
          }))
        : [
            {
              image: sourceImage,
              video: sourceVideo,
              alt: sourceData.backgroundImageTitle ?? "Category video slide",
              title: sourceData.title ?? "Category video banner",
              desc:
                sourceData.desc ??
                "Use category-specific motion behind every banner slide.",
              button: {
                label: "Explore",
                href: "#",
                variant: "primary",
              },
            },
          ],
    };
  }

  if (variant !== "Banner-3") return undefined;

  return {
    ...sourceData,
    bannerHeight: 70,
    bannerSlides: sourceSlides.length
      ? sourceSlides.map((slide) => ({
          ...slide,
          image: slide.image || sourceImage,
        }))
      : [
          {
            image: sourceImage,
            alt: sourceData.backgroundImageTitle ?? "Category slide",
            title: sourceData.title ?? "Category image slider",
            desc:
              sourceData.desc ??
              "Use category-specific images across every slider layout.",
            button: {
              label: "Explore",
              href: "#",
              variant: "primary",
            },
          },
        ],
  };
};

const getVisibleSocialLinks = (
  socialLinks: { label: SocialLinkData["label"]; href: string }[] = [],
) => socialLinks.slice(0, MAX_TOPBAR_SOCIAL_LINKS);

const SelectedLayoutBadge = ({
  active,
  title,
}: {
  active: boolean;
  title: string;
}) => (
  <>
    {active && (
      <span className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg">
        <Check size={16} strokeWidth={3} />
      </span>
    )}
    <span className="absolute bottom-2 left-2 right-2 z-20 truncate rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur">
      {title}
    </span>
  </>
);

const MediaUploadPreview = ({
  src,
  type,
}: {
  src: string;
  type: "image" | "video";
}) => (
  <div className="h-20 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-32">
    {src ? (
      type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <video src={src} className="h-full w-full object-cover" muted playsInline />
      )
    ) : (
      <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
        No {type}
      </div>
    )}
  </div>
);

type GenericFieldPath = Array<string | number>;

type HandledFieldObject = {
  [field: string]: HandledFieldSchema;
};

type HandledFieldSchema = true | HandledFieldObject;

type AutomaticContentField = {
  fieldName: string;
  value: unknown;
  path: GenericFieldPath;
};

const specializedContentFieldSchemas: Record<string, HandledFieldObject> = {
  Topbar: {
    topbarBackgroundType: true,
    topbarType: true,
    topbarBackgroundColor: true,
    topbarGradientColor: true,
    topbarTextColor: true,
    text: true,
    phone: true,
    email: true,
    location: true,
    hiddenContentFields: true,
    socialLinks: {
      $items: { label: true, href: true },
    },
  },
  Header: {
    logo: true,
    logoImage: true,
    logoImageTitle: true,
    headerBackgroundType: true,
    headerType: true,
    headerBackgroundColor: true,
    headerGradientColor: true,
    headerTextColor: true,
    menu: true,
    buttons: {
      $items: { label: true, href: true, variant: true },
    },
  },
  Banner: {
    backgroundImage: true,
    backgroundImageTitle: true,
    pretitle: true,
    title: true,
    desc: true,
    overlayColor: true,
    titleColor: true,
    bannerBackgroundMode: true,
    bannerBackgroundColor: true,
    bannerGradientColor: true,
    backgroundVideo: true,
    bannerHeight: true,
    buttons: {
      $items: { label: true, href: true, variant: true },
    },
    bannerSlides: {
      $items: {
        image: true,
        video: true,
        alt: true,
        title: true,
        desc: true,
        button: { label: true, href: true, variant: true },
      },
    },
  },
  FormDetail: {
    pretitle: true,
    title: true,
    desc: true,
    formSubmitLabel: true,
    formFields: {
      $items: { label: true, type: true, placeholder: true },
    },
  },
  Footer: {
    logo: true,
    logoImage: true,
    logoImageTitle: true,
    footerBackgroundType: true,
    footerBackgroundColor: true,
    footerGradientColor: true,
    footerTextColor: true,
    footerMutedTextColor: true,
    footerColumns: {
      $items: {
        title: true,
        links: { $items: { label: true, href: true } },
      },
    },
    whatsappLink: true,
    callLink: true,
  },
};

const collectAutomaticContentFields = (
  value: unknown,
  schema: HandledFieldSchema | undefined,
  path: GenericFieldPath,
  fieldName: string,
): AutomaticContentField[] => {
  if (schema === true) return [];

  if (!schema) return [{ fieldName, value, path }];

  if (Array.isArray(value)) {
    const itemSchema = schema.$items;

    if (!itemSchema) return [{ fieldName, value, path }];

    return value.flatMap((item, index) =>
      collectAutomaticContentFields(
        item,
        itemSchema,
        [...path, index],
        `Item ${index + 1}`,
      ),
    );
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([childName, childValue]) =>
      collectAutomaticContentFields(
        childValue,
        schema[childName],
        [...path, childName],
        childName,
      ),
    );
  }

  return [{ fieldName, value, path }];
};

type GenericFieldEditorProps = {
  fieldName: string;
  value: unknown;
  path: GenericFieldPath;
  sectionType: string;
  onChange: (path: GenericFieldPath, value: unknown) => void;
  onMediaChange: (
    path: GenericFieldPath,
    fieldName: string,
    file: File,
  ) => void;
  onAddArrayItem?: (path: GenericFieldPath) => void;
  onDeleteArrayItem?: (path: GenericFieldPath, index: number) => void;
  availablePageNames?: string[];
};

const userManageableCollectionFields = new Set([
  "productItems",
  "productSlides",
  "testimonialItems",
  "faqItems",
  "galleryItems",
]);

const formatFieldLabel = (fieldName: string) =>
  fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());

const GenericFieldEditor = ({
  fieldName,
  value,
  path,
  sectionType,
  onChange,
  onMediaChange,
  onAddArrayItem,
  onDeleteArrayItem,
  availablePageNames = [],
}: GenericFieldEditorProps) => {
  if (Array.isArray(value)) {
    const canManageItems =
      path.length === 1 &&
      userManageableCollectionFields.has(fieldName) &&
      onAddArrayItem &&
      onDeleteArrayItem;

    return (
      <section className="rounded-xl bg-[#f4f4f5] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-slate-900">
            {formatFieldLabel(fieldName)}
          </h4>
          {canManageItems && (
            <button
              type="button"
              onClick={() => onAddArrayItem(path)}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={14} />
              Add New
            </button>
          )}
        </div>
        {value.length ? (
          <div className="space-y-3">
            {value.map((item, index) => (
              <div
                key={`${fieldName}-${index}`}
                className="relative rounded-xl border border-slate-200 bg-white p-3"
              >
                {canManageItems && (
                  <button
                    type="button"
                    onClick={() => onDeleteArrayItem(path, index)}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${formatFieldLabel(fieldName)} item ${index + 1}`}
                  >
                    <Trash size={15} />
                  </button>
                )}
                <GenericFieldEditor
                  fieldName={`Item ${index + 1}`}
                  value={item}
                  path={[...path, index]}
                  sectionType={sectionType}
                  onChange={onChange}
                  onMediaChange={onMediaChange}
                  onAddArrayItem={onAddArrayItem}
                  onDeleteArrayItem={onDeleteArrayItem}
                  availablePageNames={availablePageNames}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No items to edit.</p>
        )}
      </section>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="space-y-3">
        {fieldName.startsWith("Item ") && (
          <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {fieldName}
          </h5>
        )}
        {(() => {
          const entries = Object.entries(value);
          const isProductItem =
            path.length === 2 &&
            (path[0] === "productItems" || path[0] === "productSlides");

          if (isProductItem) {
            const existingLinkIndex = entries.findIndex(
              ([key]) => key === "link",
            );
            const linkEntry =
              existingLinkIndex >= 0
                ? entries.splice(existingLinkIndex, 1)[0]
                : (["link", ""] as [string, unknown]);
            const altIndex = entries.findIndex(([key]) => key === "alt");
            entries.splice(
              altIndex >= 0 ? altIndex + 1 : entries.length,
              0,
              linkEntry,
            );
          }

          return entries.map(([childName, childValue]) => (
          <GenericFieldEditor
            key={childName}
            fieldName={childName}
            value={childValue}
            path={[...path, childName]}
            sectionType={sectionType}
            onChange={onChange}
            onMediaChange={onMediaChange}
            onAddArrayItem={onAddArrayItem}
            onDeleteArrayItem={onDeleteArrayItem}
            availablePageNames={availablePageNames}
          />
          ));
        })()}
      </div>
    );
  }

  const label = formatFieldLabel(fieldName);
  const mediaKind =
    typeof value === "string" ? getMediaKindFromKey(fieldName) : null;

  if (mediaKind) {
    const stringValue = value as string;

    return (
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-600">
          {label}
        </span>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-start">
          <div className="space-y-2">
            <label className="flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition hover:border-blue-500 focus-within:border-blue-600">
              <span className="font-medium">
                {stringValue ? `Change ${mediaKind}` : `Upload ${mediaKind}`}
              </span>
              <span className="max-w-[55%] truncate text-xs text-slate-500">
                {getMediaUploadLabel(stringValue, mediaKind)}
              </span>
              <input
                type="file"
                accept={mediaKind === "video" ? "video/*" : "image/*"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onMediaChange(path, fieldName, file);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            <input
              value={stringValue}
              onChange={(event) => onChange(path, event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
              placeholder={`${label} URL`}
            />
          </div>
          <MediaUploadPreview src={stringValue} type={mediaKind} />
        </div>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(path, event.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
      </label>
    );
  }

  const stringValue = value == null ? "" : String(value);
  const isRating = sectionType === "Testimonial" && fieldName === "rating";
  const isNumber = typeof value === "number" || isRating;
  const isLongText =
    stringValue.length > 80 ||
    /^(desc|desc2|description|answer|quote|copyrightText)$/i.test(fieldName);
  const isProductLink =
    fieldName === "link" &&
    path.length === 3 &&
    (path[0] === "productItems" || path[0] === "productSlides");
  const pageExists = availablePageNames.some(
    (pageName) =>
      pageName.trim().toLowerCase() === stringValue.trim().toLowerCase(),
  );

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {isLongText ? (
        <textarea
          value={stringValue}
          onChange={(event) => onChange(path, event.target.value)}
          className="h-24 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        />
      ) : (
        <input
          type={isNumber ? "number" : "text"}
          min={isRating ? 0 : undefined}
          max={isRating ? 5 : undefined}
          step={isRating ? 0.5 : undefined}
          value={stringValue}
          onChange={(event) => {
            if (typeof value === "number") {
              onChange(path, Number(event.target.value));
              return;
            }

            if (isRating) {
              onChange(
                path,
                String(
                  Math.max(0, Math.min(5, Number(event.target.value) || 0)),
                ),
              );
              return;
            }

            onChange(path, event.target.value);
          }}
          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
        />
      )}
      {isProductLink && stringValue.trim() && !pageExists && (
        <span className="mt-1 block text-xs font-medium text-red-600">
          No page found.
        </span>
      )}
    </label>
  );
};

const setValueAtPath = (
  source: unknown,
  path: GenericFieldPath,
  value: unknown,
): unknown => {
  if (!path.length) return value;

  const [key, ...remainingPath] = path;

  if (Array.isArray(source)) {
    const copy = [...source];
    const index = Number(key);
    copy[index] = setValueAtPath(copy[index], remainingPath, value);
    return copy;
  }

  const record =
    typeof source === "object" && source !== null
      ? (source as Record<string, unknown>)
      : {};

  return {
    ...record,
    [String(key)]: setValueAtPath(record[String(key)], remainingPath, value),
  };
};

const VisibilityButton = ({ hidden, onClick }: { hidden: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-md border px-3 py-1 text-xs font-semibold ${
      hidden
        ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        : "border-slate-300 text-slate-600 hover:bg-slate-50"
    }`}
  >
    {hidden ? "Show" : "Hide"}
  </button>
);

export default function EditSectionModal({
  category,
  sectionId,
  sectionType,
  sections,
  onClose,
  onSave,
  onSelectVariant,
  onUpdateSectionData,
}: EditSectionModalProps) {
  const [activeTab, setActiveTab] = useState(getDefaultTab(sectionType));
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [galleryLayoutStart, setGalleryLayoutStart] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastChangedSection, setLastChangedSection] = useState(sectionType);
  const { currentPage, pageLinks, setCurrentPage, setPageLinks } = usePreview();
  const availablePageNames = getPageNames(pageLinks);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    modalX: number;
    modalY: number;
  } | null>(null);
  const [bannerGenerationType, setBannerGenerationType] = useState<
    "image" | "video" | null
  >(null);
  const [layoutGenerationActive, setLayoutGenerationActive] = useState(false);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);
  const bannerVideoInputRef = useRef<HTMLInputElement>(null);
  const activeSectionType = normalizeSectionType(sectionType);
  const visibleSidebarItems = sidebarItemsBySection[activeSectionType] ?? [];
  const currentSection = sections.find(
    (item) => (item.id ?? item.type) === sectionId,
  );
  const activeSectionKey = currentSection?.id ?? currentSection?.type ?? sectionId;
  const isPageSection = Boolean(currentSection?.page);
  const activeVariant = currentSection?.data?.[currentSection.variant]
    ? currentSection.variant
    : currentSection?.variant?.startsWith(`${activeSectionType}-`)
      ? currentSection.variant
      : `${activeSectionType}-1`;
  const fallbackVariantData =
    currentSection?.data?.[`${activeSectionType}-1`] ??
    Object.values(currentSection?.data ?? {})[0];

  const activeTopbarData = currentSection?.data?.[activeVariant] as
    | {
        topbarBackgroundType?: TopbarBackgroundType;
        topbarType?: StickySectionType;
        topbarBackgroundColor?: string;
        topbarGradientColor?: string;
        topbarTextColor?: string;
        text?: string[];
        phone?: string;
        email?: string;
        location?: string;
        socialLinks?: {
          label: "facebook" | "instagram" | "twitter" | "linkedin";
          href: string;
        }[];
        hiddenContentFields?: string[];
      }
    | undefined;

  const activeHeaderData = currentSection?.data?.[activeVariant] as
    | {
      logo?: string;
      logoImage?: string;
      logoImageTitle?: string;
      headerBackgroundType?: HeaderBackgroundType;
      headerType?: StickySectionType;
        headerBackgroundColor?: string;
        headerGradientColor?: string;
        headerTextColor?: string;
        menu?: MenuItem[];
        buttons?: ButtonData[];
      }
    | undefined;

  const activeBannerData = (currentSection?.data?.[activeVariant] ??
    (activeSectionType === "Banner"
      ? getDefaultBannerData(activeVariant, fallbackVariantData)
      : undefined)) as
    | {
        backgroundImage?: string;
        backgroundImageTitle?: string;
        pretitle?: string;
        title?: string;
        desc?: string;
        overlayColor?: string;
        titleColor?: string;
        bannerBackgroundMode?: BannerBackgroundMode;
        bannerBackgroundColor?: string;
        bannerGradientColor?: string;
        backgroundVideo?: string;
        bannerHeight?: number;
        bannerSlides?: BannerSlideData[];
        buttons?: ButtonData[];
      }
    | undefined;

  const activeFormDetailData = currentSection?.data?.[activeVariant] as
    | {
        pretitle?: string;
        title?: string;
        desc?: string;
        formSubmitLabel?: string;
        formFields?: FormFieldData[];
      }
    | undefined;
  const activeGenericData = currentSection?.data?.[activeVariant] as
    | SectionData
    | undefined;
  const activeComponentContentFields =
    componentContentFieldsByVariant[activeVariant];
  const knownSectionContentFields =
    knownContentFieldsBySection[activeSectionType];
  const isContentFieldVisible = (field: string) =>
    !activeComponentContentFields ||
    activeComponentContentFields.includes(field) ||
    !knownSectionContentFields?.has(field);
  const visibleGenericContentEntries = Object.entries(
    activeGenericData ?? {},
  ).filter(([field]) => isContentFieldVisible(field));
  const specializedContentSchema =
    specializedContentFieldSchemas[activeSectionType];
  const automaticContentFields = specializedContentSchema
    ? Object.entries(activeGenericData ?? {})
        .filter(([fieldName]) => isContentFieldVisible(fieldName))
        .flatMap(([fieldName, value]) =>
          collectAutomaticContentFields(
            value,
            specializedContentSchema[fieldName],
            [fieldName],
            fieldName,
          ),
        )
    : [];

  const menuItems = activeHeaderData?.menu ?? [];
  const topbarBackgroundType =
    activeTopbarData?.topbarBackgroundType ?? "solid";
  const topbarType = activeTopbarData?.topbarType ?? "scroll";
  const topbarSolidColor = activeTopbarData?.topbarBackgroundColor ?? "#245c6e";
  const topbarGradientColor =
    activeTopbarData?.topbarGradientColor ?? "#0668ff";
  const topbarTextColor = activeTopbarData?.topbarTextColor ?? "#ffffff";
  const topbarPreviewBackground =
    topbarBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${topbarSolidColor}, ${topbarGradientColor})`
      : topbarSolidColor;
  const headerBackgroundType =
    activeHeaderData?.headerBackgroundType ?? "solid";
  const headerType = activeHeaderData?.headerType ?? "scroll";
  const headerSolidColor = activeHeaderData?.headerBackgroundColor ?? "#245c6e";
  const headerGradientColor =
    activeHeaderData?.headerGradientColor ?? "#0668ff";
  const headerTextColor = activeHeaderData?.headerTextColor ?? "#ffffff";
  const headerPreviewBackground =
    headerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${headerSolidColor}, ${headerGradientColor})`
      : headerSolidColor;
  const explicitBannerBackgroundMode = activeBannerData?.bannerBackgroundMode;
  const bannerBackgroundMode = explicitBannerBackgroundMode ?? "image";
  const bannerSolidColor = activeBannerData?.bannerBackgroundColor ?? "#0f172a";
  const bannerGradientColor =
    activeBannerData?.bannerGradientColor ?? "#0ea5e9";
  const bannerHeight = activeBannerData?.bannerHeight ?? 70;
  const hasBannerImageField = bannerBackgroundMode === "image";
  const hasBannerVideoField = bannerBackgroundMode === "video";
  const hasBannerColorField =
    bannerBackgroundMode === "solid" || bannerBackgroundMode === "gradient";
  const hasBannerButtonsField = "buttons" in (activeBannerData ?? {});
  const hasBannerMediaField =
    hasBannerImageField || hasBannerVideoField || hasBannerColorField;
  const hasBannerHeightField = "bannerHeight" in (activeBannerData ?? {});
  const hasBannerSlidesField = Array.isArray(activeBannerData?.bannerSlides);
  const isSliderBanner = activeVariant === "Banner-3" || activeVariant === "Banner-4";
  const isVideoSliderBanner = activeVariant === "Banner-4";
  const isSimpleBanner = activeVariant === "Banner-1" || activeVariant === "Banner-2";

  const activeFooterData = currentSection?.data?.[activeVariant] as
    | {
        logo?: string;
        logoImage?: string;
        logoImageTitle?: string;
        footerColumns?: { title: string; links: { label: string; href: string }[] }[];
        footerBackgroundType?: FooterBackgroundType;
        footerBackgroundColor?: string;
        footerGradientColor?: string;
        footerTextColor?: string;
        whatsappLink?: string;
        callLink?: string;
      }
    | undefined;
  const footerBackgroundType =
    activeFooterData?.footerBackgroundType ?? "solid";
  const footerSolidColor = activeFooterData?.footerBackgroundColor ?? "#0d1f2a";
  const footerGradientColor =
    activeFooterData?.footerGradientColor ?? "#1d4ed8";
  const footerTextColor = activeFooterData?.footerTextColor ?? "#ffffff";
  const footerPreviewBackground =
    footerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${footerSolidColor}, ${footerGradientColor})`
      : footerSolidColor;
  const topbarSocialLinks = getVisibleSocialLinks(
    activeTopbarData?.socialLinks,
  );
  const usesSectionColorPanel =
    (activeSectionType === "Topbar" && activeTab === "Topbar Layout") ||
    (activeSectionType === "Header" && activeTab === "Header Layout") ||
    (activeSectionType === "Footer" && activeTab === "Footer Layout");
  const categoryLayoutOptions = getCategoryLayoutOptions(
    category,
    activeSectionType,
  );
  const discoveredPageLayoutOptions = getCategoryPageLayoutOptions(
    category,
    activeSectionType,
  );
  const pageLayoutOptions = discoveredPageLayoutOptions.length
    ? discoveredPageLayoutOptions
    : pageLayoutsBySection[activeSectionType] ?? [];
  const sectionLayoutOptions = isPageSection
    ? pageLayoutOptions
    : categoryLayoutOptions;
  const layoutOptions = sectionLayoutOptions;
  const visibleLayoutOptions =
    activeSectionType === "Gallery" && layoutOptions.length > 4
      ? Array.from(
          { length: 4 },
          (_, index) =>
            layoutOptions[(galleryLayoutStart + index) % layoutOptions.length],
        )
      : layoutOptions;
  const activeAboutLayouts = isPageSection
    ? pageLayoutOptions
    : categoryLayoutOptions;
  const generationText = bannerGenerationType
    ? `generating ${bannerGenerationType}`
    : layoutGenerationActive
      ? "generating layout"
      : "";

  const handleModalPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    const interactiveLabel = target.closest("label")?.querySelector("input");

    if (
      interactiveLabel ||
      target.closest(
        "button,input,textarea,select,a,[role='button'],[data-editor-no-drag]",
      )
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();

    setDragStart({
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      modalX: modalPosition.x,
      modalY: modalPosition.y,
    });
  };

  const handleModalPointerUp = () => {
    setDragStart(null);
  };

  useEffect(() => {
    if (!dragStart) return;

    const handleWindowPointerMove = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== dragStart.pointerId) return;

      setModalPosition({
        x: dragStart.modalX + event.clientX - dragStart.pointerX,
        y: dragStart.modalY + event.clientY - dragStart.pointerY,
      });
    };
    const handleWindowPointerEnd = (event: globalThis.PointerEvent) => {
      if (event.pointerId === dragStart.pointerId) setDragStart(null);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [dragStart]);

  const updateActiveTopbarData = (newData: Record<string, unknown>) => {
    if (!currentSection || !activeTopbarData) return;

    setHasChanges(true);
    setLastChangedSection(activeSectionKey);
    onUpdateSectionData(activeSectionKey, {
      ...currentSection.data,
      [activeVariant]: {
        ...activeTopbarData,
        ...newData,
      },
    });
  };

  const updateActiveHeaderData = (newData: Record<string, unknown>) => {
    if (!currentSection || !activeHeaderData) return;

    if (Array.isArray(newData.menu)) {
      const nextPageLinks = toPageLinks(newData.menu as MenuItem[]);

      setPageLinks(nextPageLinks);
      setCurrentPage(
        nextPageLinks.some((item) => item.label === currentPage)
          ? currentPage
          : (nextPageLinks[0]?.label ?? ""),
      );
    }

    setHasChanges(true);
    setLastChangedSection(activeSectionKey);
    onUpdateSectionData(activeSectionKey, {
      ...currentSection.data,
      [activeVariant]: {
        ...activeHeaderData,
        ...newData,
      },
    });
  };

  const updateActiveBannerData = (newData: Record<string, unknown>) => {
    if (!currentSection || !activeBannerData) return;

    setHasChanges(true);
    setLastChangedSection(activeSectionKey);
    onUpdateSectionData(activeSectionKey, {
      ...currentSection.data,
      [activeVariant]: {
        ...activeBannerData,
        ...newData,
      },
    });
  };

  const updateActiveFooterData = (newData: Record<string, unknown>) => {
    if (!currentSection || !activeFooterData) return;

    setHasChanges(true);
    setLastChangedSection(activeSectionKey);
    onUpdateSectionData(activeSectionKey, {
      ...currentSection.data,
      [activeVariant]: {
        ...activeFooterData,
        ...newData,
      },
    });
  };

  const updateActiveFormDetailData = (newData: Record<string, unknown>) => {
    if (!currentSection || !activeFormDetailData) return;

    setHasChanges(true);
    setLastChangedSection(activeSectionKey);
    onUpdateSectionData(activeSectionKey, {
      ...currentSection.data,
      [activeVariant]: {
        ...activeFormDetailData,
        ...newData,
      },
    });
  };

  const updateFormField = (
    index: number,
    field: keyof FormFieldData,
    value: string,
  ) => {
    const updatedFields = (activeFormDetailData?.formFields ?? []).map(
      (item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
    );

    updateActiveFormDetailData({ formFields: updatedFields });
  };

  const addFormField = () => {
    if ((activeFormDetailData?.formFields ?? []).length >= MAX_FORM_FIELDS) {
      return;
    }

    updateActiveFormDetailData({
      formFields: [
        ...(activeFormDetailData?.formFields ?? []),
        {
          label: "New Field",
          type: "text",
          placeholder: "Enter value",
        },
      ],
    });
  };

  const deleteFormField = (index: number) => {
    updateActiveFormDetailData({
      formFields: (activeFormDetailData?.formFields ?? []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  };

  const updateActiveGenericData = (newData: Record<string, unknown>) => {
    if (!currentSection || !activeGenericData) return;

    setHasChanges(true);
    setLastChangedSection(activeSectionKey);
    onUpdateSectionData(activeSectionKey, {
      ...currentSection.data,
      [activeVariant]: {
        ...activeGenericData,
        ...newData,
      },
    });
  };

  const updateGenericField = (path: GenericFieldPath, value: unknown) => {
    const [field, ...nestedPath] = path;
    if (typeof field !== "string" || !activeGenericData) return;

    const nextValue = setValueAtPath(
      activeGenericData[field as keyof SectionData],
      nestedPath,
      value,
    );

    if (
      activeSectionType === "Header" &&
      field === "menu" &&
      Array.isArray(nextValue)
    ) {
      updateActiveHeaderData({ menu: nextValue });
      return;
    }

    updateActiveGenericData({
      [field]: nextValue,
    });
  };

  const updateGenericMedia = (
    path: GenericFieldPath,
    fieldName: string,
    file: File,
  ) => {
    const mediaKind = getMediaKindFromKey(fieldName) ?? "image";

    showBannerGenerationLoader(mediaKind);
    readBannerBackgroundFile(file, (dataUrl) => {
      updateGenericField(path, dataUrl);
    });
  };

  const addGenericCollectionItem = (path: GenericFieldPath) => {
    const [field] = path;
    if (typeof field !== "string") return;

    const items = activeGenericData?.[field as keyof SectionData];
    if (!Array.isArray(items)) return;

    const newItems: Record<string, unknown> = {
      productItems: {
        title: "New Product",
        category: "Product Category",
        desc: "Add the product description here.",
        image: "",
        alt: "Product image",
        link: "",
      },
      productSlides: {
        image: "",
        alt: "Product image",
        link: "",
        productTitle: "New Product",
        productSubtitle: "Product Category",
        productInfoTitle: "Product Details",
        productInfoDesc: "Add the product description here.",
        productFeatures: [
          { label: "Feature", price: "Price" },
        ],
        productTotalPrice: "Price",
        productShippingText: "Add delivery information",
        button: {
          label: "View details",
          href: "#",
          variant: "primary",
        },
      },
      testimonialItems: {
        name: "New Customer",
        role: "Customer",
        quote: "Add the customer testimonial here.",
        image: "",
        rating: "5",
      },
      faqItems: {
        question: "New question",
        answer: "Add the answer here.",
      },
      galleryItems: {
        image: "",
        alt: "Gallery image",
        title: "New gallery image",
      },
    };
    const newItem = newItems[field];

    if (!newItem) return;
    updateGenericField(path, [...items, newItem]);
  };

  const deleteGenericCollectionItem = (
    path: GenericFieldPath,
    index: number,
  ) => {
    const [field] = path;
    if (typeof field !== "string") return;

    const items = activeGenericData?.[field as keyof SectionData];
    if (!Array.isArray(items)) return;

    updateGenericField(
      path,
      items.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const selectSectionVariant = (variant: string) => {
    const isAllowedVariant =
      Boolean(currentSection?.data?.[variant]) ||
      variant.startsWith(`${activeSectionType}-`) ||
      (isPageSection && variant.startsWith(`${activeSectionType}Page-`));

    if (!isAllowedVariant) return;

    setLayoutGenerationActive(true);
    window.setTimeout(() => {
      setLayoutGenerationActive(false);
      onClose();
    }, 1600);

    if (activeSectionType === "Banner" && currentSection) {
      const currentVariantData = currentSection.data[variant];
      const sourceVariantData =
        currentVariantData ??
        currentSection.data[activeVariant] ??
        currentSection.data["Banner-1"] ??
        Object.values(currentSection.data)[0];
      const nextVariantData =
        variant === "Banner-1"
          ? {
              ...sourceVariantData,
              bannerBackgroundMode: "image" as const,
              backgroundImage: sourceVariantData?.backgroundImage ?? "/bg1.jpg",
            }
          : variant === "Banner-2"
            ? {
                ...sourceVariantData,
                bannerBackgroundMode: "video" as const,
                backgroundVideo:
                  sourceVariantData?.backgroundVideo ?? "/video.mp4",
              }
            : undefined;

      if (nextVariantData) {
        onUpdateSectionData(activeSectionKey, {
          ...currentSection.data,
          [variant]: nextVariantData,
        });
      }
    }

    if (
      activeSectionType === "Banner" &&
      currentSection &&
      !currentSection.data[variant]
    ) {
      const defaultBannerData = getDefaultBannerData(
        variant,
        currentSection.data[activeVariant] ??
          currentSection.data["Banner-1"] ??
          Object.values(currentSection.data)[0],
      );

      if (defaultBannerData) {
        onUpdateSectionData(activeSectionKey, {
          ...currentSection.data,
          [variant]: defaultBannerData,
        });
      }
    }

    if (currentSection?.variant !== variant) {
      if (currentSection && !currentSection.data[variant]) {
        const sourceData =
          currentSection.data[activeVariant] ?? Object.values(currentSection.data)[0];

        onUpdateSectionData(activeSectionKey, {
          ...currentSection.data,
          [variant]: sourceData,
        });
      }

      setHasChanges(true);
      setLastChangedSection(activeSectionKey);
    }

    onSelectVariant(activeSectionKey, variant);
  };

  const handleDone = () => {
    if (hasChanges) {
      onSave(lastChangedSection);
      return;
    }

    onClose();
  };
  const updateMenuItem = (
    index: number,
    field: keyof MenuItem,
    value: string,
  ) => {
    const nextValue = field === "label" ? limitLinkText(value) : value;
    const updatedMenu = menuItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: nextValue } : item,
    );

    updateActiveHeaderData({ menu: updatedMenu });
  };

  const addMenuItem = () => {
    if (menuItems.length >= MAX_MENU_LINKS) return;

    const updatedMenu = [
      ...menuItems,
      {
        label: "New Item",
        href: "/new-item",
      },
    ];

    updateActiveHeaderData({ menu: updatedMenu });
  };

  const updateTopbarBackgroundType = (type: TopbarBackgroundType) => {
    updateActiveTopbarData({ topbarBackgroundType: type });
  };

  const updateTopbarType = (type: StickySectionType) => {
    updateActiveTopbarData({ topbarType: type });
  };

  const updateTopbarSolidColor = (color: string) => {
    updateActiveTopbarData({ topbarBackgroundColor: color });
  };

  const updateTopbarGradientColor = (color: string) => {
    updateActiveTopbarData({ topbarGradientColor: color });
  };

  const updateTopbarTextColor = (color: string) => {
    updateActiveTopbarData({ topbarTextColor: color });
  };

  const updateTopbarText = (value: string) => {
    updateActiveTopbarData({ text: [value] });
  };

  const isTopbarFieldHidden = (field: string) =>
    activeTopbarData?.hiddenContentFields?.includes(field) ?? false;

  const toggleTopbarFieldVisibility = (field: string) => {
    const hiddenFields = activeTopbarData?.hiddenContentFields ?? [];
    updateActiveTopbarData({
      hiddenContentFields: hiddenFields.includes(field)
        ? hiddenFields.filter((item) => item !== field)
        : [...hiddenFields, field],
    });
  };

  const updateTopbarField = (
    field: "phone" | "email" | "location",
    value: string,
  ) => {
    updateActiveTopbarData({ [field]: value });
  };

  const updateTopbarSocialLink = (
    index: number,
    field: "label" | "href",
    value: string,
  ) => {
    const updatedSocialLinks = topbarSocialLinks.map(
      (socialLink, socialIndex) =>
        socialIndex === index
          ? field === "label"
            ? {
                ...socialLink,
                label: value as SocialLinkData["label"],
              }
            : {
                ...socialLink,
                href: value,
              }
          : socialLink,
    );

    updateActiveTopbarData({
      socialLinks: getVisibleSocialLinks(updatedSocialLinks),
    });
  };

  const addTopbarSocialLink = () => {
    const currentSocialLinks = getVisibleSocialLinks(
      activeTopbarData?.socialLinks,
    );

    if (currentSocialLinks.length >= MAX_TOPBAR_SOCIAL_LINKS) {
      return;
    }

    const updatedSocialLinks = [
      ...currentSocialLinks,
      { label: "instagram" as const, href: "#" },
    ];

    updateActiveTopbarData({ socialLinks: updatedSocialLinks });
  };

  const deleteTopbarSocialLink = (index: number) => {
    const updatedSocialLinks = topbarSocialLinks.filter(
      (_, socialIndex) => socialIndex !== index,
    );

    updateActiveTopbarData({ socialLinks: updatedSocialLinks });
  };

  const updateHeaderBackgroundType = (type: HeaderBackgroundType) => {
    updateActiveHeaderData({ headerBackgroundType: type });
  };

  const updateHeaderType = (type: StickySectionType) => {
    updateActiveHeaderData({ headerType: type });
  };

  const updateHeaderSolidColor = (color: string) => {
    updateActiveHeaderData({ headerBackgroundColor: color });
  };

  const updateHeaderGradientColor = (color: string) => {
    updateActiveHeaderData({ headerGradientColor: color });
  };

  const updateHeaderTextColor = (color: string) => {
    updateActiveHeaderData({ headerTextColor: color });
  };

  const updateHeaderLogo = (logo: string) => {
    updateActiveHeaderData({ logo });
  };

  const updateHeaderLogoImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showBannerGenerationLoader("image");
    readBannerBackgroundFile(file, (dataUrl) => {
      updateActiveHeaderData({
        logoImage: dataUrl,
        logoImageTitle: file.name,
      });
    });
    event.target.value = "";
  };

  const deleteHeaderLogoImage = () => {
    updateActiveHeaderData({ logoImage: "", logoImageTitle: "" });
  };

  const updateHeaderButton = (
    index: number,
    field: "label" | "href" | "variant",
    value: string,
  ) => {
    const nextValue = field === "label" ? limitLinkText(value) : value;
    const updatedButtons = (activeHeaderData?.buttons ?? []).map(
      (button, buttonIndex) =>
        buttonIndex === index ? { ...button, [field]: nextValue } : button,
    );

    updateActiveHeaderData({ buttons: updatedButtons });
  };

  const addHeaderButton = () => {
    if ((activeHeaderData?.buttons ?? []).length >= MAX_HEADER_BUTTONS) return;

    const updatedButtons = [
      ...(activeHeaderData?.buttons ?? []),
      { label: "New Button", href: "#", variant: "primary" },
    ];

    updateActiveHeaderData({ buttons: updatedButtons });
  };

  const deleteHeaderButton = (index: number) => {
    const updatedButtons = (activeHeaderData?.buttons ?? []).filter(
      (_, buttonIndex) => buttonIndex !== index,
    );

    updateActiveHeaderData({ buttons: updatedButtons });
  };

  const updateBannerField = (field: string, value: string) => {
    updateActiveBannerData({ [field]: value });
  };

  const readBannerBackgroundFile = (
    file: File,
    onLoad: (dataUrl: string) => void,
  ) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLoad(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const showBannerGenerationLoader = (type: "image" | "video") => {
    setBannerGenerationType(type);
    window.setTimeout(() => {
      setBannerGenerationType(null);
      onClose();
    }, 1800);
  };

  const handleBannerImageFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showBannerGenerationLoader("image");
    readBannerBackgroundFile(file, (dataUrl) => {
      updateActiveBannerData({
        bannerBackgroundMode: "image",
        backgroundImage: dataUrl,
        backgroundImageTitle:
          activeBannerData?.backgroundImageTitle || file.name,
      });
    });
    event.target.value = "";
  };

  const handleBannerVideoFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showBannerGenerationLoader("video");
    readBannerBackgroundFile(file, (dataUrl) => {
      updateActiveBannerData({
        bannerBackgroundMode: "video",
        backgroundVideo: dataUrl,
      });
    });
    event.target.value = "";
  };

  const handleBannerSlideImageFileChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showBannerGenerationLoader("image");
    readBannerBackgroundFile(file, (dataUrl) => {
      updateBannerSlide(index, "image", dataUrl);
      updateBannerSlide(index, "alt", file.name);
    });
    event.target.value = "";
  };

  const handleBannerSlideVideoFileChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showBannerGenerationLoader("video");
    readBannerBackgroundFile(file, (dataUrl) => {
      updateBannerSlide(index, "video", dataUrl);
      updateBannerSlide(index, "alt", file.name);
    });
    event.target.value = "";
  };

  const deleteBannerSlideVideo = (index: number) => {
    updateBannerSlide(index, "video", "");
  };

  const updateBannerHeight = (height: number) => {
    updateActiveBannerData({ bannerHeight: clampBannerHeight(height) });
  };

  const updateBannerButton = (
    index: number,
    field: "label" | "href" | "variant",
    value: string,
  ) => {
    const nextValue = field === "label" ? limitLinkText(value) : value;
    const updatedButtons = (activeBannerData?.buttons ?? []).map(
      (button, buttonIndex) =>
        buttonIndex === index ? { ...button, [field]: nextValue } : button,
    );

    updateActiveBannerData({ buttons: updatedButtons });
  };

  const addBannerButton = () => {
    if ((activeBannerData?.buttons ?? []).length >= MAX_BANNER_BUTTONS) return;

    const updatedButtons = [
      ...(activeBannerData?.buttons ?? []),
      { label: "New Button", href: "#" },
    ];

    updateActiveBannerData({ buttons: updatedButtons });
  };

  const deleteBannerButton = (index: number) => {
    const updatedButtons = (activeBannerData?.buttons ?? []).filter(
      (_, buttonIndex) => buttonIndex !== index,
    );

    updateActiveBannerData({ buttons: updatedButtons });
  };

  const updateBannerSlide = (
    index: number,
    field: keyof Omit<BannerSlideData, "button">,
    value: string,
  ) => {
    const updatedSlides = (activeBannerData?.bannerSlides ?? []).map(
      (slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide,
    );

    updateActiveBannerData({ bannerSlides: updatedSlides });
  };

  const updateBannerSlideButton = (
    index: number,
    field: "label" | "href" | "variant",
    value: string,
  ) => {
    const nextValue = field === "label" ? limitLinkText(value) : value;
    const updatedSlides = (activeBannerData?.bannerSlides ?? []).map(
      (slide, slideIndex) => {
        if (slideIndex !== index) return slide;

        return {
          ...slide,
          button: {
            label: "Learn more",
            href: "#",
            ...slide.button,
            [field]: nextValue,
          },
        };
      },
    );

    updateActiveBannerData({ bannerSlides: updatedSlides });
  };

  const addBannerSlide = () => {
    const nextIndex = (activeBannerData?.bannerSlides ?? []).length + 1;
    const firstSlide = activeBannerData?.bannerSlides?.[0];
    const categoryImage =
      firstSlide?.image ?? activeBannerData?.backgroundImage ?? "/bg1.jpg";
    const categoryVideo =
      firstSlide?.video ?? activeBannerData?.backgroundVideo ?? "/video.mp4";
    const updatedSlides = [
      ...(activeBannerData?.bannerSlides ?? []),
      {
        image: categoryImage,
        ...(isVideoSliderBanner ? { video: categoryVideo } : {}),
        alt: `Banner slide ${nextIndex}`,
        title: "New banner slide",
        desc: "Update this slide text from Banner Content.",
        button: {
          label: "Learn more",
          href: "#",
          variant: "primary" as const,
        },
      },
    ];

    updateActiveBannerData({ bannerSlides: updatedSlides });
  };

  const deleteBannerSlide = (index: number) => {
    const updatedSlides = (activeBannerData?.bannerSlides ?? []).filter(
      (_, slideIndex) => slideIndex !== index,
    );

    updateActiveBannerData({ bannerSlides: updatedSlides });
  };

  const updateFooterBackgroundType = (type: FooterBackgroundType) => {
    updateActiveFooterData({ footerBackgroundType: type });
  };

  const updateFooterSolidColor = (color: string) => {
    updateActiveFooterData({ footerBackgroundColor: color });
  };

  const updateFooterGradientColor = (color: string) => {
    updateActiveFooterData({ footerGradientColor: color });
  };

  const updateFooterTextColor = (color: string) => {
    updateActiveFooterData({ footerTextColor: color });
  };

  const updateFooterLogoImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateActiveFooterData({ logoImage: reader.result, logoImageTitle: file.name });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const updateFooterColumn = (columnIndex: number, field: "title", value: string) => {
    const columns = [...(activeFooterData?.footerColumns ?? [])];
    columns[columnIndex] = { ...columns[columnIndex], [field]: value };
    updateActiveFooterData({ footerColumns: columns });
  };

  const updateFooterLink = (columnIndex: number, linkIndex: number, field: "label" | "href", value: string) => {
    const columns = [...(activeFooterData?.footerColumns ?? [])];
    const column = columns[columnIndex];
    if (!column) return;
    const links = [...column.links];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    columns[columnIndex] = { ...column, links };
    updateActiveFooterData({ footerColumns: columns });
  };

  const addFooterLink = (columnIndex: number) => {
    const columns = [...(activeFooterData?.footerColumns ?? [])];
    const column = columns[columnIndex];
    if (!column) return;
    columns[columnIndex] = { ...column, links: [...column.links, { label: "New link", href: "#" }] };
    updateActiveFooterData({ footerColumns: columns });
  };

  const removeFooterLink = (columnIndex: number, linkIndex: number) => {
    const columns = [...(activeFooterData?.footerColumns ?? [])];
    const column = columns[columnIndex];
    if (!column) return;
    columns[columnIndex] = { ...column, links: column.links.filter((_, index) => index !== linkIndex) };
    updateActiveFooterData({ footerColumns: columns });
  };

  const updateFooterExternalLink = (
    field: "whatsappLink" | "callLink",
    value: string,
  ) => {
    updateActiveFooterData({ [field]: value });
  };

  const addDropdownItem = (menuIndex: number) => {
    const currentDropdowns = menuItems[menuIndex]?.children ?? [];

    if (currentDropdowns.length >= MAX_DROPDOWN_LINKS) return;

    const updatedMenu = menuItems.map((item, itemIndex) =>
      itemIndex === menuIndex
        ? {
            ...item,
            children: [
              ...(item.children ?? []),
              { label: "Dropdown Item", href: "" },
            ],
          }
        : item,
    );

    updateActiveHeaderData({ menu: updatedMenu });
  };

  const updateDropdownItem = (
    menuIndex: number,
    childIndex: number,
    field: keyof MenuItem,
    value: string,
  ) => {
    const nextValue = field === "label" ? limitLinkText(value) : value;
    const updatedMenu = menuItems.map((item, itemIndex) => {
      if (itemIndex !== menuIndex) return item;

      const updatedChildren = (item.children ?? []).map(
        (child, currentChildIndex) =>
          currentChildIndex === childIndex
            ? { ...child, [field]: nextValue }
            : child,
      );

      return { ...item, children: updatedChildren };
    });

    updateActiveHeaderData({ menu: updatedMenu });
  };

  const deleteDropdownItem = (menuIndex: number, childIndex: number) => {
    const updatedMenu = menuItems.map((item, itemIndex) => {
      if (itemIndex !== menuIndex) return item;

      const updatedChildren = (item.children ?? []).filter(
        (_, currentChildIndex) => currentChildIndex !== childIndex,
      );

      return {
        ...item,
        children: updatedChildren.length ? updatedChildren : undefined,
      };
    });

    updateActiveHeaderData({ menu: updatedMenu });
  };

  const deleteMenuItem = (index: number) => {
    const updatedMenu = menuItems.filter((_, itemIndex) => itemIndex !== index);

    updateActiveHeaderData({ menu: updatedMenu });
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveMenuItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedMenu = [...menuItems];
    const [movedItem] = updatedMenu.splice(fromIndex, 1);
    updatedMenu.splice(toIndex, 0, movedItem);

    updateActiveHeaderData({ menu: updatedMenu });
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[10050]"
      onPointerUp={handleModalPointerUp}
      onPointerCancel={handleModalPointerUp}
    >
      <div
        className={`pointer-events-auto fixed h-[min(74vh,490px)] w-[min(calc(100vw-2rem),880px)] cursor-grab flex-col overflow-hidden rounded-3xl bg-[#f4f4f5] shadow-2xl animate-editor-pop active:cursor-grabbing ${
          generationText ? "hidden" : "flex"
        }`}
        style={{
          left: `calc((100vw - min(calc(100vw - 2rem), 880px)) / 2 + ${modalPosition.x}px)`,
          top: `calc(20vh + ${modalPosition.y}px)`,
          touchAction: dragStart ? "none" : "auto",
        }}
        onPointerDown={handleModalPointerDown}
      >
        <div
          className={`relative flex items-center justify-between border-b border-gray-400 px-5 py-3 ${
            dragStart ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <h3 className={`${agrandirBolt.className} font-medium text-2xl`}>
            {formatSectionTitle(sectionType)}
          </h3>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen((open) => !open)}
            className="rounded-md p-2 text-gray-950 lg:hidden"
            aria-label={
              mobileSidebarOpen ? "Close settings menu" : "Open settings menu"
            }
            aria-expanded={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1">
          {mobileSidebarOpen && (
            <aside className="absolute inset-y-0 left-0 z-30 flex w-56 flex-col rounded-r-2xl border-r border-gray-400 bg-white p-3 shadow-xl lg:hidden">
              <div className="mb-2 flex items-center justify-between underline">
                <h3
                  className={`${generalSansMedium.className} text-sm font-semibold`}
                >
                  Settings
                </h3>
              </div>

              <SidebarContent
                items={visibleSidebarItems}
                activeTab={activeTab}
                setActiveTab={handleSidebarTabChange}
              />
            </aside>
          )}

          <aside className="hidden h-full min-h-0 w-56 shrink-0 flex-col border-r border-gray-400 bg-white p-3 lg:flex">
            <div className="mb-2 flex items-center justify-between underline">
              <h3
                className={`${generalSansMedium.className} text-sm font-semibold`}
              >
                Settings
              </h3>
            </div>

            <SidebarContent
              items={visibleSidebarItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
            {!usesSectionColorPanel && (
              <div className="mb-3 flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-2 sm:flex-row">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {activeTab}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Customize {activeTab.toLowerCase()} settings
                  </p>
                </div>

                {false &&
                  activeSectionType === "Header" &&
                  activeTab === "Header Layout" && (
                    <div className="relative flex w-full flex-wrap items-center gap-3 sm:w-auto sm:shrink-0 sm:gap-5">
                      {headerBackgroundType === "solid" ? (
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-950">
                          Change color
                          <span
                            className="h-5 w-5 rounded-full border-2 border-gray-400"
                            style={{ background: headerSolidColor }}
                          />
                          <input
                            type="color"
                            value={headerSolidColor}
                            onChange={(event) =>
                              updateHeaderSolidColor(event.target.value)
                            }
                            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                            aria-label="Header solid color"
                          />
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setColorPanelOpen((open) => !open)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-950"
                        >
                          Change color
                          <span
                            className="h-5 w-10 rounded-full border-2 border-gray-400"
                            style={{ background: headerPreviewBackground }}
                          />
                        </button>
                      )}

                      {(["solid", "gradient"] as const).map((type) => {
                        const isActive = headerBackgroundType === type;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateHeaderBackgroundType(type)}
                            className={`min-w-24 rounded-lg border px-5 py-1.5 text-sm font-semibold capitalize text-gray-950 transition ${
                              isActive
                                ? "border-gray-300 bg-white shadow-sm"
                                : "border-gray-500 bg-transparent hover:bg-white"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}

                      {headerBackgroundType === "gradient" &&
                        colorPanelOpen && (
                          <div className="absolute right-0 top-11 z-20 grid w-72 grid-cols-2 gap-6 rounded-xl border border-gray-300 bg-white p-4 pt-7 shadow-xl">
                            <button
                              type="button"
                              onClick={() => setColorPanelOpen(false)}
                              className="absolute right-3 top-2 rounded-full p-1 text-gray-950 hover:bg-gray-100"
                              aria-label="Close gradient color picker"
                            >
                              <X size={18} />
                            </button>

                            <label className="space-y-4 text-sm font-semibold text-gray-950">
                              <span className="underline">Left Side</span>
                              <span className="flex items-center justify-between gap-3">
                                Color
                                <input
                                  type="color"
                                  value={headerSolidColor}
                                  onChange={(event) =>
                                    updateHeaderSolidColor(event.target.value)
                                  }
                                  className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                                  aria-label="Header gradient left color"
                                />
                              </span>
                            </label>

                            <label className="space-y-4 text-sm font-semibold text-gray-950">
                              <span className="underline">Right Side</span>
                              <span className="flex items-center justify-between gap-3">
                                Color
                                <input
                                  type="color"
                                  value={headerGradientColor}
                                  onChange={(event) =>
                                    updateHeaderGradientColor(
                                      event.target.value,
                                    )
                                  }
                                  className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                                  aria-label="Header gradient right color"
                                />
                              </span>
                            </label>
                          </div>
                        )}
                    </div>
                  )}

                {false &&
                  activeSectionType === "Footer" &&
                  activeTab === "Footer Layout" && (
                    <div className="relative flex w-full flex-wrap items-center gap-3 sm:w-auto sm:shrink-0 sm:gap-5">
                      {footerBackgroundType === "solid" ? (
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-950">
                          Change color
                          <span
                            className="h-5 w-5 rounded-full border-2 border-gray-400"
                            style={{ background: footerSolidColor }}
                          />
                          <input
                            type="color"
                            value={footerSolidColor}
                            onChange={(event) =>
                              updateFooterSolidColor(event.target.value)
                            }
                            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                            aria-label="Footer solid color"
                          />
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setColorPanelOpen((open) => !open)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-950"
                        >
                          Change color
                          <span
                            className="h-5 w-10 rounded-full border-2 border-gray-400"
                            style={{ background: footerPreviewBackground }}
                          />
                        </button>
                      )}

                      {(["solid", "gradient"] as const).map((type) => {
                        const isActive = footerBackgroundType === type;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateFooterBackgroundType(type)}
                            className={`min-w-24 rounded-lg border px-5 py-1.5 text-sm font-semibold capitalize text-gray-950 transition ${
                              isActive
                                ? "border-gray-300 bg-white shadow-sm"
                                : "border-gray-500 bg-transparent hover:bg-white"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}

                      {footerBackgroundType === "gradient" &&
                        colorPanelOpen && (
                          <div className="absolute right-0 top-11 z-20 grid w-72 grid-cols-2 gap-6 rounded-xl border border-gray-300 bg-white p-4 pt-7 shadow-xl">
                            <button
                              type="button"
                              onClick={() => setColorPanelOpen(false)}
                              className="absolute right-3 top-2 rounded-full p-1 text-gray-950 hover:bg-gray-100"
                              aria-label="Close footer gradient color picker"
                            >
                              <X size={18} />
                            </button>

                            <label className="space-y-4 text-sm font-semibold text-gray-950">
                              <span className="underline">Left Side</span>
                              <span className="flex items-center justify-between gap-3">
                                Color
                                <input
                                  type="color"
                                  value={footerSolidColor}
                                  onChange={(event) =>
                                    updateFooterSolidColor(event.target.value)
                                  }
                                  className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                                  aria-label="Footer gradient left color"
                                />
                              </span>
                            </label>

                            <label className="space-y-4 text-sm font-semibold text-gray-950">
                              <span className="underline">Right Side</span>
                              <span className="flex items-center justify-between gap-3">
                                Color
                                <input
                                  type="color"
                                  value={footerGradientColor}
                                  onChange={(event) =>
                                    updateFooterGradientColor(
                                      event.target.value,
                                    )
                                  }
                                  className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                                  aria-label="Footer gradient right color"
                                />
                              </span>
                            </label>
                          </div>
                        )}
                    </div>
                  )}
              </div>
            )}

            {activeSectionType === "Topbar" &&
              activeTab === "Topbar Layout" && (
                <div className="space-y-4">
                  <SectionColorPanel
                    title="Topbar Layout"
                    sectionTypeLabel="Topbar Type"
                    stickyType={topbarType}
                    backgroundType={topbarBackgroundType}
                    backgroundColor={topbarSolidColor}
                    gradientColor={topbarGradientColor}
                    textColor={topbarTextColor}
                    onStickyTypeChange={updateTopbarType}
                    onBackgroundTypeChange={updateTopbarBackgroundType}
                    onBackgroundColorChange={updateTopbarSolidColor}
                    onGradientColorChange={updateTopbarGradientColor}
                    onTextColorChange={updateTopbarTextColor}
                  />

                  {sectionLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div
                          className="flex h-20 items-center justify-between px-5"
                          style={{
                            background: topbarPreviewBackground,
                            color: topbarTextColor,
                          }}
                        >
                          <div className="h-2 w-32 rounded bg-current opacity-80" />
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-20 rounded bg-current opacity-70" />
                            <div className="h-2 w-24 rounded bg-current opacity-70" />
                            <div className="flex gap-2">
                              <div className="h-4 w-4 rounded-full bg-current opacity-80" />
                              <div className="h-4 w-4 rounded-full bg-current opacity-80" />
                              <div className="h-4 w-4 rounded-full bg-current opacity-80" />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "Topbar" &&
              activeTab === "Topbar Content" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-gray-900">Topbar Text</label>
                      <VisibilityButton hidden={isTopbarFieldHidden("text")} onClick={() => toggleTopbarFieldVisibility("text")} />
                    </div>
                    <input
                      value={activeTopbarData?.text?.[0] ?? ""}
                      onChange={(event) => updateTopbarText(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                      placeholder="Enter topbar text"
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {(["phone", "email", "location"] as const).map((field) => (
                      <div
                        key={field}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="block text-sm font-semibold capitalize text-gray-900">{field}</label>
                          <VisibilityButton hidden={isTopbarFieldHidden(field)} onClick={() => toggleTopbarFieldVisibility(field)} />
                        </div>
                        <input
                          value={activeTopbarData?.[field] ?? ""}
                          onChange={(event) =>
                            updateTopbarField(field, event.target.value)
                          }
                          className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                          placeholder={`Enter ${field}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          Social Icons
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          You can add up to {MAX_TOPBAR_SOCIAL_LINKS} social
                          icons.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addTopbarSocialLink}
                        disabled={
                          topbarSocialLinks.length >= MAX_TOPBAR_SOCIAL_LINKS
                        }
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <Plus size={14} />
                        Add Icon
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <VisibilityButton hidden={isTopbarFieldHidden("socialLinks")} onClick={() => toggleTopbarFieldVisibility("socialLinks")} />
                    </div>

                    <div className="space-y-3">
                      {topbarSocialLinks.map((socialLink, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-300 bg-white p-3 shadow-sm lg:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_3.5rem]"
                        >
                          <select
                            value={socialLink.label}
                            onChange={(event) =>
                              updateTopbarSocialLink(
                                index,
                                "label",
                                event.target.value as SocialLinkData["label"],
                              )
                            }
                            className="h-11 rounded-lg border border-gray-300 px-4 text-sm capitalize outline-none focus:border-blue-600"
                          >
                            {socialLinkLabels.map((socialName) => (
                              <option key={socialName} value={socialName}>
                                {socialName}
                              </option>
                            ))}
                          </select>

                          <input
                            value={socialLink.href}
                            onChange={(event) =>
                              updateTopbarSocialLink(
                                index,
                                "href",
                                event.target.value,
                              )
                            }
                            className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                            placeholder="Social link"
                          />

                          <button
                            type="button"
                            onClick={() => deleteTopbarSocialLink(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 bg-white text-red-600"
                            aria-label="Delete social icon"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {activeSectionType === "Header" &&
              activeTab === "Header Content" && (
                <div className="space-y-5">
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      Logo
                    </h4>

                    <label className="block text-sm font-semibold text-gray-900">
                      Logo Text
                    </label>
                    <input
                      value={activeHeaderData?.logo ?? ""}
                      onChange={(event) => updateHeaderLogo(event.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                      placeholder="Enter logo text"
                    />

                    <div className="space-y-2">
                      <span className="block text-sm font-semibold text-gray-900">
                        Logo Image
                      </span>
                      <label className="flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 transition hover:border-blue-500">
                        <span className="font-medium">
                          {activeHeaderData?.logoImage
                            ? "Change logo image"
                            : "Upload logo image"}
                        </span>
                        <span className="max-w-[55%] truncate text-xs text-slate-500">
                          {activeHeaderData?.logoImageTitle ??
                            activeHeaderData?.logoImage ??
                            "No image selected"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={updateHeaderLogoImage}
                          className="sr-only"
                        />
                      </label>

                      {activeHeaderData?.logoImage && (
                        <button
                          type="button"
                          onClick={deleteHeaderLogoImage}
                          className="rounded-md border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove logo image
                        </button>
                      )}
                      <input
                        value={activeHeaderData?.logoImageTitle ?? ""}
                        onChange={(event) =>
                          updateActiveHeaderData({
                            logoImageTitle: event.target.value,
                          })
                        }
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                        placeholder="Logo image alt text"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Header Buttons
                        </h4>
                        <p className="mt-1 text-xs text-gray-700 underline">
                          Manage header action buttons.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addHeaderButton}
                        disabled={
                          (activeHeaderData?.buttons ?? []).length >=
                          MAX_HEADER_BUTTONS
                        }
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <Plus size={14} />
                        Add Button
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      {(activeHeaderData?.buttons ?? []).length}/
                      {MAX_HEADER_BUTTONS} header buttons added
                    </p>

                    <div className="space-y-3">
                      {(activeHeaderData?.buttons ?? []).map((button, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-300 bg-white p-3 shadow-sm lg:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_3.5rem]"
                        >
                          <input
                            value={button.label}
                            onChange={(event) =>
                              updateHeaderButton(
                                index,
                                "label",
                                event.target.value,
                              )
                            }
                            className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                            placeholder="Button label"
                          />

                          <input
                            value={button.href}
                            onChange={(event) =>
                              updateHeaderButton(
                                index,
                                "href",
                                event.target.value,
                              )
                            }
                            className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                            placeholder="/link"
                          />

                          <select
                            value={button.variant ?? "primary"}
                            onChange={(event) =>
                              updateHeaderButton(
                                index,
                                "variant",
                                event.target.value,
                              )
                            }
                            className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
                            aria-label="Header button style"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => deleteHeaderButton(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 bg-white text-red-600"
                            aria-label="Delete header button"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {activeSectionType === "Header" &&
              activeTab === "Header Layout" && (
                <div className="space-y-4">
                  <SectionColorPanel
                    title="Header Layout"
                    sectionTypeLabel="Header Type"
                    stickyType={headerType}
                    backgroundType={headerBackgroundType}
                    backgroundColor={headerSolidColor}
                    gradientColor={headerGradientColor}
                    textColor={headerTextColor}
                    onStickyTypeChange={updateHeaderType}
                    onBackgroundTypeChange={updateHeaderBackgroundType}
                    onBackgroundColorChange={updateHeaderSolidColor}
                    onGradientColorChange={updateHeaderGradientColor}
                    onTextColorChange={updateHeaderTextColor}
                  />

                  {sectionLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div className="h-20 bg-gray-100">
                          {layout.id === "Header-1" && (
                            <div className="h-full">
                              <div
                                className="flex h-10 items-center justify-between px-4"
                                style={{
                                  background: headerPreviewBackground,
                                  color: headerTextColor,
                                }}
                              >
                                <div className="h-2 w-14 rounded bg-current" />
                                <div className="flex gap-3">
                                  <div className="h-1.5 w-9 rounded bg-current" />
                                  <div className="h-1.5 w-9 rounded bg-current" />
                                  <div className="h-1.5 w-9 rounded bg-current" />
                                </div>
                                <div className="h-5 w-12 rounded-md bg-blue-600" />
                              </div>
                            </div>
                          )}

                          {layout.id === "Header-2" && (
                            <div
                              className="flex h-full items-start justify-between px-4 py-4"
                              style={{
                                background: headerPreviewBackground,
                                color: headerTextColor,
                              }}
                            >
                              <div className="h-2 w-16 rounded bg-current" />
                              <div className="flex gap-3">
                                <div className="h-1.5 w-9 rounded bg-current" />
                                <div className="h-1.5 w-9 rounded bg-current" />
                                <div className="h-1.5 w-9 rounded bg-current" />
                              </div>
                              <div className="h-5 w-12 rounded-md bg-blue-600" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "Banner" &&
              activeTab === "Banner Content" && (
                <div className="space-y-4">
                  <input
                    ref={bannerImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageFileChange}
                    className="hidden"
                    aria-label="Choose banner image"
                  />
                  <input
                    ref={bannerVideoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleBannerVideoFileChange}
                    className="hidden"
                    aria-label="Choose banner video"
                  />

                  {isSimpleBanner && "pretitle" in (activeBannerData ?? {}) && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <label className="block text-sm font-semibold text-gray-900">
                        Pretitle
                      </label>
                      <input
                        value={activeBannerData?.pretitle ?? ""}
                        onChange={(event) =>
                          updateBannerField("pretitle", event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                        placeholder="Enter banner pretitle"
                      />
                    </div>
                  )}

                  {isSimpleBanner && "title" in (activeBannerData ?? {}) && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <label className="block text-sm font-semibold text-gray-900">
                        Title
                      </label>
                      <input
                        value={activeBannerData?.title ?? ""}
                        onChange={(event) =>
                          updateBannerField("title", event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                        placeholder="Enter banner title"
                      />
                    </div>
                  )}

                  {isSimpleBanner && "desc" in (activeBannerData ?? {}) && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <label className="block text-sm font-semibold text-gray-900">
                        Description
                      </label>
                      <textarea
                        value={activeBannerData?.desc ?? ""}
                        onChange={(event) =>
                          updateBannerField("desc", event.target.value)
                        }
                        className="mt-2 min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-600"
                        placeholder="Enter banner description"
                      />
                    </div>
                  )}

                  {activeVariant === "Banner-2" &&
                    "overlayColor" in (activeBannerData ?? {}) && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <ColorInput
                          label="Overlay Color"
                          value={activeBannerData?.overlayColor ?? "#000000"}
                          onChange={(color) =>
                            updateBannerField("overlayColor", color)
                          }
                        />
                    </div>
                  )}

                  {isSliderBanner && hasBannerSlidesField && (
                    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Banner Slider
                        </h4>
                        <button
                          type="button"
                          onClick={addBannerSlide}
                          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white"
                        >
                          <Plus size={14} />
                          Add Slide
                        </button>
                      </div>

                      {(activeBannerData?.bannerSlides ?? []).map(
                        (slide, index) => (
                          <div
                            key={index}
                            className="space-y-3 rounded-xl border border-gray-300 bg-white p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h5 className="text-sm font-semibold text-gray-900">
                                Slide {index + 1}
                              </h5>
                              <button
                                type="button"
                                onClick={() => deleteBannerSlide(index)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 bg-white text-red-600"
                                aria-label="Delete banner slide"
                              >
                                <Trash size={18} />
                              </button>
                            </div>

                            {!isVideoSliderBanner && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                  Slide Image
                                </label>
                                <label className="mt-2 flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 transition hover:border-blue-500 focus-within:border-blue-600">
                                  <span className="font-medium">
                                    {slide.image
                                      ? "Change image"
                                      : "Upload image"}
                                  </span>
                                  <span className="max-w-[55%] truncate text-xs text-gray-500">
                                    {getMediaUploadLabel(slide.image, "image")}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                      handleBannerSlideImageFileChange(
                                        index,
                                        event,
                                      )
                                    }
                                    className="sr-only"
                                    aria-label={`Choose slide ${index + 1} image`}
                                  />
                                </label>
                              </div>
                            )}

                            {isVideoSliderBanner && (
                              <div>
                                <div className="flex items-center justify-between gap-3">
                                  <label className="block text-sm font-semibold text-gray-900">
                                    Slide Video
                                  </label>
                                  {slide.video && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteBannerSlideVideo(index)
                                      }
                                      className="rounded-md border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      Delete video
                                    </button>
                                  )}
                                </div>
                                <label className="mt-2 flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 transition hover:border-blue-500 focus-within:border-blue-600">
                                  <span className="font-medium">
                                    {slide.video
                                      ? "Change video"
                                      : "Upload video"}
                                  </span>
                                  <span className="max-w-[55%] truncate text-xs text-gray-500">
                                    {getMediaUploadLabel(
                                      slide.video ?? "",
                                      "video",
                                    )}
                                  </span>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(event) =>
                                      handleBannerSlideVideoFileChange(
                                        index,
                                        event,
                                      )
                                    }
                                    className="sr-only"
                                    aria-label={`Choose slide ${index + 1} video`}
                                  />
                                </label>
                              </div>
                            )}

                            {isVideoSliderBanner && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                  Poster Image URL
                                </label>
                                <input
                                  value={slide.image}
                                  onChange={(event) =>
                                    updateBannerSlide(
                                      index,
                                      "image",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                                  placeholder="/poster.jpg"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-semibold text-gray-900">
                                Slide Image Alt Text
                              </label>
                              <input
                                value={slide.alt ?? ""}
                                onChange={(event) =>
                                  updateBannerSlide(
                                    index,
                                    "alt",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                                placeholder="Describe this slide image"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-900">
                                Slide Title
                              </label>
                              <input
                                value={slide.title}
                                onChange={(event) =>
                                  updateBannerSlide(
                                    index,
                                    "title",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                                placeholder="Enter slide title"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-900">
                                Slide Description
                              </label>
                              <textarea
                                value={slide.desc ?? ""}
                                onChange={(event) =>
                                  updateBannerSlide(
                                    index,
                                    "desc",
                                    event.target.value,
                                  )
                                }
                                className="mt-2 min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-600"
                                placeholder="Enter slide description"
                              />
                            </div>

                            <div className="grid gap-3 lg:grid-cols-3">
                              <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                  Button Label
                                </label>
                                <input
                                  value={slide.button?.label ?? ""}
                                  onChange={(event) =>
                                    updateBannerSlideButton(
                                      index,
                                      "label",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                                  placeholder="Learn more"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                  Button Link
                                </label>
                                <input
                                  value={slide.button?.href ?? ""}
                                  onChange={(event) =>
                                    updateBannerSlideButton(
                                      index,
                                      "href",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                                  placeholder="#"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                  Button Style
                                </label>
                                <select
                                  value={slide.button?.variant ?? "primary"}
                                  onChange={(event) =>
                                    updateBannerSlideButton(
                                      index,
                                      "variant",
                                      event.target.value,
                                    )
                                  }
                                  className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                                >
                                  <option value="primary">Primary</option>
                                  <option value="secondary">Secondary</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </section>
                  )}

                  {isSimpleBanner && hasBannerMediaField && (
                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Banner Media
                      </h4>

                      {hasBannerImageField && (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900">
                              Background Image
                            </label>
                            <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  bannerImageInputRef.current?.click()
                                }
                                className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 transition hover:border-blue-500 focus:border-blue-600 focus:outline-none"
                              >
                                <span className="font-medium">
                                  {activeBannerData?.backgroundImage
                                    ? "Change image"
                                    : "Upload image"}
                                </span>
                                <span className="max-w-[55%] truncate text-xs text-gray-500">
                                  {getMediaUploadLabel(
                                    activeBannerData?.backgroundImage ?? "",
                                    "image",
                                  )}
                                </span>
                              </button>
                              <MediaUploadPreview
                                src={activeBannerData?.backgroundImage ?? ""}
                                type="image"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-900">
                              Image Alt Text
                            </label>
                            <input
                              value={
                                activeBannerData?.backgroundImageTitle ?? ""
                              }
                              onChange={(event) =>
                                updateBannerField(
                                  "backgroundImageTitle",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                              placeholder="Banner image"
                            />
                          </div>
                        </div>
                      )}

                      {hasBannerVideoField && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between gap-3">
                            <label className="block text-sm font-semibold text-gray-900">
                              Background Video
                            </label>
                            {activeBannerData?.backgroundVideo && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateBannerField("backgroundVideo", "")
                                }
                                className="rounded-md border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Delete video
                              </button>
                            )}
                          </div>
                          <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center">
                            <button
                              type="button"
                              onClick={() => bannerVideoInputRef.current?.click()}
                              className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm text-gray-900 transition hover:border-blue-500 focus:border-blue-600 focus:outline-none"
                            >
                              <span className="font-medium">
                                {activeBannerData?.backgroundVideo
                                  ? "Change video"
                                  : "Upload video"}
                              </span>
                              <span className="max-w-[55%] truncate text-xs text-gray-500">
                                {getMediaUploadLabel(
                                  activeBannerData?.backgroundVideo ?? "",
                                  "video",
                                )}
                              </span>
                            </button>
                            <MediaUploadPreview
                              src={activeBannerData?.backgroundVideo ?? ""}
                              type="video"
                            />
                          </div>
                        </div>
                      )}

                      {hasBannerColorField && (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <ColorInput
                            label={
                              bannerBackgroundMode === "gradient"
                                ? "Background left"
                                : "Background color"
                            }
                            value={bannerSolidColor}
                            onChange={(color) =>
                              updateBannerField("bannerBackgroundColor", color)
                            }
                          />

                          {bannerBackgroundMode === "gradient" && (
                            <ColorInput
                              label="Background right"
                              value={bannerGradientColor}
                              onChange={(color) =>
                                updateBannerField("bannerGradientColor", color)
                              }
                            />
                          )}
                        </div>
                      )}
                    </section>
                  )}

                  {hasBannerHeightField && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-gray-900">
                          Banner Height
                        </label>
                        <input
                          type="number"
                          min={40}
                          max={100}
                          value={bannerHeight}
                          onChange={(event) =>
                            updateBannerHeight(Number(event.target.value))
                          }
                          className="h-10 w-24 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-600"
                        />
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={bannerHeight}
                        onChange={(event) =>
                          updateBannerHeight(Number(event.target.value))
                        }
                        className="mt-4 w-full accent-blue-600"
                      />
                    </div>
                  )}

                  {isSimpleBanner && hasBannerButtonsField && (
                    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Banner Buttons
                        </h4>

                        <button
                          type="button"
                          onClick={addBannerButton}
                          disabled={
                            (activeBannerData?.buttons ?? []).length >=
                            MAX_BANNER_BUTTONS
                          }
                          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          <Plus size={14} />
                          Add Button
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        {(activeBannerData?.buttons ?? []).length}/
                        {MAX_BANNER_BUTTONS} banner buttons added
                      </p>

                      <div className="space-y-3">
                        {(activeBannerData?.buttons ?? []).map(
                          (button, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-1 gap-3 rounded-xl border border-gray-300 bg-white p-3 shadow-sm lg:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_3.5rem]"
                            >
                              <input
                                value={button.label}
                                onChange={(event) =>
                                  updateBannerButton(
                                    index,
                                    "label",
                                    event.target.value,
                                  )
                                }
                                className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                                placeholder="Button label"
                              />

                              <input
                                value={button.href}
                                onChange={(event) =>
                                  updateBannerButton(
                                    index,
                                    "href",
                                    event.target.value,
                                  )
                                }
                                className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                                placeholder="/link"
                              />

                              <select
                                value={button.variant ?? "primary"}
                                onChange={(event) =>
                                  updateBannerButton(
                                    index,
                                    "variant",
                                    event.target.value,
                                  )
                                }
                                className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
                                aria-label="Banner button style"
                              >
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => deleteBannerButton(index)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 bg-white text-red-600"
                                aria-label="Delete banner button"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {activeSectionType === "Banner" &&
              activeTab === "Banner Layout" && (
                <div className="space-y-4">
                  {sectionLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div className="h-28 bg-gray-100">
                          {layout.id === "Banner-1" && (
                            <div className="relative flex h-full items-center overflow-hidden bg-slate-900 px-5">
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${
                                    activeBannerData?.backgroundImage ??
                                    "/bg1.jpg"
                                  })`,
                                }}
                              />
                              <div className="absolute inset-0 bg-black/45" />
                              <div className="relative z-10 w-2/3 space-y-2">
                                <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                                  Image Banner
                                </span>
                                <div className="h-1.5 w-24 rounded bg-white/70" />
                                <div className="h-3 w-40 rounded bg-white" />
                                <div className="h-1.5 w-full rounded bg-white/60" />
                                <div className="h-1.5 w-4/5 rounded bg-white/60" />
                                <div className="h-5 w-16 rounded-md bg-blue-600" />
                              </div>
                            </div>
                          )}

                          {layout.id === "Banner-2" && (
                            <div className="relative flex h-full items-center justify-center overflow-hidden bg-slate-950 px-5 text-center">
                              <video
                                className="absolute inset-0 h-full w-full object-cover opacity-70"
                                src={activeBannerData?.backgroundVideo || "/video.mp4"}
                                muted
                                loop
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/45" />
                              <div className="relative z-10 w-2/3 space-y-3">
                                <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                                  Video Banner
                                </span>
                                <div className="mx-auto h-4 w-40 rounded bg-white" />
                                <div className="mx-auto h-2 w-full rounded bg-white/70" />
                                <div className="mx-auto h-2 w-4/5 rounded bg-white/70" />
                                <div className="mx-auto h-6 w-20 rounded-md bg-blue-600" />
                              </div>
                            </div>
                          )}

                          {layout.id === "Banner-3" && (
                            <div className="relative flex h-full items-center overflow-hidden bg-slate-900 px-5">
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${
                                    activeBannerData?.bannerSlides?.[0]
                                      ?.image ?? "/bg2.jpg"
                                  })`,
                                }}
                              />
                              <div className="absolute inset-0 bg-black/45" />
                              <div className="relative z-10 w-2/3 space-y-2">
                                <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                                  Image Slider
                                </span>
                                <div className="h-3 w-44 rounded bg-white" />
                                <div className="h-1.5 w-full rounded bg-white/60" />
                                <div className="h-1.5 w-4/5 rounded bg-white/60" />
                                <div className="h-5 w-20 rounded-md bg-blue-600" />
                              </div>
                              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                                <span className="h-1.5 w-6 rounded bg-white" />
                                <span className="h-1.5 w-1.5 rounded bg-white/50" />
                                <span className="h-1.5 w-1.5 rounded bg-white/50" />
                              </div>
                            </div>
                          )}

                          {layout.id === "Banner-4" && (
                            <div className="relative flex h-full items-center overflow-hidden bg-slate-900 px-5">
                              <video
                                className="absolute inset-0 h-full w-full object-cover opacity-70"
                                src={
                                  activeBannerData?.bannerSlides?.[0]?.video ||
                                  "/video.mp4"
                                }
                                poster={
                                  activeBannerData?.bannerSlides?.[0]?.image ||
                                  "/bg1.jpg"
                                }
                                muted
                                loop
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/45" />
                              <div className="relative z-10 w-2/3 space-y-2">
                                <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                                  Video Slider
                                </span>
                                <div className="h-3 w-44 rounded bg-white" />
                                <div className="h-1.5 w-full rounded bg-white/60" />
                                <div className="h-1.5 w-4/5 rounded bg-white/60" />
                                <div className="h-5 w-20 rounded-md bg-blue-600" />
                              </div>
                              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                                <span className="h-1.5 w-6 rounded bg-white" />
                                <span className="h-1.5 w-1.5 rounded bg-white/50" />
                                <span className="h-1.5 w-1.5 rounded bg-white/50" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "About" && activeTab === "About Layout" && (
              <div className="space-y-4">
                {activeAboutLayouts.map((layout) => {
                  const isActive = currentSection?.variant === layout.id;
                  const Component = getSectionComponent(
                    category,
                    activeSectionType,
                    layout.id,
                  );
                  const layoutData =
                    currentSection?.data?.[layout.id] ?? activeGenericData;
                  const usesGeneratedPagePreview =
                    isPageSection &&
                    !layout.id.startsWith(`${activeSectionType}Page-`);

                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => selectSectionVariant(layout.id)}
                      className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                        isActive ? "border-gray-400" : "border-gray-200"
                      }`}
                    >
                      <SelectedLayoutBadge active={isActive} title={layout.name} />
                      <div className="h-32 bg-gray-100">
                        {usesGeneratedPagePreview && Component && (
                          <div className="h-[520px] w-[1200px] origin-top-left scale-[0.28] bg-white">
                            <Component data={layoutData} />
                          </div>
                        )}

                        {layout.id === "AboutPage-1" && (
                          <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-3 bg-white p-4">
                            <div className="space-y-2">
                              <div className="h-2 w-20 rounded bg-blue-500" />
                              <div className="h-5 w-full rounded bg-slate-900" />
                              <div className="h-5 w-4/5 rounded bg-slate-900" />
                              <div className="mt-3 h-2 w-full rounded bg-slate-400" />
                              <div className="h-2 w-5/6 rounded bg-slate-400" />
                            </div>
                            <div className="rounded-2xl bg-slate-300" />
                          </div>
                        )}

                        {layout.id === "AboutPage-2" && (
                          <div className="grid h-full grid-cols-[0.9fr_1.1fr] gap-3 bg-slate-50 p-4">
                            <div className="rounded-2xl bg-slate-300" />
                            <div className="space-y-2">
                              <div className="h-2 w-20 rounded bg-blue-500" />
                              <div className="h-5 w-full rounded bg-slate-900" />
                              <div className="h-5 w-4/5 rounded bg-slate-900" />
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                <div className="h-8 rounded bg-white" />
                                <div className="h-8 rounded bg-white" />
                                <div className="h-8 rounded bg-white" />
                              </div>
                            </div>
                          </div>
                        )}

                        {layout.id === "AboutPage-3" && (
                          <div className="h-full bg-slate-950 p-4">
                            <div className="h-2 w-20 rounded bg-blue-300" />
                            <div className="mt-3 grid grid-cols-[1.1fr_0.9fr] gap-4">
                              <div className="space-y-2">
                                <div className="h-5 w-full rounded bg-white" />
                                <div className="h-5 w-4/5 rounded bg-white" />
                              </div>
                              <div className="space-y-2">
                                <div className="h-2 w-full rounded bg-white/50" />
                                <div className="h-2 w-5/6 rounded bg-white/50" />
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              <div className="h-7 rounded bg-white/10" />
                              <div className="h-7 rounded bg-white/10" />
                              <div className="h-7 rounded bg-white/10" />
                            </div>
                          </div>
                        )}

                        {layout.id === "About-1" && (
                          <div className="grid h-full grid-cols-2 overflow-hidden bg-[#fbfaf6]">
                            <div className="flex flex-col justify-center gap-2 px-5">
                              <div className="h-4 w-24 rounded bg-slate-900" />
                              <div className="h-2 w-full rounded bg-slate-400" />
                              <div className="h-2 w-4/5 rounded bg-slate-400" />
                              <div className="h-5 w-20 rounded-full bg-blue-600" />
                            </div>
                            <div className="bg-slate-300" />
                          </div>
                        )}

                        {layout.id === "About-2" && (
                          <div className="grid h-full grid-cols-[1fr_1.4fr_1fr] gap-3 bg-white p-4">
                            <div className="space-y-2">
                              <div className="h-5 w-16 rounded bg-slate-900" />
                              <div className="h-5 w-12 rounded bg-slate-900" />
                              <div className="mt-4 h-2 w-20 rounded bg-slate-500" />
                              <div className="h-2 w-24 rounded bg-slate-400" />
                            </div>
                            <div className="rounded-2xl bg-slate-300" />
                            <div className="space-y-3">
                              <div className="h-12 rounded-2xl bg-slate-300" />
                              <div className="h-3 w-20 rounded bg-slate-900" />
                              <div className="h-2 w-full rounded bg-slate-400" />
                              <div className="h-2 w-4/5 rounded bg-slate-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeSectionType === "Product" &&
              activeTab === "Product Layout" && (
                <div className="space-y-4">
                  {sectionLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div className="h-32 bg-gray-100">
                          {layout.id === "Product-1" && (
                            <div className="grid h-full grid-cols-[1fr_1.4fr_1fr] items-center gap-3 bg-blue-50 px-5">
                              <div className="space-y-2">
                                <div className="h-4 w-20 rounded bg-slate-900" />
                                <div className="h-2 w-16 rounded bg-slate-500" />
                                <div className="mt-4 h-16 rounded bg-white shadow-sm" />
                              </div>
                              <div className="mx-auto h-24 w-24 rounded-full bg-slate-300" />
                              <div className="space-y-2">
                                <div className="h-4 w-24 rounded bg-slate-900" />
                                <div className="h-2 w-full rounded bg-slate-400" />
                                <div className="h-2 w-4/5 rounded bg-slate-400" />
                              </div>
                            </div>
                          )}

                          {layout.id === "Product-2" && (
                            <div className="h-full bg-sky-100 p-4">
                              <div className="mx-auto mb-3 h-4 w-32 rounded bg-slate-900" />
                              <div className="grid h-20 grid-cols-3 gap-3">
                                <div className="rounded-lg border border-slate-400 bg-sky-50" />
                                <div className="rounded-lg border border-slate-400 bg-sky-50" />
                                <div className="rounded-lg border border-slate-400 bg-sky-50" />
                              </div>
                            </div>
                          )}

                          {layout.id === "Product-3" && (
                            <div className="grid h-full grid-cols-[1fr_1.1fr] gap-4 bg-[#0d1f2a] p-4">
                              <div className="space-y-2">
                                <div className="h-2 w-16 rounded bg-blue-200" />
                                <div className="h-5 w-full rounded bg-white" />
                                <div className="h-5 w-4/5 rounded bg-white" />
                                <div className="mt-3 h-3 w-24 rounded bg-blue-600" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-white/25" />
                                <div className="rounded-lg bg-white/25" />
                                <div className="rounded-lg bg-white/25" />
                                <div className="rounded-lg bg-white/25" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "FormDetail" &&
              activeTab === "Form Layout" && (
                <div className="space-y-4">
                  {sectionLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div className="grid h-32 grid-cols-[1fr_1fr] overflow-hidden bg-[#dfecea] p-3">
                          {layout.id === "FormDetail-1" ? (
                            <>
                              <div className="rounded-2xl bg-slate-900/85 p-4">
                                <div className="h-5 w-16 rounded-full bg-white/30" />
                                <div className="mt-8 h-3 w-24 rounded bg-white" />
                                <div className="mt-2 h-2 w-28 rounded bg-white/60" />
                              </div>
                              <div className="rounded-r-2xl bg-white p-4">
                                <div className="h-4 w-16 rounded bg-slate-900" />
                                <div className="mt-4 space-y-2">
                                  <div className="h-4 rounded-full bg-emerald-50" />
                                  <div className="h-4 rounded-full bg-emerald-50" />
                                  <div className="h-4 rounded-full bg-emerald-50" />
                                </div>
                                <div className="mt-3 h-5 rounded-full bg-emerald-800" />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-slate-100 p-4">
                                <div className="h-4 w-24 rounded bg-slate-900" />
                                <div className="mt-3 h-2 w-full rounded bg-slate-400" />
                                <div className="mt-2 h-2 w-4/5 rounded bg-slate-400" />
                              </div>
                              <div className="bg-white p-4">
                                <div className="space-y-2">
                                  <div className="h-5 rounded bg-slate-100" />
                                  <div className="h-5 rounded bg-slate-100" />
                                  <div className="h-8 rounded bg-blue-600" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "FormDetail" &&
              activeTab === "Form Content" && (
                <div className="space-y-5">
                  <section className="rounded-xl bg-[#f4f4f5] p-4">
                    <div className="grid gap-3">
                      {isContentFieldVisible("pretitle") && (
                        <input
                          value={activeFormDetailData?.pretitle ?? ""}
                          onChange={(event) =>
                            updateActiveFormDetailData({
                              pretitle: event.target.value,
                            })
                          }
                          className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                          placeholder="Eyebrow text"
                        />
                      )}
                      {isContentFieldVisible("title") && (
                        <input
                          value={activeFormDetailData?.title ?? ""}
                          onChange={(event) =>
                            updateActiveFormDetailData({
                              title: event.target.value,
                            })
                          }
                          className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                          placeholder="Form title"
                        />
                      )}
                      {isContentFieldVisible("desc") && (
                        <textarea
                          value={activeFormDetailData?.desc ?? ""}
                          onChange={(event) =>
                            updateActiveFormDetailData({
                              desc: event.target.value,
                            })
                          }
                          className="h-24 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
                          placeholder="Form description"
                        />
                      )}
                      {isContentFieldVisible("formSubmitLabel") && (
                        <input
                          value={activeFormDetailData?.formSubmitLabel ?? ""}
                          onChange={(event) =>
                            updateActiveFormDetailData({
                              formSubmitLabel: event.target.value,
                            })
                          }
                          className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                          placeholder="Submit button label"
                        />
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl bg-[#f4f4f5] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">
                        Form Fields
                      </h4>
                      <button
                        type="button"
                        onClick={addFormField}
                        disabled={
                          (activeFormDetailData?.formFields ?? []).length >=
                          MAX_FORM_FIELDS
                        }
                        className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        Add Field
                      </button>
                    </div>
                    <p className="-mt-2 mb-4 text-xs font-medium text-slate-500">
                      {(activeFormDetailData?.formFields ?? []).length}/
                      {MAX_FORM_FIELDS} fields added
                    </p>

                    <div className="space-y-3">
                      {(activeFormDetailData?.formFields ?? []).map(
                        (field, index) => (
                          <div
                            key={`${field.label}-${index}`}
                            className="grid gap-2 rounded-xl bg-white p-3"
                          >
                            <div className="grid gap-2 md:grid-cols-[1fr_1fr_130px_36px]">
                              <input
                                value={field.label}
                                onChange={(event) =>
                                  updateFormField(
                                    index,
                                    "label",
                                    event.target.value,
                                  )
                                }
                                className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
                                placeholder="Field label"
                              />
                              <input
                                value={field.placeholder ?? ""}
                                onChange={(event) =>
                                  updateFormField(
                                    index,
                                    "placeholder",
                                    event.target.value,
                                  )
                                }
                                className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
                                placeholder="Placeholder"
                              />
                              <select
                                value={field.type ?? "text"}
                                onChange={(event) =>
                                  updateFormField(
                                    index,
                                    "type",
                                    event.target.value,
                                  )
                                }
                                className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="textarea">Textarea</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => deleteFormField(index)}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500 text-red-600"
                                aria-label="Delete form field"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                </div>
              )}

            {[
              "About",
              "Service",
              "Product",
              "WhyChooseUs",
              "Gallery",
              "Contact",
              "FAQ",
              "Testimonial",
            ].includes(activeSectionType) &&
              activeTab.endsWith("Content") && (
                <div className="space-y-5">
                  {visibleGenericContentEntries.map(([key, value]) => (
                    <GenericFieldEditor
                      key={key}
                      fieldName={key}
                      value={value}
                      path={[key]}
                      sectionType={activeSectionType}
                      onChange={updateGenericField}
                      onMediaChange={updateGenericMedia}
                      onAddArrayItem={addGenericCollectionItem}
                      onDeleteArrayItem={deleteGenericCollectionItem}
                      availablePageNames={availablePageNames}
                    />
                  ))}
                </div>
              )}

            {["WhyChooseUs", "Service", "Gallery", "Contact", "FAQ", "Testimonial"].includes(activeSectionType) &&
              activeTab.endsWith("Layout") && (
                <div className="space-y-4">
                  {activeSectionType === "Gallery" && layoutOptions.length > 4 && (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Previous gallery layouts"
                        onClick={() =>
                          setGalleryLayoutStart(
                            (prev) =>
                              (prev - 1 + layoutOptions.length) %
                              layoutOptions.length,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next gallery layouts"
                        onClick={() =>
                          setGalleryLayoutStart(
                            (prev) => (prev + 1) % layoutOptions.length,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-slate-700 hover:bg-slate-100"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  )}

                  {visibleLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;
                    const Component = getSectionComponent(
                      category,
                      activeSectionType,
                      layout.id,
                    );
                    const layoutData =
                      currentSection?.data?.[layout.id] ?? activeGenericData;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div className="h-36 overflow-hidden bg-white">
                          {Component ? (
                            <div className="h-[520px] w-[1200px] origin-top-left scale-[0.32]">
                              <Component data={layoutData} />
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm font-semibold">
                              {layout.name}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "Footer" &&
              activeTab === "Footer Layout" && (
                <div className="space-y-4">
                  <SectionColorPanel
                    title="Footer Layout"
                    backgroundType={footerBackgroundType}
                    backgroundColor={footerSolidColor}
                    gradientColor={footerGradientColor}
                    textColor={footerTextColor}
                    onBackgroundTypeChange={updateFooterBackgroundType}
                    onBackgroundColorChange={updateFooterSolidColor}
                    onGradientColorChange={updateFooterGradientColor}
                    onTextColorChange={updateFooterTextColor}
                  />

                  {sectionLayoutOptions.map((layout) => {
                    const isActive = currentSection?.variant === layout.id;

                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => selectSectionVariant(layout.id)}
                        className={`relative w-full overflow-hidden rounded-2xl border bg-white text-left ${
                          isActive ? "border-gray-400" : "border-gray-200"
                        }`}
                      >
                        <SelectedLayoutBadge active={isActive} title={layout.name} />
                        <div
                          className="grid h-32 grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 p-4"
                          style={{
                            background: footerPreviewBackground,
                            color: footerTextColor,
                          }}
                        >
                          <div className="space-y-2">
                            <div className="h-4 w-20 rounded bg-current" />
                            <div className="h-2 w-full rounded bg-current opacity-60" />
                            <div className="h-2 w-4/5 rounded bg-current opacity-60" />
                            <div className="mt-4 flex gap-2">
                              <div className="h-5 w-5 rounded-full bg-current opacity-25" />
                              <div className="h-5 w-5 rounded-full bg-current opacity-25" />
                              <div className="h-5 w-5 rounded-full bg-current opacity-25" />
                            </div>
                          </div>
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="space-y-2">
                              <div className="h-3 w-16 rounded bg-current" />
                              <div className="h-2 w-20 rounded bg-current opacity-50" />
                              <div className="h-2 w-24 rounded bg-current opacity-50" />
                              <div className="h-2 w-16 rounded bg-current opacity-50" />
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {activeSectionType === "Footer" &&
              activeTab === "Footer Content" && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900">Footer logo</h3>
                    <p className="mt-1 text-xs text-gray-500">Use a text logo or upload an image.</p>
                    <label className="mt-4 block text-xs font-medium text-gray-700">Logo text</label>
                    <input
                      value={activeFooterData?.logo ?? ""}
                      onChange={(event) => updateActiveFooterData({ logo: event.target.value })}
                      className="mt-1 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                      placeholder="Your site name"
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                        Upload logo
                        <input type="file" accept="image/*" className="sr-only" onChange={updateFooterLogoImage} />
                      </label>
                      {activeFooterData?.logoImage && (
                        <button
                          type="button"
                          onClick={() => updateActiveFooterData({ logoImage: "", logoImageTitle: "" })}
                          className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove image
                        </button>
                      )}
                      <span className="text-xs text-gray-500">{activeFooterData?.logoImageTitle ?? "No image selected"}</span>
                    </div>
                    <input
                      value={activeFooterData?.logoImageTitle ?? ""}
                      onChange={(event) =>
                        updateActiveFooterData({
                          logoImageTitle: event.target.value,
                        })
                      }
                      className="mt-3 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                      placeholder="Logo image alt text"
                    />
                  </div>

                  {(activeFooterData?.footerColumns ?? []).map((column, columnIndex) => (
                    <div key={columnIndex} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900">Link column {columnIndex + 1}</h3>
                        <button type="button" onClick={() => addFooterLink(columnIndex)} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                          <Plus size={13} /> Add link
                        </button>
                      </div>
                      <input
                        value={column.title}
                        onChange={(event) => updateFooterColumn(columnIndex, "title", event.target.value)}
                        className="mt-3 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600"
                        placeholder="Column title"
                      />
                      <div className="mt-3 space-y-3">
                        {column.links.map((link, linkIndex) => (
                          <div key={linkIndex} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                            <input value={link.label} onChange={(event) => updateFooterLink(columnIndex, linkIndex, "label", event.target.value)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600" placeholder="Link text" />
                            <input value={link.href} onChange={(event) => updateFooterLink(columnIndex, linkIndex, "href", event.target.value)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-600" placeholder="/page or https://..." />
                            <button type="button" aria-label="Remove footer link" onClick={() => removeFooterLink(columnIndex, linkIndex)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                              <Trash size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                </div>
              )}

            {activeTab.endsWith("Content") &&
              automaticContentFields.length > 0 && (
                <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    Additional Content
                  </h4>
                  {automaticContentFields.map((field) => (
                    <GenericFieldEditor
                      key={field.path.join(".")}
                      fieldName={field.fieldName}
                      value={field.value}
                      path={field.path}
                      sectionType={activeSectionType}
                      onChange={updateGenericField}
                      onMediaChange={updateGenericMedia}
                      availablePageNames={availablePageNames}
                    />
                  ))}
                </section>
              )}

            {activeSectionType === "Footer" &&
              activeTab === "External Link" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-gray-900">
                        WhatsApp Link
                      </label>
                      {activeFooterData?.whatsappLink ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateFooterExternalLink("whatsappLink", "")
                          }
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateFooterExternalLink(
                              "whatsappLink",
                              DEFAULT_WHATSAPP_LINK,
                            )
                          }
                          className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Add
                        </button>
                      )}
                    </div>
                    <input
                      value={activeFooterData?.whatsappLink ?? ""}
                      onChange={(event) =>
                        updateFooterExternalLink(
                          "whatsappLink",
                          event.target.value,
                        )
                      }
                      className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                      placeholder="https://api.whatsapp.com/send?phone=962786336414"
                    />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-gray-900">
                        Call Link
                      </label>
                      {activeFooterData?.callLink ? (
                        <button
                          type="button"
                          onClick={() => updateFooterExternalLink("callLink", "")}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateFooterExternalLink(
                              "callLink",
                              DEFAULT_CALL_LINK,
                            )
                          }
                          className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Add
                        </button>
                      )}
                    </div>
                    <input
                      value={activeFooterData?.callLink ?? ""}
                      onChange={(event) =>
                        updateFooterExternalLink("callLink", event.target.value)
                      }
                      className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-600"
                      placeholder="tel:+919876543210"
                    />
                  </div>
                </div>
              )}

            {activeSectionType === "Header" &&
              activeTab === "Navigation Menu" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mt-1 text-xs text-gray-700 underline">
                        You can add up to {MAX_MENU_LINKS} menu links.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addMenuItem}
                      disabled={menuItems.length >= MAX_MENU_LINKS}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:bg-gray-300"
                    >
                      <Plus size={14} />
                      Add Nav Links
                    </button>
                  </div>

                  <div className="space-y-3">
                    {menuItems.map((item, index) => (
                      <div
                        key={index}
                        draggable={false}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedIndex !== null) {
                            moveMenuItem(draggedIndex, index);
                            setDraggedIndex(null);
                          }
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`cursor-grab rounded-xl border border-gray-300 bg-white p-2 shadow-sm ${
                          draggedIndex === index ? "opacity-50" : ""
                        }`}
                      >
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[2.5rem_minmax(8rem,1fr)_minmax(8rem,1fr)_7rem_3.25rem] lg:items-center">
                          <button
                            type="button"
                            draggable
                            onDragStart={() => setDraggedIndex(index)}
                            onDragEnd={() => setDraggedIndex(null)}
                            className="h-9 w-9 cursor-grab rounded-lg border border-gray-400 bg-white bg-[radial-gradient(circle_at_35%_35%,#6b7280_2px,transparent_2.5px),radial-gradient(circle_at_65%_35%,#6b7280_2px,transparent_2.5px),radial-gradient(circle_at_35%_65%,#6b7280_2px,transparent_2.5px),radial-gradient(circle_at_65%_65%,#6b7280_2px,transparent_2.5px)] px-2 py-2 text-transparent active:cursor-grabbing"
                            title="Drag menu item"
                          >
                            ⋮⋮
                          </button>

                          <input
                            value={item.label}
                            onChange={(e) =>
                              updateMenuItem(index, "label", e.target.value)
                            }
                            className="h-11 rounded-lg border border-gray-400 px-4 text-sm text-blue-700 outline-none focus:border-blue-600"
                            placeholder="Menu label"
                          />

                          <input
                            value={item.href}
                            onChange={(e) =>
                              updateMenuItem(index, "href", e.target.value)
                            }
                            className="h-11 rounded-lg border border-gray-400 px-4 text-sm text-blue-700 outline-none focus:border-blue-600"
                            placeholder="/link"
                          />

                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => addDropdownItem(index)}
                            disabled={
                              (item.children?.length ?? 0) >= MAX_DROPDOWN_LINKS
                            }
                            className="h-11 rounded-lg border border-blue-500 bg-white px-3 text-xs font-medium text-blue-600 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            Add Dropdown
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteMenuItem(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 bg-white text-red-600"
                            aria-label="Delete menu item"
                          >
                            <Trash size={18} />
                          </button>
                        </div>

                        {!!item.children?.length && (
                          <div className="mt-2 space-y-2 lg:pl-[3.75rem]">
                            {item.children.map((child, childIndex) => (
                              <div
                                key={childIndex}
                                className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_3.5rem]"
                              >
                                <input
                                  value={child.label}
                                  onChange={(e) =>
                                    updateDropdownItem(
                                      index,
                                      childIndex,
                                      "label",
                                      e.target.value,
                                    )
                                  }
                                  className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                                  placeholder="Dropdown label"
                                />

                                <input
                                  value={child.href}
                                  onChange={(e) =>
                                    updateDropdownItem(
                                      index,
                                      childIndex,
                                      "href",
                                      e.target.value,
                                    )
                                  }
                                  className="h-11 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-600"
                                  placeholder="/dropdown-link"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteDropdownItem(index, childIndex)
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 bg-white text-red-600"
                                  aria-label="Delete dropdown item"
                                >
                                  <Trash size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {item.children?.length ?? 0}/{MAX_DROPDOWN_LINKS}{" "}
                          dropdown links added
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </main>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-gray-400 bg-[#f4f4f5] p-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-400 px-5 py-2 text-sm font-semibold text-gray-600"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDone}
              className="rounded-full border bg-white px-5 py-2 text-sm font-semibold text-green-700 shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {generationText && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-white/35 backdrop-blur-sm">
          <style>
            {`
              @keyframes bannerLoaderSpin {
                to { transform: rotate(360deg); }
              }

              @keyframes bannerTextRoll {
                0%, 100% { transform: translateY(0); opacity: 0.65; }
                45% { transform: translateY(-0.22rem); opacity: 1; }
              }
            `}
          </style>
          <div className="relative overflow-hidden rounded-[1.35rem] p-[3px] shadow-2xl">
            <div className="absolute -inset-24 bg-[conic-gradient(from_0deg,#2563eb,#a855f7,#22c55e,#f59e0b,#ef4444,#2563eb)] animate-[bannerLoaderSpin_1.6s_linear_infinite]" />
            <div className="relative flex items-center gap-3 rounded-[1.2rem] bg-white/90 px-6 py-5 text-2xl font-medium text-slate-950 shadow-sm">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-xs text-white">
                AI
              </span>
              <span className="inline-flex overflow-hidden">
                {generationText.split("").map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    className="inline-block animate-[bannerTextRoll_1.1s_ease-in-out_infinite]"
                    style={{ animationDelay: `${index * 0.045}s` }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  items,
  activeTab,
  setActiveTab,
}: {
  items: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setActiveTab(item)}
          className={`w-full rounded-md px-3 py-2 text-left cursor-pointer ${
            activeTab === item
              ? "bg-blue-50 font-medium text-blue-700"
              : "hover:bg-gray-100"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SectionColorPanel({
  title,
  sectionTypeLabel,
  stickyType,
  backgroundType,
  backgroundColor,
  gradientColor,
  textColor,
  onStickyTypeChange,
  onBackgroundTypeChange,
  onBackgroundColorChange,
  onGradientColorChange,
  onTextColorChange,
}: {
  title: string;
  sectionTypeLabel?: string;
  stickyType?: StickySectionType;
  backgroundType: "solid" | "gradient";
  backgroundColor: string;
  gradientColor: string;
  textColor: string;
  onStickyTypeChange?: (type: StickySectionType) => void;
  onBackgroundTypeChange: (type: "solid" | "gradient") => void;
  onBackgroundColorChange: (color: string) => void;
  onGradientColorChange: (color: string) => void;
  onTextColorChange: (color: string) => void;
}) {
  return (
    <section className="rounded-xl bg-[#f4f4f5] px-4 py-3">
      <div className="grid gap-4 border-b border-gray-300 pb-3 lg:grid-cols-[minmax(150px,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <h4 className="text-lg font-semibold text-gray-950">{title}</h4>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Customize {title.toLowerCase()} settings
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[auto_auto_auto] sm:items-center">
          {sectionTypeLabel && stickyType && onStickyTypeChange && (
            <>
              <span className="text-sm font-semibold text-gray-950 sm:whitespace-nowrap">
                {sectionTypeLabel} :
              </span>

              {(["scroll", "sticky"] as const).map((type) => {
                const isActive = stickyType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onStickyTypeChange(type)}
                    className={`h-10 min-w-28 rounded-xl border px-5 text-sm font-semibold capitalize text-gray-950 shadow-sm transition ${
                      isActive
                        ? "border-gray-300 bg-white"
                        : "border-transparent bg-slate-200 hover:bg-white"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </>
          )}

          <span className="text-sm font-semibold text-gray-950 sm:whitespace-nowrap">
            Background Type :
          </span>

          {(["solid", "gradient"] as const).map((type) => {
            const isActive = backgroundType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => onBackgroundTypeChange(type)}
                className={`h-10 min-w-28 rounded-xl border px-5 text-sm font-semibold capitalize text-gray-950 shadow-sm transition ${
                  isActive
                    ? "border-gray-300 bg-white"
                    : "border-gray-500 bg-transparent hover:bg-white"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <ColorInput
          label="Text color"
          value={textColor}
          onChange={onTextColorChange}
        />

        <ColorInput
          label={
            backgroundType === "gradient"
              ? "Background left"
              : "Background color"
          }
          value={backgroundColor}
          onChange={onBackgroundColorChange}
        />

        {backgroundType === "gradient" && (
          <ColorInput
            label="Background right"
            value={gradientColor}
            onChange={onGradientColorChange}
          />
        )}
      </div>
    </section>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center gap-3 text-sm font-semibold text-gray-950">
      <span className="shrink-0">{label}</span>
      <span className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full border-2 border-gray-400"
          style={{ background: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
      </span>
    </label>
  );
}
