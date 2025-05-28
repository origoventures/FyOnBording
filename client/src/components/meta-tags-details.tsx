import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tag, Download, Copy, Check } from "lucide-react";
import { getTagStatus, getTagStatusText, getMissingTags } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MetaTagsDetailsProps {
  tags: Record<string, string>;
}

export default function MetaTagsDetails({ tags }: MetaTagsDetailsProps) {
  const { toast } = useToast();
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const missingTags = getMissingTags(tags);

  const copyToClipboard = (value: string, name: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedTag(name);
      toast({
        title: "Copied to clipboard",
        description: `The value for ${name} has been copied.`,
        duration: 3000,
      });
      setTimeout(() => setCopiedTag(null), 3000);
    });
  };

  const exportTags = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tags, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "seo-tags.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center">
          <Tag className="text-primary mr-2 flex-shrink-0" />
          <span className="truncate">All Meta Tags</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div className="text-sm text-white">
            Showing all detected meta tags and their values
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 hover:bg-primary/10 self-end sm:self-auto" 
            onClick={exportTags}
          >
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>
        
        {/* Meta Tags Table */}
        <div className="overflow-x-auto -mx-2 sm:-mx-4">
          <div className="inline-block min-w-full py-2 align-middle px-2 sm:px-4">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="py-2 sm:py-3 pl-3 sm:pl-4 pr-2 sm:pr-3 text-left text-xs sm:text-sm font-semibold text-white">Tag Name</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">Value</th>
                    <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-white">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-900">
                  {Object.entries(tags).map(([name, value]) => (
                    <tr key={name}>
                      <td className="whitespace-nowrap py-2 sm:py-3 pl-3 sm:pl-4 pr-2 sm:pr-3 text-xs sm:text-sm font-medium text-white">
                        {name}
                      </td>
                      <td className="whitespace-normal break-all py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm text-white max-w-[8rem] sm:max-w-xs">
                        <div className="flex flex-col">
                          <div className="overflow-hidden">
                            <div className="group relative">
                              <p className="text-white line-clamp-2 cursor-pointer">{value}</p>
                              <div className="hidden group-hover:block absolute z-10 bg-blue-900 text-white p-2 rounded-md text-xs max-w-sm shadow-lg left-0 top-full mt-1">
                                <p className="break-all font-medium">{value}</p>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 mt-1 h-5 sm:h-6 px-1 sm:px-2 w-fit"
                            onClick={() => copyToClipboard(value, name)}
                          >
                            {copiedTag === name ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                            {copiedTag === name ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm">
                        <Badge
                          variant={
                            getTagStatus(name, value) === 'good' ? 'success' :
                            getTagStatus(name, value) === 'warning' ? 'warning' : 'error'
                          }
                          className="px-1 sm:px-2 py-0.5 sm:py-1 text-xs"
                        >
                          {getTagStatusText(getTagStatus(name, value))}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Missing Tags Section */}
        {missingTags.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-white mb-4">Recommended Missing Tags</h3>
            <div className="space-y-3">
              {missingTags.map(tag => (
                <Alert variant="default" key={tag.name} className="bg-amber-50 border border-amber-200">
                  <div className="flex items-start">
                    <div className="mr-2 mt-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-amber-400"></span>
                    </div>
                    <div>
                      <AlertTitle className="text-amber-900 font-semibold">{tag.name}</AlertTitle>
                      <AlertDescription className="text-amber-800">
                        {tag.description}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
