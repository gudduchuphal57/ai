"use client";

import { createElement, ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Edit, Plus, Trash, X, Play } from "lucide-react";
import { usePreview } from "../context/PreviewContext";
import {
  addableSectionCards,
  createAddableSection,
} from "../../data/templateFlow";
import { getSectionComponent } from "../../lib/sectionRegistry";

const TOOLBAR_WIDTH = 400;
const TOOLBAR_HEIGHT = 64;
const TOOLBAR_CURSOR_GAP = 0;
const BOTTOM_TOOLBAR_GAP = 20;

type EditableSectionProps = {
  label: string;
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onAddSection: (sectionType: string) => void;
  onInlineTextEdit: (oldText: string, newText: string) => void;
  onInlineMediaEdit: (
    oldSrc: string,
    newSrc: string,
    mediaType: "image" | "video",
    fileName: string,
  ) => void;
  stickyMode?: "scroll" | "sticky";
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export default function EditableSection({
  label,
  children,
  onEdit,
  onDelete,
  onAddSection,
  onInlineTextEdit,
  onInlineMediaEdit,
  stickyMode = "scroll",
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: EditableSectionProps) {
  const { isPreview } = usePreview();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [generatingComponent, setGeneratingComponent] = useState<string | null>(null);
  const [toolbarY, setToolbarY] = useState(48);
  const [sectionHeight, setSectionHeight] = useState(0);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const activeEditableRef = useRef<HTMLElement | null>(null);
  const originalTextRef = useRef("");
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const pendingMediaRef = useRef<{
    oldSrc: string;
    mediaType: "image" | "video";
  } | null>(null);

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };
  const handleAddComponent = (sectionType: string) => {
    setGeneratingComponent(sectionType);
    window.setTimeout(() => {
      onAddSection(sectionType);
      setGeneratingComponent(null);
      setShowAddPopup(false);
    }, 1600);
  };
  const sectionName = label.charAt(0).toUpperCase() + label.slice(1);
  const canShowSectionAddButton = !["topbar", "header", "footer"].includes(
    label.toLowerCase(),
  );
  const shouldCenterToolbar = !canShowSectionAddButton;

  const finishInlineEdit = (element: HTMLElement, shouldSave: boolean) => {
    const oldText = originalTextRef.current;
    const newText = element.innerText.trim();

    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
    element.classList.remove(
      "outline",
      "outline-2",
      "outline-blue-500",
      "rounded-sm",
      "cursor-text",
    );

    activeEditableRef.current = null;
    originalTextRef.current = "";
    setIsInlineEditing(false);

    if (shouldSave && oldText && newText && oldText !== newText) {
      onInlineTextEdit(oldText, newText);
    } else if (!shouldSave) {
      element.innerText = oldText;
    }
  };

  const startInlineEdit = (element: HTMLElement) => {
    if (activeEditableRef.current === element) return;

    if (activeEditableRef.current) {
      finishInlineEdit(activeEditableRef.current, true);
    }

    originalTextRef.current = element.innerText.trim();
    activeEditableRef.current = element;
    setIsInlineEditing(true);

    element.setAttribute("contenteditable", "true");
    element.setAttribute("spellcheck", "false");
    element.classList.add(
      "outline",
      "outline-2",
      "outline-blue-500",
      "rounded-sm",
      "cursor-text",
    );
    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const handleInlineTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;

    const target = event.target as HTMLElement;

    if (target.closest("[data-editor-toolbar]")) return;
    if (target.closest("[data-editor-no-inline]")) return;

    const mediaElement = target.closest<HTMLElement>("[data-editor-media]");
    if (mediaElement && event.currentTarget.contains(mediaElement)) {
      const mediaType =
        mediaElement.dataset.editorMediaType === "video" ? "video" : "image";
      const oldSrc =
        mediaElement.dataset.editorMediaSrc ||
        mediaElement.getAttribute("src") ||
        "";

      if (!oldSrc) return;

      event.preventDefault();
      event.stopPropagation();
      pendingMediaRef.current = { oldSrc, mediaType };

      if (mediaInputRef.current) {
        mediaInputRef.current.accept =
          mediaType === "video" ? "video/*" : "image/*";
        mediaInputRef.current.click();
      }
      return;
    }

    const editableElement = target.closest<HTMLElement>(
      "h1,h2,h3,h4,h5,h6,p,span,a,button,li",
    );

    if (!editableElement || !event.currentTarget.contains(editableElement)) {
      return;
    }

    const text = editableElement.innerText.trim();

    if (!text) return;

    event.preventDefault();
    event.stopPropagation();
    startInlineEdit(editableElement);
  };

  const handleInlineTextBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target === activeEditableRef.current) {
      finishInlineEdit(target, true);
    }
  };

  const handleInlineTextKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;

    if (target !== activeEditableRef.current) return;

    if (event.key === "Enter") {
      event.preventDefault();
      finishInlineEdit(target, true);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finishInlineEdit(target, false);
    }
  };

  const handleMediaFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const pendingMedia = pendingMediaRef.current;

    if (!file || !pendingMedia) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onInlineMediaEdit(
          pendingMedia.oldSrc,
          reader.result,
          pendingMedia.mediaType,
          file.name,
        );
      }

      pendingMediaRef.current = null;
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handleSectionMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;

    const sectionRect = sectionRef.current?.getBoundingClientRect();
    if (!sectionRect) return;

    setSectionHeight(sectionRect.height);

    const halfToolbarHeight = TOOLBAR_HEIGHT / 2;
    const padding = 12;
    const minY = halfToolbarHeight + padding;
    const maxY = Math.max(
      minY,
      sectionRect.height - halfToolbarHeight - padding,
    );
    const cursorY = event.clientY - sectionRect.top + TOOLBAR_CURSOR_GAP;

    setToolbarY(Math.min(Math.max(cursorY, minY), maxY));
  };

  const isBottomToolbar =
    canShowSectionAddButton &&
    sectionHeight > 0 &&
    toolbarY >= sectionHeight - TOOLBAR_HEIGHT - BOTTOM_TOOLBAR_GAP;
  const normalizedLabel = label.toLowerCase();
  const sectionStackClass =
    normalizedLabel === "topbar"
      ? "z-[130]"
      : normalizedLabel === "header"
        ? "z-[120]"
        : "z-0";
  const sectionPositionClass =
    stickyMode === "sticky" ? "sticky top-0" : "relative";

  const addControlButtons = (
    <>
      <button
        type="button"
        aria-label={`Add component after ${sectionName}`}
        data-editor-toolbar
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setShowAddPopup(true);
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-500 bg-white text-slate-900 shadow-sm transition hover:scale-105 hover:bg-slate-100"
      >
        <Plus size={18} />
      </button>
      {canMoveUp && (
        <button
          type="button"
          aria-label={`Move ${sectionName} up`}
          title={`Move ${sectionName} up`}
          onClick={onMoveUp}
          className="flex h-8 w-11 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-100 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Play size={15} className="rotate-150" />
        </button>
      )}

      {canMoveDown && (
        <button
          type="button"
          aria-label={`Move ${sectionName} down`}
          title={`Move ${sectionName} down`}
          onClick={onMoveDown}
          className="flex h-8 w-11 shrink-0 items-center justify-center rounded-full border border-gray-400 bg-gray-100 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Play size={15} className="rotate-90" />
        </button>
      )}
    </>
  );

  const editDeleteControls = (
    <>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
        {label} :
      </span>

      <button
        type="button"
        onClick={onEdit}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
      >
        <Edit size={13} />
        Edit
      </button>

      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
      >
        <Trash size={13} />
        Delete
      </button>
    </>
  );

  return (
    <div
      ref={sectionRef}
      className={`group isolate ${sectionPositionClass} ${sectionStackClass}`}
      onMouseMove={handleSectionMouseMove}
    >
      {!isPreview && (
        <input
          ref={mediaInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          onChange={handleMediaFileChange}
        />
      )}
      {!isPreview && !isInlineEditing && (
        <div
          data-editor-toolbar
          className="pointer-events-none invisible absolute inset-0 z-40 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
        >
          {isBottomToolbar ? (
            <div className="absolute bottom-3 left-1/2 flex w-[min(94vw,520px)] -translate-x-1/2 items-center justify-center gap-3">
              <div className="pointer-events-auto flex h-12 shrink-0 items-center gap-3 rounded-full border border-slate-400 bg-gray-100 px-4 shadow-lg">
                {addControlButtons}
              </div>

              <div className="pointer-events-auto flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 shadow-lg">
                {editDeleteControls}
              </div>
            </div>
          ) : (
            <div
              className="absolute left-0 right-0 flex -translate-y-1/2 justify-center py-0"
              style={{ top: shouldCenterToolbar ? "50%" : toolbarY }}
            >
              <div
                className="pointer-events-auto flex h-10 items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-3 py-1 shadow-lg"
                style={{ maxWidth: TOOLBAR_WIDTH }}
              >
                {editDeleteControls}
              </div>
            </div>
          )}
        </div>
      )}

      {!isPreview && canShowSectionAddButton && !isBottomToolbar && !isInlineEditing && (
        <div className="absolute bottom-3 left-1/2 z-[999] flex h-14 px-6 rounded-full gap-3 -translate-x-1/2 items-center justify-center bg-gray-100 border border-gray-500 opacity-0 transition-all duration-300 group-hover:opacity-100">
          {addControlButtons}
        </div>
      )}

      {showDeleteConfirm &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[10001] flex items-center justify-center px-4">
            <div className="pointer-events-auto w-[min(92vw,390px)] rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                Delete {sectionName}
              </p>

              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                Are you sure you want to delete {label} section?
              </h3>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-full bg-red-600 px-7 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full border border-slate-300 px-7 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showAddPopup &&
        createPortal(
          <div className="fixed inset-0 z-[10002] bg-[#fff6df] px-5 py-5">
            <div className="relative mx-auto h-full max-w-6xl overflow-y-auto">
              <button
                type="button"
                aria-label="Close add component popup"
                onClick={() => setShowAddPopup(false)}
                className="absolute right-2 top-2 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-slate-700 hover:bg-amber-100"
              >
                <X size={18} />
              </button>

              <div className="grid gap-x-16 gap-y-10 px-6 pt-12 sm:grid-cols-2 lg:grid-cols-3">
                {addableSectionCards.map((item) => (
                  <AddComponentCard
                    key={item.type}
                    type={item.type}
                    title={item.title}
                    onClick={() => handleAddComponent(item.type)}
                  />
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {generatingComponent &&
        createPortal(
          <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm" role="status" aria-live="polite">
            <div className="w-[min(92vw,420px)] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <h3 className="mt-5 text-xl font-semibold text-slate-950">Generating component</h3>
              <p className="mt-2 text-sm text-slate-500">Preparing your {generatingComponent} section...</p>
            </div>
          </div>,
          document.body,
        )}

      <div
        className="relative z-0"
        onClick={handleInlineTextClick}
        onBlur={handleInlineTextBlur}
        onKeyDown={handleInlineTextKeyDown}
      >
        {children}
      </div>
    </div>
  );
}

function AddComponentCard({
  type,
  title,
  onClick,
}: {
  type: string;
  title: string;
  onClick: () => void;
}) {
  const previewSection = createAddableSection(type, "Realestate");
  const Component = previewSection
    ? getSectionComponent(
        "Realestate",
        previewSection.type,
        previewSection.variant,
      )
    : null;
  const defaultVariant = previewSection
    ? `${previewSection.type}-1`
    : undefined;
  const data =
    previewSection && defaultVariant
      ? (previewSection.data[previewSection.variant] ??
        previewSection.data[defaultVariant])
      : undefined;

  return (
    <button type="button" onClick={onClick} className="group text-left">
      <div className="aspect-[16/9] overflow-hidden rounded-[28px] border-[5px] border-[#202020] bg-white transition group-hover:-translate-y-1 group-hover:bg-white/60">
        {Component ? (
          <div className="h-[520px] w-[1200px] origin-top-left scale-[0.28] bg-white">
            {createElement(Component, { data })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-700">
            {title}
          </div>
        )}
      </div>

      <p className="mt-4 text-base font-semibold text-[#202020]">{title}</p>
    </button>
  );
}
