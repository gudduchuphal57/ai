"use client";

import React from "react";
import Image from 'next/image';
import { motion } from "framer-motion";
import { SectionProps } from "../../../types/section";

export default function BusinessAboutPage1({ data = {} }: SectionProps) {
    return (
        <section className="w-full bg-[#fbfaf6] px-8 md:px-24 py-10 md:py-10 overflow-hidden">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-16 lg:gap-24">

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full md:w-1/2"
                >
                    {data.sideImage && (
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e4db]">
                            <Image
                                src={data.sideImage}
                                alt="About Us"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                                className="object-cover transition-transform duration-700 ease-in-out hover:scale-105"
                            />
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="w-full md:w-1/2 flex flex-col items-start"
                >
                    {data.pretitle && (
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-6 h-[1.5px] bg-[#c03a2b]"></span>
                            <span className="text-[#c03a2b] text-[10px] tracking-[0.15em] uppercase font-semibold">
                                {data.pretitle}
                            </span>
                        </div>
                    )}

                    {data.title && (
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1a1a1a] mb-8 leading-tight">
                            {data.title}
                        </h2>
                    )}

                    {data.desc && (
                        <p className="text-[14px] md:text-[15px] text-gray-600 leading-relaxed tracking-wide mb-6 font-light">
                            {data.desc}
                        </p>
                    )}

                    {data.desc2 && (
                        <p className="text-[14px] md:text-[15px] text-gray-600 leading-relaxed tracking-wide mb-12 font-light">
                            {data.desc2}
                        </p>
                    )}

                    {data.buttons && data.buttons.length > 0 && (
                        <div className="flex gap-4">
                            {data.buttons.map((btn, index) => (
                                <a
                                    key={index}
                                    href={btn.href}
                                    className="bg-[#1a1a1a] text-white px-8 py-4 text-[10px] tracking-[0.2em] uppercase hover:bg-[#cfa94e] transition-colors duration-300"
                                >
                                    {btn.label}
                                </a>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
