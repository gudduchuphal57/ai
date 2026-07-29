import type {
  Block,
  BlockSection,
  LayoutComponentProps,
} from "../components/sections/types/section";

export type {
  Block,
  BlockSection,
  SectionType,
  TextBlock,
  ImageBlock,
  VideoBlock,
  ButtonBlock,
  SliderBlock,
  CarouselBlock,
  CardBlock,
  ListBlock,
  MenuBlock,
  LogoBlock,
} from "../components/sections/types/section";

type MenuItem = {
  label: string;
  href: string;
  children?: MenuItem[];
};

export type SocialLinkData = {
  label: "facebook" | "instagram" | "twitter" | "linkedin";
  href: string;
};

export type ButtonData = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export type BannerSlideData = {
  image: string;
  video?: string;
  alt?: string;
  title: string;
  desc?: string;
  button?: ButtonData;
};

export type ProductImageData = {
  image: string;
  alt: string;
};

export type ProductFeatureData = {
  label: string;
  price: string;
};

export type ProductSlideData = {
  image: string;
  alt: string;
  link?: string;
  productTitle: string;
  productSubtitle: string;
  productInfoTitle: string;
  productInfoDesc: string;
  productFeatures: ProductFeatureData[];
  productTotalPrice: string;
  productShippingText: string;
  button?: ButtonData;
};

export type ProductCardData = {
  title: string;
  category: string;
  desc: string;
  image: string;
  price?: string;
  alt?: string;
  imageTitle?: string;
  link?: string;
};

export type StatItemData = {
  label: string;
  value: string;
};

export type WhyChooseUsItemData = {
  title: string;
  desc: string;
  stat?: string;
};

export type GalleryItemData = {
  image: string;
  alt?: string;
  title?: string;
};

export type FormFieldData = {
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
};

export type FaqItemData = {
  question: string;
  answer: string;
};

export type TestimonialItemData = {
  name: string;
  role: string;
  quote: string;
  image?: string;
  rating?: string;
};

export type FooterSocialData = {
  label: "facebook" | "instagram" | "twitter" | "linkedin";
  href: string;
};

export type FooterLinkData = {
  label: string;
  href: string;
};

export type FooterColumnData = {
  title: string;
  links: FooterLinkData[];
};

export type FooterContactData = {
  location: string;
  email: string;
  phone: string;
};

export type CollectionItemData = {
  brand: string;
  title: string;
  desc?: string;
  image: string;
  price?: string;
};

export type ContactInfoData = {
  address: string;
  phone: string;
  email: string;
};

export type SectionData = {
  [field: string]: unknown;

  hiddenContentFields?: string[];
  topbarType?: "scroll" | "sticky";
  topbarBackgroundType?: "solid" | "gradient";
  topbarBackgroundColor?: string;
  topbarGradientColor?: string;
  topbarTextColor?: string;
  text?: string[];
  phone?: string;
  email?: string;
  location?: string;
  socialLinks?: SocialLinkData[];

  logo?: string;
  logoImage?: string;
  logoImageTitle?: string;
  menu?: MenuItem[];
  buttons?: ButtonData[];

  headerBackgroundType?: "solid" | "gradient";
  headerType?: "scroll" | "sticky";
  headerBackgroundColor?: string;
  headerGradientColor?: string;
  headerTextColor?: string;

  pretitle?: string;
  title?: string;
  subtitle?: string;

  backgroundImage?: string;
  backgroundImageTitle?: string;
  backgroundVideo?: string;
  bannerBackgroundMode?: "image" | "video" | "solid" | "gradient";
  bannerBackgroundColor?: string;
  bannerGradientColor?: string;
  bannerHeight?: number;
  bannerSlides?: BannerSlideData[];

  eyebrowColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  overlayColor?: string;
  collectionItems?: CollectionItemData[];
  contactInfo?: ContactInfoData;
   mapUrl?: string;

  desc?: string;
  desc2?: string;

  buttonBackground?: string;
  buttonColor?: string;

  highlightedText?: string;

  length?: number;
  sideImage?: string;
  sideImageTitle?: string;
  philosophyTitle?: string;
  philosophyDesc?: string;

  productImages?: ProductImageData[];
  productTitle?: string;
  productSubtitle?: string;
  productInfoTitle?: string;
  productInfoDesc?: string;
  productFeatures?: ProductFeatureData[];
  productTotalPrice?: string;
  productShippingText?: string;
  productSlides?: ProductSlideData[];
  productSectionTitle?: string;
  productItems?: ProductCardData[];
  stats?: StatItemData[];

  whyChooseUsItems?: WhyChooseUsItemData[];
  galleryItems?: GalleryItemData[]; 
  formFields?: FormFieldData[];
  formSubmitLabel?: string;
  faqItems?: FaqItemData[];
  testimonialItems?: TestimonialItemData[];

  footerBackgroundType?: "solid" | "gradient";
  footerBackgroundColor?: string;
  footerGradientColor?: string;
  footerTextColor?: string;
  footerMutedTextColor?: string;
  footerSocialLinks?: FooterSocialData[];
  footerColumns?: FooterColumnData[];
  footerContact?: FooterContactData;
  footerLegalLinks?: FooterLinkData[];
  whatsappLink?: string;
  callLink?: string;
  copyrightText?: string;
};

export type SectionProps = {
  data?: SectionData;
} & Partial<LayoutComponentProps> & {
    blocks?: Block[];
    section?: BlockSection;
  };

export type SectionItem = {
  id?: string;
  page?: string;
  type: string;
  variant: string;
  data: Record<string, SectionData>;
};

export type SelectedConfig = {
  templateId: string;
  sections: SectionItem[];
};
