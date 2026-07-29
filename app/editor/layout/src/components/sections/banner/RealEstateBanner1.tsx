import Image from "next/image";
import Link from "next/link";

import type { SectionProps } from "../../../types/section";

export default function RealEstateBanner1({ data = {} }: SectionProps) {
  const background =
    data.bannerBackgroundMode === "gradient"
      ? `linear-gradient(135deg, ${data.bannerBackgroundColor ?? "#eee9df"}, ${data.bannerGradientColor ?? "#eee9df"})`
      : data.bannerBackgroundMode === "solid"
        ? (data.bannerBackgroundColor ?? "#eee9df")
        : "#eee9df";

  return (
    <section
      className="relative grid w-full overflow-hidden lg:grid-cols-[44%_56%]"
      style={{ minHeight: `${data.bannerHeight ?? 70}dvh`, background }}
    >
      <div className="relative z-20 flex flex-col justify-center px-6 py-20 sm:px-10 lg:px-16 xl:px-24">
        <div className="mb-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#846d4d]">
          <span className="h-px w-10 bg-[#846d4d]" />
          {data.pretitle}
        </div>
        <h1 className="max-w-xl font-serif text-5xl leading-[0.98] text-[#17231d] sm:text-6xl xl:text-7xl">
          {data.title}
        </h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-[#536057]">
          {data.desc}
        </p>
        {data.buttons?.length ? (
          <div className="mt-9 flex flex-wrap gap-3">
            {data.buttons.map((button, index) => (
              <Link
                key={`${button.label}-${index}`}
                href={button.href}
                className={
                  button.variant === "secondary"
                    ? "inline-flex border border-[#173f2b] px-6 py-3 text-sm font-semibold text-[#173f2b]"
                    : "inline-flex bg-[#173f2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e2d1e]"
                }
              >
                {button.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative min-h-[420px] lg:m-5 lg:ml-0">
        {data.bannerBackgroundMode === "video" && data.backgroundVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={data.backgroundImage}
            data-editor-media
            data-editor-media-type="video"
            data-editor-media-src={data.backgroundVideo}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={data.backgroundVideo} />
          </video>
        ) : data.backgroundImage ? (
          <Image
            src={data.backgroundImage}
            alt={data.backgroundImageTitle ?? data.title ?? ""}
            data-editor-media
            data-editor-media-type="image"
            data-editor-media-src={data.backgroundImage}
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            unoptimized={data.backgroundImage.startsWith("data:")}
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute bottom-6 left-6 border border-white/40 bg-white/90 px-5 py-4 backdrop-blur sm:bottom-10 sm:left-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#766c5f]">
            Curated properties
          </p>
          <p className="mt-1 font-serif text-xl text-[#17231d]">
            Live exceptionally
          </p>
        </div>
      </div>
    </section>
  );
}
