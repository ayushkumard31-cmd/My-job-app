"use client";

// Pointer-event based drag & drop list — works with a mouse and with a finger,
// which matters because most students will use this on a phone.
//
// Pointer events are handled once on the container and routed by looking up the
// row the drag handle belongs to, so no per-row handlers are created in render.

import { useCallback, useRef, useState } from "react";

const ROW_ATTR = "data-sortable-row";

export default function SortableList({ items, getKey, onReorder, renderItem, className = "" }) {
  const listRef = useRef(null);
  // Measurements live in state, not a ref, because render reads them to decide
  // how far each row slides out of the way.
  const [drag, setDrag] = useState(null); // {index, startY, dy, target, rects}

  const onPointerDown = useCallback((e) => {
    if (e.button != null && e.button !== 0) return;
    const handle = e.target.closest?.("[data-drag-handle]");
    if (!handle) return;
    const row = handle.closest(`[${ROW_ATTR}]`);
    const list = listRef.current;
    if (!row || !list) return;

    const rows = Array.from(list.children);
    const index = rows.indexOf(row);
    if (index < 0) return;

    list.setPointerCapture?.(e.pointerId);
    setDrag({
      index,
      startY: e.clientY,
      dy: 0,
      target: index,
      rects: rows.map((n) => n.getBoundingClientRect()),
    });
  }, []);

  const onPointerMove = useCallback((e) => {
    const y = e.clientY;
    setDrag((d) => {
      if (!d) return d;
      const dy = y - d.startY;
      const own = d.rects[d.index];
      if (!own) return { ...d, dy };
      const center = own.top + own.height / 2 + dy;
      let target = d.rects.findIndex((r) => r && center < r.top + r.height / 2);
      if (target === -1) target = d.rects.length - 1;
      return { ...d, dy, target };
    });
  }, []);

  const onPointerUp = useCallback(() => {
    setDrag((d) => {
      if (d && d.target !== d.index) onReorder(d.index, d.target);
      return null;
    });
  }, [onReorder]);

  const offsetFor = (i) => {
    if (!drag) return 0;
    const h = drag.rects[drag.index]?.height || 0;
    const gap = 8;
    if (i === drag.index) return drag.dy;
    if (drag.index < drag.target && i > drag.index && i <= drag.target) return -(h + gap);
    if (drag.index > drag.target && i >= drag.target && i < drag.index) return h + gap;
    return 0;
  };

  const handleProps = {
    "data-drag-handle": "true",
    style: { touchAction: "none", cursor: drag ? "grabbing" : "grab" },
  };

  return (
    <div
      ref={listRef}
      className={`flex flex-col gap-2 ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={drag ? onPointerMove : undefined}
      onPointerUp={drag ? onPointerUp : undefined}
      onPointerCancel={drag ? onPointerUp : undefined}
    >
      {items.map((item, i) => {
        const active = drag?.index === i;
        return (
          <div
            key={getKey(item, i)}
            {...{ [ROW_ATTR]: i }}
            className={active ? "dragging" : ""}
            style={{
              transform: `translateY(${offsetFor(i)}px)`,
              transition: active ? "none" : "transform .18s ease",
            }}
          >
            {renderItem(item, i, { dragging: active, handleProps })}
          </div>
        );
      })}
    </div>
  );
}

export function reorder(list, from, to) {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
