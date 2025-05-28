import React from "react";
import { TagStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TagStatusIndicatorProps {
  status: TagStatus;
  count: number;
  label: string;
  icon: React.ReactNode;
}

export default function TagStatusIndicator({ status, count, label, icon }: TagStatusIndicatorProps) {
  const getBgColor = (status: TagStatus, active: boolean) => {
    if (!active) return "bg-gray-100 text-gray-400";
    
    switch (status) {
      case "good": return "bg-green-100 text-green-600";
      case "warning": return "bg-yellow-100 text-yellow-600";
      case "error": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-400";
    }
  };

  const isActive = count > 0;

  return (
    <div className="px-2 w-full sm:w-1/3 mb-4 sm:mb-0">
      <div className="flex items-center">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center mr-3",
          getBgColor(status, isActive)
        )}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="font-semibold">{count}</p>
        </div>
      </div>
    </div>
  );
}
