import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Check, AlertTriangle, X, 
  ChevronDown, ChevronUp, 
  ExternalLink, ArrowUpRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TagStatus } from "@shared/schema";

export interface CategorySummary {
  name: string;
  icon: React.ReactNode;
  score: number;
  status: TagStatus;
  items: {
    name: string;
    status: TagStatus;
  }[];
}

interface SeoCategorySummaryProps {
  categories: CategorySummary[];
}

export default function SeoCategorySummary({ categories }: SeoCategorySummaryProps) {
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const getStatusColorClass = (status: TagStatus): string => {
    switch (status) {
      case "good":
        return "bg-[#d1f96d]";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIconClass = (status: TagStatus): string => {
    switch (status) {
      case "good":
        return "text-[#03071C]";
      case "warning":
        return "text-white";
      case "error":
        return "text-white";
      default:
        return "text-white";
    }
  };

  const getStatusIcon = (status: TagStatus) => {
    switch (status) {
      case "good":
        return <Check className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      case "warning":
        return <AlertTriangle className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      case "error":
        return <X className={`h-4 w-4 ${getStatusIconClass(status)}`} />;
      default:
        return null;
    }
  };

  const getColorBasedOnScore = (score: number): string => {
    if (score >= 80) return "bg-gradient-to-r from-[#b2f83b] to-[#d1f96d]";
    if (score >= 50) return "bg-gradient-to-r from-yellow-400 to-yellow-500";
    return "bg-gradient-to-r from-red-400 to-red-500";
  };
  
  const getBorderColorClass = (status: TagStatus): string => {
    switch (status) {
      case "good":
        return "border-[#d1f96d]";
      case "warning":
        return "border-yellow-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-500";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {categories.map((category) => (
        <motion.div 
          key={category.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Card 
            className={`overflow-hidden h-full shadow-md hover:shadow-lg transition-all duration-300 border-t-2 ${getBorderColorClass(category.status)}`}
          >
            <div className="h-1 w-full" style={{ background: getColorBasedOnScore(category.score) }}></div>
            <CardContent className="p-4 sm:p-6">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${getStatusColorClass(category.status)} shadow-sm`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#03071C]">{category.name}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="outline"
                    className={`text-sm font-medium px-3 py-1 border ${getBorderColorClass(category.status)}`}
                  >
                    <span className="font-bold">{category.score}</span>
                    <span className="ml-1 opacity-70">pts</span>
                  </Badge>
                  {expandedCategories[category.name] ? 
                    <ChevronUp className="h-5 w-5 text-[#03071C] opacity-70" /> : 
                    <ChevronDown className="h-5 w-5 text-[#03071C] opacity-70" />
                  }
                </div>
              </div>

              <div className="mb-4">
                <Progress
                  value={category.score}
                  className="h-2.5 rounded-full"
                  indicatorClassName={`${getColorBasedOnScore(category.score)} rounded-full transition-all duration-1000 ease-in-out`}
                />
              </div>

              <AnimatePresence>
                {(expandedCategories[category.name] || category.items.length <= 3) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    {category.items.map((item) => (
                      <motion.div 
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${getStatusColorClass(
                            item.status
                          )} shadow-sm`}
                        >
                          {getStatusIcon(item.status)}
                        </div>
                        <span className="text-sm font-medium text-[#03071C]">{item.name}</span>
                      </motion.div>
                    ))}
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-2 text-center"
                    >
                      <a href="#" className="inline-flex items-center text-xs text-[#03071C] hover:text-[#d1f96d] transition-colors">
                        <span>Learn more about {category.name} optimization</span>
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </a>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!expandedCategories[category.name] && category.items.length > 3 && (
                <div className="mt-3 text-center">
                  <button 
                    onClick={() => toggleCategory(category.name)}
                    className="text-xs text-gray-500 hover:text-[#03071C] inline-flex items-center transition-colors"
                  >
                    <span>Show all {category.items.length} items</span>
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}