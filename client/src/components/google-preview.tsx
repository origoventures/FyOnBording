import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDescriptionStatus, getTitleStatus } from "@/lib/utils";
import { SiGoogle } from "react-icons/si";
import TagStatusIndicator from "./tag-status-indicator";

interface GooglePreviewProps {
  url: string;
  title?: string;
  description?: string;
}

export default function GooglePreview({ url, title, description }: GooglePreviewProps) {
  const titleStatus = getTitleStatus(title);
  const descriptionStatus = getDescriptionStatus(description);
  
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <Card className="card-fylle overflow-hidden">
      <div className="h-1 w-full bg-[#d1f96d]"></div>
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 bg-[#f9fef0] border-b border-[#eafcd1]">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center">
          <SiGoogle className="text-[#d1f96d] mr-2 flex-shrink-0" />
          <span className="truncate text-[#03071C]">Google Search Preview</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        <div className="w-full mx-auto border border-gray-200 rounded p-3 sm:p-4 shadow-sm bg-white">
          <div className="mb-1 text-lg sm:text-xl text-blue-700 hover:underline cursor-pointer font-medium line-clamp-2">
            {title || "No title tag found"}
          </div>
          <div className="text-green-800 text-xs sm:text-sm mb-1 break-all">{url}</div>
          <div className="text-xs sm:text-sm text-gray-600 line-clamp-3">
            {description || "No description tag found"}
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-start">
            <div className="mr-3 mt-1 flex-shrink-0">
              <div className={`w-4 h-4 rounded-full ${
                titleStatus === 'good' ? 'bg-[#d1f96d]' : 
                titleStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>
            <div>
              <h3 className="font-medium text-[#03071C]">Title Tag</h3>
              {titleStatus === 'good' && (
                <p className="text-sm text-white">Great! Your title is the right length (40-60 characters).</p>
              )}
              {titleStatus === 'warning' && title && title.length < 30 && (
                <p className="text-sm text-white">Your title is too short. Aim for 30-60 characters.</p>
              )}
              {titleStatus === 'warning' && title && title.length > 60 && (
                <p className="text-sm text-white">Your title is too long. Google may truncate it. Aim for 30-60 characters.</p>
              )}
              {titleStatus === 'error' && (
                <p className="text-sm text-white">Missing title tag. This is critical for SEO.</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-3 mt-1 flex-shrink-0">
              <div className={`w-4 h-4 rounded-full ${
                descriptionStatus === 'good' ? 'bg-[#d1f96d]' : 
                descriptionStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>
            <div>
              <h3 className="font-medium text-[#03071C]">Meta Description</h3>
              {descriptionStatus === 'good' && (
                <p className="text-sm text-white">Great! Your description is well-written and the right length.</p>
              )}
              {descriptionStatus === 'warning' && description && description.length < 120 && (
                <p className="text-sm text-white">Your description is too short. Aim for 120-160 characters.</p>
              )}
              {descriptionStatus === 'warning' && description && description.length > 160 && (
                <p className="text-sm text-white">Your description is too long. Google may truncate it. Aim for 120-160 characters.</p>
              )}
              {descriptionStatus === 'error' && (
                <p className="text-sm text-white">Missing meta description. This is important for click-through rates.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
