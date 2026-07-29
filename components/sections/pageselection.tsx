"use client";

import { BookOpenText, Building2, Check, Handshake, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PageOption = {
  id: string;
  label: string;
};

type PageGroup = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  pages: PageOption[];
};

const pageGroups: PageGroup[] = [
  {
    title: "Identity & governance",
    subtitle: "Introduce your organization and the people behind it.",
    icon: Building2,
    pages: [
      { id: "our-story", label: "Our Story" },
      { id: "vision-mission", label: "Vision & Mission" },
      { id: "our-values", label: "Our Values" },
      { id: "leadership-team", label: "Leadership Team" },
      { id: "board-of-directors", label: "Board of Directors" },
      { id: "founder-message", label: "Founder Message" },
      { id: "our-journey", label: "Our Journey" },
      { id: "awards-recognition", label: "Awards & Recognition" },
    ],
  },
  {
    title: "Stories & resources",
    subtitle: "Share updates, evidence, and useful information.",
    icon: BookOpenText,
    pages: [
      { id: "blog", label: "Blog" },
      { id: "news", label: "News" },
      { id: "accessibility", label: "Accessibility" },
      { id: "success-stories", label: "Success Stories" },
      { id: "case-studies", label: "Case Studies" },
      { id: "statistics", label: "Statistics" },
      { id: "reports", label: "Reports" },
      { id: "faqs", label: "FAQs" },
    ],
  },
  {
    title: "Engagement & support",
    subtitle: "Give visitors clear ways to trust and engage with you.",
    icon: Handshake,
    pages: [
      { id: "tax-exemption", label: "Tax Exemption" },
      { id: "why-choose-us", label: "Why Choose Us" },
      { id: "request-a-quote", label: "Request a Quote" },
      { id: "partners", label: "Partners" },
      { id: "csr-activities", label: "CSR Activities" },
    ],
  },
];

const pageOptions = pageGroups.flatMap(({ pages }) => pages);

type PageSelectionProps = {
  selectedPages: string[];
  onChange: (pages: string[]) => void;
};

export default function PageSelection({
  selectedPages,
  onChange,
}: PageSelectionProps) {
  const allSelected = selectedPages.length === pageOptions.length;

  const togglePage = (pageId: string) => {
    onChange(
      selectedPages.includes(pageId)
        ? selectedPages.filter((id) => id !== pageId)
        : [...selectedPages, pageId],
    );
  };

  return (
    <div className="w-full">
      <section className="onboarding-responsive-scroll relative mx-auto max-h-[calc(100dvh-156px)] w-full overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(23,38,76,.08)] lg:max-h-none lg:overflow-visible">
        <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6 2xl:px-9">
          <div className="flex items-center justify-center border-b border-slate-200 pb-5">
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-[-.035em] text-[#08132f] sm:text-2xl">
                Choose pages for your website
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Select the pages you want to include. You can edit them later.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-blue-100 bg-[linear-gradient(105deg,#f3f7ff_0%,#f8fbff_55%,#f2fffb_100%)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#315ff4] shadow-sm">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-[#08132f]">
                  Build your website menu
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Home is included automatically. Choose any additional pages.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500">
                <strong className="text-[#315ff4]">{selectedPages.length}</strong>
                {" "}of {pageOptions.length} selected
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(allSelected ? [] : pageOptions.map(({ id }) => id))
                }
                className="shrink-0 rounded-lg bg-[#315ff4] px-3 py-2 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
          </div>

          <fieldset className="mt-5 grid gap-3 lg:grid-cols-3">
            <legend className="sr-only">Select website pages</legend>
            {pageGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <section
                  key={group.title}
                  className="rounded-xl border border-slate-200 bg-slate-50/55 p-3"
                >
                  <div className="mb-3 flex items-start gap-2.5 px-1">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white text-[#315ff4] shadow-sm">
                      <GroupIcon size={14} />
                    </span>
                    <div>
                      <h3 className="text-xs font-medium text-[#08132f]">
                        {group.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                        {group.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {group.pages.map((page) => {
                      const isSelected = selectedPages.includes(page.id);

                      return (
                        <label
                          key={page.id}
                          className={`group flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-all duration-200 ${isSelected
                            ? "border-[#315ff4] bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-[#08132f] hover:border-blue-300 hover:text-[#315ff4]"
                            }`}
                        >
                          <input
                            type="checkbox"
                            value={page.id}
                            checked={isSelected}
                            onChange={() => togglePage(page.id)}
                            className="sr-only"
                          />
                          <span
                            className={`grid size-3.5 shrink-0 place-items-center rounded-full border ${isSelected
                              ? "border-[#315ff4] bg-[#315ff4] text-white"
                              : "border-slate-300 text-transparent"
                              }`}
                          >
                            <Check size={8} strokeWidth={3.5} />
                          </span>
                          <span className="text-[14px] font-medium leading-4">
                            {page.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </fieldset>
        </div>
      </section>
    </div>
  );
}
