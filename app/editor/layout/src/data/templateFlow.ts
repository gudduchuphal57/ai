import { selectedConfig } from "./selectedConfig";
import categoryContentJson from "./categoryContent.json";
import type { SectionData, SectionItem, SelectedConfig } from "../types/section";
import {
  getCategoryComponentPrefix,
  getCategorySectionVariant,
} from "../lib/categorySectionVariant";

export type BuilderTemplate = {
  id: string;
  title: string;
  image: string;
  componentCount: number;
};

type SectionContentMap = Partial<Record<string, Record<string, unknown>>>;
type TemplateComponentMap = Record<string, string | null>;

type CategoryContentRecord = {
  common: SectionContentMap;
  categories: Record<
    string,
    {
      templateComponents: Record<string, TemplateComponentMap>;
      sections: SectionContentMap;
    }
  >;
};

const categoryContent =
  categoryContentJson as unknown as CategoryContentRecord;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

export const getCategoryNamesWithContent = () =>
  Object.keys(categoryContent.categories);

export type CategoryLayoutOption = {
  id: string;
  name: string;
  componentVariant: string;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getCategorySectionVariants = (
  category: string,
  sectionType: string,
): Record<string, unknown> => {
  const categorySection =
    categoryContent.categories[category]?.sections?.[sectionType];

  return isRecord(categorySection) && isRecord(categorySection.variants)
    ? categorySection.variants
    : {};
};

type CategoryVariantEntry = {
  componentVariant: string;
  data: Record<string, unknown>;
  layoutIndex: number;
  sectionKey: string;
  sectionType: string;
};

const normalizeSectionName = (value: string) =>
  value.replace(/[^a-z0-9]/gi, "").toLowerCase();

const getCategoryPageVariantEntries = (
  category: string,
  sectionType: string,
): CategoryVariantEntry[] => {
  const prefix = getCategoryComponentPrefix(category);
  const pageComponentPattern = new RegExp(
    `^${escapeRegExp(prefix)}(.+)Page(\\d+)$`,
  );
  const targetSectionName = normalizeSectionName(sectionType);
  const categorySections =
    categoryContent.categories[category]?.sections ?? {};
  const entries = Object.entries(categorySections).flatMap(
    ([sectionKey, sectionValue]) => {
      if (!isRecord(sectionValue) || !isRecord(sectionValue.variants)) {
        return [];
      }

      return Object.entries(sectionValue.variants).flatMap(
        ([componentVariant, variantData]) => {
          const match = componentVariant.match(pageComponentPattern);

          if (
            !match ||
            normalizeSectionName(match[1]) !== targetSectionName ||
            !isRecord(variantData)
          ) {
            return [];
          }

          return [
            {
              componentVariant,
              data: variantData,
              layoutIndex: Number(match[2]),
              sectionKey,
              sectionType: match[1],
            },
          ];
        },
      );
    },
  );

  return Array.from(
    new Map(entries.map((entry) => [entry.componentVariant, entry])).values(),
  ).sort((left, right) => left.layoutIndex - right.layoutIndex);
};

const isCategoryPageComponent = (
  category: string,
  sectionType: string,
  componentVariant: string,
) => {
  const prefix = getCategoryComponentPrefix(category);
  const pattern = new RegExp(
    `^${escapeRegExp(prefix)}${escapeRegExp(sectionType)}Page\\d+$`,
  );

  return pattern.test(componentVariant);
};

const getCategoryVariantTitle = (
  variantData: Record<string, unknown>,
  fallback: string,
) => {
  const preferredFields = [
    "title",
    "productSectionTitle",
    "logo",
    "pretitle",
    "desc",
  ];

  for (const field of preferredFields) {
    if (typeof variantData[field] === "string" && variantData[field].trim()) {
      return variantData[field];
    }
  }

  const text = variantData.text;

  return Array.isArray(text) && typeof text[0] === "string" && text[0].trim()
    ? text[0]
    : fallback;
};

export const getCategoryLayoutOptions = (
  category: string,
  sectionType: string,
): CategoryLayoutOption[] => {
  const categorySectionType =
    sectionType === "MarqueeSlide" ? "Marquee" : sectionType;
  const variants = getCategorySectionVariants(category, categorySectionType);

  if (!Object.keys(variants).length) return [];

  return Object.entries(variants)
    .filter(
      ([componentVariant]) =>
        !isCategoryPageComponent(
          category,
          categorySectionType,
          componentVariant,
        ),
    )
    .map(
    ([componentVariant, variantData], index) => {
      const match = componentVariant.match(/(\d+)$/);
      const layoutNumber = match ? Number(match[1]) : index + 1;
      const content = isRecord(variantData) ? variantData : {};

      return {
        id: `${sectionType}-${layoutNumber}`,
        name: getCategoryVariantTitle(content, componentVariant),
        componentVariant,
      };
    },
  );
};

export const getCategoryPageLayoutOptions = (
  category: string,
  sectionType: string,
): CategoryLayoutOption[] =>
  getCategoryPageVariantEntries(category, sectionType).map(
    ({ componentVariant, data }) => ({
      id: componentVariant,
      name: getCategoryVariantTitle(
        data,
        componentVariant,
      ),
      componentVariant,
    }),
  );

export const hasCategoryContent = (category: string) =>
  Boolean(categoryContent.categories[category]);

export const getTemplateIdsForCategory = (category: string) =>
  Object.keys(
    categoryContent.categories[category]?.templateComponents ?? {},
  );

export const getTemplatesForCategory = (category: string) => {
  const categoryRecord = categoryContent.categories[category];

  if (!categoryRecord) return [];

  return Object.entries(categoryRecord.templateComponents).map(
    ([id, components]) => {
      const bannerComponent = components.Banner;
      const bannerSection = categoryRecord.sections.Banner;
      const bannerVariants =
        isRecord(bannerSection) && isRecord(bannerSection.variants)
          ? bannerSection.variants
          : {};
      const bannerData =
        bannerComponent && isRecord(bannerVariants[bannerComponent])
          ? bannerVariants[bannerComponent]
          : {};
      const bannerSlides = Array.isArray(bannerData.bannerSlides)
        ? bannerData.bannerSlides
        : [];
      const firstSlide = isRecord(bannerSlides[0]) ? bannerSlides[0] : {}; 
      const image =
        (typeof bannerData.backgroundImage === "string" &&
          bannerData.backgroundImage) ||
        (typeof firstSlide.image === "string" && firstSlide.image) ||
        "/bg1.jpg";

      return {
        id,
        title: getCategoryVariantTitle(
          bannerData,
          bannerComponent ?? `${category} ${id}`,
        ),
        image,
        componentCount: Object.values(components).filter(
          (component) => component !== null,
        ).length,
      };
    },
  );
};

export const getTemplateComponentVariant = (
  category: string,
  templateId: string,
  sectionType: string,
): string | null => {
  const sectionKey = sectionType === "MarqueeSlide" ? "Marquee" : sectionType;
  const templateComponents =
    categoryContent.categories[category]?.templateComponents?.[templateId];

  return templateComponents?.[sectionKey] ?? null;
};

const getTemplateDataVariant = (
  sectionType: string,
  componentVariant: string,
) => {
  const match = componentVariant.match(/(\d+)$/);

  return match ? `${sectionType}-${match[1]}` : `${sectionType}-1`;
};

export const addableSectionCards = [
  {
    type: "Banner",
    variant: "Banner-1",
    title: "Banner",
    description: "Image hero section",
  },
  {
    type: "About",
    variant: "About-1",
    title: "About",
    description: "Company intro section",
  },
  {
    type: "Product",
    variant: "Product-2",
    title: "Services",
    description: "Service cards section",
  },
  {
    type: "WhyChooseUs",
    variant: "WhyChooseUs-1",
    title: "Why choose us",
    description: "Trust points section",
  },
  {
    type: "Gallery",
    variant: "Gallery-1",
    title: "Gallery",
    description: "Image showcase section",
  },
  {
    type: "FormDetail",
    variant: "FormDetail-1",
    title: "Form",
    description: "Lead detail section",
  },
  {
    type: "FAQ",
    variant: "FAQ-1",
    title: "FAQ",
    description: "Question answer section",
  },
  {
    type: "Testimonial",
    variant: "Testimonial-1",
    title: "Our Clients",
    description: "Client reviews section",
  },
] as const;

const cloneSections = (sections: SectionItem[]) =>
  structuredClone(sections) as SectionItem[];

const applyBannerVariantDefaults = (
  variant: string,
  data: Record<string, unknown>,
) => {
  const sourceImage =
    typeof data.backgroundImage === "string" ? data.backgroundImage : "/bg1.jpg";
  const sourceVideo =
    typeof data.backgroundVideo === "string"
      ? data.backgroundVideo
      : "/video.mp4";
  const sourceSlides = Array.isArray(data.bannerSlides)
    ? data.bannerSlides
    : [];

  if (variant === "Banner-1") {
    return {
      ...data,
      bannerBackgroundMode: data.bannerBackgroundMode ?? "image",
      backgroundImage: sourceImage,
    };
  }

  if (variant === "Banner-2") {
    return {
      ...data,
      bannerBackgroundMode: data.bannerBackgroundMode ?? "video",
      backgroundVideo: sourceVideo,
      backgroundImage: sourceImage,
    };
  }

  if (variant === "Banner-3") {
    return {
      ...data,
      bannerSlides: sourceSlides,
    };
  }

  if (variant === "Banner-4") {
    return {
      ...data,
      bannerSlides: sourceSlides.length
        ? sourceSlides.map((slide) =>
            typeof slide === "object" && slide !== null && !Array.isArray(slide)
              ? {
                  ...slide,
                  image:
                    typeof (slide as { image?: unknown }).image === "string"
                      ? (slide as { image: string }).image
                      : sourceImage,
                  video:
                    typeof (slide as { video?: unknown }).video === "string"
                      ? (slide as { video: string }).video
                      : sourceVideo,
                }
              : slide,
          )
        : [],
    };
  }

  return data;
};

const mergeCategoryData = (
  section: SectionItem,
  category: string,
): SectionItem => {
  const categorySectionType =
    section.type === "MarqueeSlide" ? "Marquee" : section.type;
  const categorySection =
    categoryContent.categories[category]?.sections?.[categorySectionType] ?? {};
  const nestedVariants = isRecord(categorySection.variants)
    ? categorySection.variants
    : undefined;
  const categorySectionData = Object.fromEntries(
    Object.entries(categorySection).filter(
      ([key]) => key !== "variants",
    ),
  );
  const sectionContent = {
    ...categoryContent.common[section.type],
    ...categorySectionData,
  };

  if (!Object.keys(sectionContent).length && !nestedVariants) {
    const emptyData = Object.fromEntries(
      Object.keys(section.data).map((variant) => [variant, {} as SectionData]),
    );

    return { ...section, data: emptyData };
  }

  const categoryVariantKeys = nestedVariants
    ? Object.keys(nestedVariants)
        .filter(
          (categoryVariant) =>
            !isCategoryPageComponent(
              category,
              categorySectionType,
              categoryVariant,
            ),
        )
        .map((categoryVariant, index) => {
          const match = categoryVariant.match(/(\d+)$/);
          const layoutNumber = match ? Number(match[1]) : index + 1;

          return `${section.type}-${layoutNumber}`;
        })
    : [];
  const availableDataVariants = Array.from(
    new Set([...Object.keys(section.data), ...categoryVariantKeys]),
  );
  const nextData = Object.fromEntries(
    availableDataVariants.map((variant) => {
      const categoryVariant = getCategorySectionVariant(
        category,
        section.type,
        variant,
      );
      const variantContent =
        nestedVariants && isRecord(nestedVariants[categoryVariant])
          ? nestedVariants[categoryVariant]
          : {};
      const mergedContent = {
        ...sectionContent,
        ...variantContent,
      };

      return [
        variant,
        section.type === "Banner"
          ? applyBannerVariantDefaults(variant, mergedContent)
          : mergedContent,
      ];
    }),
  );

  return { ...section, data: nextData };
};

const createDefaultSectionData = (sectionType: string): Record<string, SectionData> => {
  if (sectionType === "WhyChooseUs") {
    const data: SectionData = {
      pretitle: "Why choose us",
      title: "A better experience from first click.",
      desc: "Use category-specific proof points to help visitors trust your business faster.",
      whyChooseUsItems: [
        {
          title: "Clear guidance",
          desc: "Helpful details and simple next steps for every visitor.",
          stat: "01",
        },
        {
          title: "Trusted process",
          desc: "A focused flow designed around the user decision journey.",
          stat: "02",
        },
        {
          title: "Fast response",
          desc: "Make it easy for people to enquire, compare, and act.",
          stat: "03",
        },
      ],
    };

    return {
      "WhyChooseUs-1": data,
      "WhyChooseUs-2": data,
      "WhyChooseUs-3": data,
      "WhyChooseUs-4": data,
    };
  }

  if (sectionType === "Gallery") {
    const data: SectionData = {
      pretitle: "Gallery",
      title: "Explore the experience",
      desc: "A visual section powered by the selected category media.",
      galleryItems: [
        { image: "/bg1.jpg", alt: "Gallery image one", title: "View one" },
        { image: "/bg2.jpg", alt: "Gallery image two", title: "View two" },
        { image: "/blackbay.png", alt: "Gallery image three", title: "View three" },
        { image: "/shaye.png", alt: "Gallery image four", title: "View four" },
      ],
    };

    return {
      "Gallery-1": data,
      "Gallery-2": data,
      "Gallery-3": data,
      "Gallery-4": data,
      "Gallery-5": data,
      "Gallery-6": data,
    };
  }

  if (sectionType === "FormDetail") {
    const data: SectionData = {
      pretitle: "Contact",
      title: "Tell us what you need.",
      desc: "Capture enquiries with a simple editable form section.",
      formSubmitLabel: "Send enquiry",
      formFields: [
        { label: "Name", type: "text", placeholder: "Your name" },
        { label: "Email", type: "email", placeholder: "you@example.com" },
        { label: "Message", type: "textarea", placeholder: "Tell us what you need" },
      ],
    };

    return {
      "FormDetail-1": data,
      "FormDetail-2": data,
      "FormDetail-3": data,
      "FormDetail-4": data,
    };
  }

  if (sectionType === "FAQ") {
    const data: SectionData = {
      pretitle: "FAQ",
      title: "Frequently asked questions",
      faqItems: [
        {
          question: "How quickly can we start?",
          answer: "You can start as soon as the basic details are ready.",
        },
        {
          question: "Can this content be changed?",
          answer: "Yes, text and media can be customized from the editor data.",
        },
        {
          question: "Does this match the selected category?",
          answer: "Yes, inserted sections merge with the active category JSON.",
        },
      ],
    };

    return {
      "FAQ-1": data,
      "FAQ-2": data,
      "FAQ-3": data,
      "FAQ-4": data,
    };
  }

  if (sectionType === "Testimonial") {
    const data: SectionData = {
      pretitle: "Our clients",
      title: "Trusted by people who care about results.",
      desc: "Use real customer feedback to build trust with new visitors.",
      testimonialItems: [
        {
          name: "Aarav Mehta",
          role: "Founder, Studio North",
          quote:
            "The site made our work easier to understand and brought in better leads within the first week.",
          image: "/bg1.jpg",
          rating: "5.0",
        },
        {
          name: "Neha Kapoor",
          role: "Marketing Lead",
          quote:
            "Clean sections, fast pages, and the editor keeps the content simple for our whole team.",
          image: "/bg2.jpg",
          rating: "4.9",
        },
        {
          name: "Rahul Verma",
          role: "Operations Head",
          quote:
            "We finally have a website that looks premium and still feels practical to update.",
          image: "/blackbay.png",
          rating: "5.0",
        },
        {
          name: "Isha Malhotra",
          role: "Creative Director",
          quote:
            "The layouts gave our brand a sharper story and made every service easier to browse.",
          image: "/shaye.png",
          rating: "4.8",
        },
        {
          name: "Kabir Anand",
          role: "Product Manager",
          quote:
            "We could test different sections quickly without losing the polished look of the page.",
          image: "/stylam.png",
          rating: "4.7",
        },
        {
          name: "Sara Khan",
          role: "Business Owner",
          quote:
            "Visitors understand what we offer faster, and enquiries feel more relevant now.",
          image: "/prod2.jpg",
          rating: "5.0",
        },
      ],
    };

    return {
      "Testimonial-1": data,
      "Testimonial-2": data,
      "Testimonial-3": data,
    };
  }

  return {};
};

export const createAddableSection = (
  sectionType: string,
  category: string,
): SectionItem | null => {
  const libraryCard = addableSectionCards.find(
    (item) => item.type === sectionType,
  );
  const baseSection =
    cloneSections(selectedConfig.sections).find(
      (section) => section.type === sectionType,
    ) ??
    (libraryCard
      ? {
          type: libraryCard.type,
          variant: libraryCard.variant,
          data: createDefaultSectionData(libraryCard.type),
        }
      : null);

  if (!baseSection || !libraryCard) return null;

  return mergeCategoryData(
    {
      ...baseSection,
      id: `${libraryCard.type}-${Date.now()}`,
      variant: libraryCard.variant,
    },
    category,
  );
};

const withoutVariants = (value: unknown): Record<string, unknown> =>
  isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).filter(([field]) => field !== "variants"),
      )
    : {};

const createCategoryPageSection = ({
  category,
  sectionType,
  pageSlug,
  commonDataKey,
  legacyVariants,
}: {
  category: string;
  sectionType: string;
  pageSlug: string;
  commonDataKey: string;
  legacyVariants: string[];
}): SectionItem => {
  const categorySections =
    categoryContent.categories[category]?.sections ?? {};
  const categorySection = categorySections[sectionType];
  const categoryPageSection = categorySections[`${sectionType}Page`];
  const pageVariantEntries = getCategoryPageVariantEntries(
    category,
    sectionType,
  );
  const pageVariants = Object.fromEntries(
    pageVariantEntries.map(({ componentVariant, data }) => [
      componentVariant,
      data,
    ]),
  );
  const pageLayoutOptions = getCategoryPageLayoutOptions(
    category,
    sectionType,
  );
  const baseData = {
    ...categoryContent.common[commonDataKey],
    ...withoutVariants(categorySection),
    ...withoutVariants(categoryPageSection),
  } as SectionData;
  const categoryPageData = Object.fromEntries(
    pageLayoutOptions.map(({ id }) => {
      const variantData = pageVariants[id];

      return [
        id,
        {
          ...baseData,
          ...(isRecord(variantData) ? variantData : {}),
        } as SectionData,
      ];
    }),
  );
  const legacyData = Object.fromEntries(
    legacyVariants.map((variant) => [variant, baseData]),
  );
  const defaultVariant = pageLayoutOptions[0]?.id ?? legacyVariants[0];

  return {
    id: `${sectionType}Page`,
    page: pageSlug,
    type: sectionType,
    variant: defaultVariant,
    data: {
      ...legacyData,
      ...categoryPageData,
    },
  };
};

export const createAboutPageSection = (category: string): SectionItem =>
  createCategoryPageSection({
    category,
    sectionType: "About",
    pageSlug: "about",
    commonDataKey: "AboutPage",
    legacyVariants: ["AboutPage-1", "AboutPage-2", "AboutPage-3"],
  });

export const createGalleryPageSection = (category: string): SectionItem =>
  createCategoryPageSection({
    category,
    sectionType: "Gallery",
    pageSlug: "gallery",
    commonDataKey: "Gallery",
    legacyVariants: ["GalleryPage-1"],
  });

export const createServicePageSection = (category: string): SectionItem =>
  createCategoryPageSection({
    category,
    sectionType: "Service",
    pageSlug: "service",
    commonDataKey: "ServicePage",
    legacyVariants: ["ServicePage-1"],
  });

export const createContactPageSection = (category: string): SectionItem =>
  createCategoryPageSection({
    category,
    sectionType: "Contact",
    pageSlug: "contact",
    commonDataKey: "ContactPage",
    legacyVariants: ["ContactPage-1", "ContactPage-2"],
  });

const toComponentSectionType = (pageLabel: string) =>
  pageLabel
    .trim()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

export const createCategoryPageFromLabel = (
  category: string,
  pageLabel: string,
): SectionItem | null => {
  const pageSlug = pageLabel.trim().toLowerCase().replace(/\s+/g, "-");
  const requestedSectionType = toComponentSectionType(pageLabel);
  const pageVariantEntries = getCategoryPageVariantEntries(
    category,
    requestedSectionType,
  );

  if (!pageSlug || !requestedSectionType || !pageVariantEntries.length) {
    return null;
  }

  const sectionType = pageVariantEntries[0].sectionType;
  const categorySections =
    categoryContent.categories[category]?.sections ?? {};
  const data = Object.fromEntries(
    pageVariantEntries.map(({ componentVariant, data: variantData, sectionKey }) => [
      componentVariant,
      {
        ...categoryContent.common[`${sectionType}Page`],
        ...categoryContent.common[sectionType],
        ...withoutVariants(categorySections[sectionKey]),
        ...variantData,
      } as SectionData,
    ]),
  );

  return {
    id: `${sectionType}Page`,
    page: pageSlug,
    type: sectionType,
    variant: pageVariantEntries[0].componentVariant,
    data,
  };
};

export const createCategoryPageFromHref = (
  category: string,
  href: string,
): SectionItem | null => {
  const componentRoute = href
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split(/[?#]/, 1)[0];
  const prefix = getCategoryComponentPrefix(category);
  const match = componentRoute.match(
    new RegExp(`^${escapeRegExp(prefix)}(.+)Page\\d+$`, "i"),
  );

  if (!match) return null;

  const pageVariantEntries = getCategoryPageVariantEntries(category, match[1]);
  const targetEntry = pageVariantEntries.find(
    ({ componentVariant }) =>
      componentVariant.toLowerCase() === componentRoute.toLowerCase(),
  );

  if (!targetEntry) return null;

  const pageSection = createCategoryPageFromLabel(
    category,
    targetEntry.sectionType,
  );

  return pageSection
    ? { ...pageSection, variant: targetEntry.componentVariant }
    : null;
};

export const createCustomPageSection = (
  category: string,
  pageLabel: string,
): SectionItem => {
  const pageSlug = pageLabel.trim().toLowerCase().replace(/\s+/g, "-");
  const categoryAboutData = categoryContent.categories[category]?.sections?.About;
  const pageData = {
    ...categoryContent.common.CustomPage,
    ...categoryContent.categories[category]?.sections?.CustomPage,
    sideImage:
      categoryContent.categories[category]?.sections?.CustomPage?.sideImage ??
      categoryAboutData?.sideImage ??
      categoryAboutData?.backgroundImage ??
      categoryContent.common.CustomPage?.sideImage,
    sideImageTitle:
      categoryContent.categories[category]?.sections?.CustomPage?.sideImageTitle ??
      categoryAboutData?.sideImageTitle ??
      categoryAboutData?.backgroundImageTitle ??
      categoryContent.common.CustomPage?.sideImageTitle,
    title: pageLabel,
  } as SectionData;

  return {
    id: `CustomPage-${pageSlug}`,
    page: pageSlug,
    type: "About",
    variant: "AboutPage-2",
    data: {
      "AboutPage-1": pageData,
      "AboutPage-2": pageData,
      "AboutPage-3": pageData,
    },
  };
};

export const buildSelectedConfig = (
  templateId?: string | null,
  category: string = "Realestate",
): SelectedConfig => {
  const templateIds = getTemplateIdsForCategory(category);
  const selectedTemplateId =
    (templateId && templateIds.includes(templateId) && templateId) ||
    templateIds[0] ||
    "template-1";
  const templateComponents =
    categoryContent.categories[category]?.templateComponents?.[
      selectedTemplateId
    ] ?? {};
  const baseSections = cloneSections(selectedConfig.sections);
  const sections = Object.entries(templateComponents).flatMap(
    ([componentSectionType, componentVariant]) => {
      if (componentVariant === null) return [];

      const sectionType =
        componentSectionType === "Marquee"
          ? "MarqueeSlide"
          : componentSectionType;
      const section =
        baseSections.find((item) => item.type === sectionType) ?? {
          type: sectionType,
          variant: `${sectionType}-1`,
          data: createDefaultSectionData(sectionType),
        };
      const variant = getTemplateDataVariant(sectionType, componentVariant);

      return [mergeCategoryData({ ...section, variant }, category)];
    },
  );

  return {
    templateId: selectedTemplateId,
    sections,
  };
};
