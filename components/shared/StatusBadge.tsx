"use client";

import { getEstadoColor, getEstadoLabel } from "@/lib/utils/format";

interface StatusBadgeProps {
  estado: string;
  className?: string;
}

export function StatusBadge({ estado, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getEstadoColor(estado)} ${className}`}
    >
      {getEstadoLabel(estado)}
    </span>
  );
}
