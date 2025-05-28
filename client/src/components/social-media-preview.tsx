import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Link2, ExternalLink } from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import { getOgTagsStatus, getTwitterCardStatus } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SocialMediaPreviewProps {
  url: string;
  tags: Record<string, string>;
}

export default function SocialMediaPreview({ url, tags }: SocialMediaPreviewProps) {
  const ogTagsStatus = getOgTagsStatus(tags);
  const twitterCardStatus = getTwitterCardStatus(tags);
  
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <div>
      <Card className="card-fylle overflow-hidden shadow-md">
        <div className="h-1 w-full bg-gradient-to-r from-[#b2f83b] to-[#d1f96d]"></div>
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 bg-[#f9fef0] border-b border-[#eafcd1]">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center">
            <Share2 className="text-[#d1f96d] mr-2 flex-shrink-0" />
            <span className="truncate text-[#03071C]">Social Media Preview</span>
          </CardTitle>
        </CardHeader>
      
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="facebook" className="w-full">
            <TabsList className="border-b border-gray-700 mb-4 sm:mb-6 w-full justify-start space-x-2 sm:space-x-5 rounded-none bg-transparent p-0 overflow-x-auto flex-nowrap">
              <TabsTrigger 
                value="facebook" 
                className="rounded-none border-b-2 border-transparent px-1 py-1 sm:py-2 data-[state=active]:border-[#d1f96d] data-[state=active]:bg-[#f9fef0] data-[state=active]:text-[#03071C] text-white flex-shrink-0"
              >
                <SiFacebook className="mr-1" /> <span className="text-xs sm:text-sm">Facebook</span>
              </TabsTrigger>
              <TabsTrigger 
                value="twitter" 
                className="rounded-none border-b-2 border-transparent px-1 py-1 sm:py-2 data-[state=active]:border-[#d1f96d] data-[state=active]:bg-[#f9fef0] data-[state=active]:text-[#03071C] text-white flex-shrink-0"
              >
                <SiX className="mr-1" /> <span className="text-xs sm:text-sm">Twitter</span>
              </TabsTrigger>
              <TabsTrigger 
                value="linkedin" 
                className="rounded-none border-b-2 border-transparent px-1 py-1 sm:py-2 data-[state=active]:border-[#d1f96d] data-[state=active]:bg-[#f9fef0] data-[state=active]:text-[#03071C] text-white flex-shrink-0"
              >
                <SiLinkedin className="mr-1" /> <span className="text-xs sm:text-sm">LinkedIn</span>
              </TabsTrigger>
            </TabsList>
          
            {/* Facebook Tab */}
            <TabsContent value="facebook" className="space-y-4 mt-0">
              <div className="w-full mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-32 sm:h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-3xl sm:text-4xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white p-3 border-t border-gray-300">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1 truncate">{getDomain(url)}</div>
                  <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">
                    {tags['og:title'] || tags.title || 'No title found'}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-snug line-clamp-2">
                    {tags['og:description'] || tags.description || 'No description found'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      ogTagsStatus.title === 'good' ? 'bg-[#d1f96d]' : 
                      ogTagsStatus.title === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">og:title</h3>
                    {ogTagsStatus.title === 'good' && (
                      <p className="text-sm text-white">Great! You have an og:title tag.</p>
                    )}
                    {ogTagsStatus.title === 'warning' && (
                      <p className="text-sm text-white">Using regular title as fallback. Add an og:title for better sharing.</p>
                    )}
                    {ogTagsStatus.title === 'error' && (
                      <p className="text-sm text-white">Missing og:title tag. This is important for social sharing.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      ogTagsStatus.description === 'good' ? 'bg-[#d1f96d]' : 
                      ogTagsStatus.description === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">og:description</h3>
                    {ogTagsStatus.description === 'good' && (
                      <p className="text-sm text-white">Great! You have an og:description tag.</p>
                    )}
                    {ogTagsStatus.description === 'warning' && (
                      <p className="text-sm text-white">Using regular description as fallback. Add an og:description for better sharing.</p>
                    )}
                    {ogTagsStatus.description === 'error' && (
                      <p className="text-sm text-white">Missing og:description tag. This is important for social sharing.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      ogTagsStatus.image === 'good' ? 'bg-[#d1f96d]' : 
                      ogTagsStatus.image === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">og:image</h3>
                    {ogTagsStatus.image === 'good' && (
                      <p className="text-sm text-white">Great! You have an og:image tag.</p>
                    )}
                    {ogTagsStatus.image === 'warning' && (
                      <p className="text-sm text-white">Your og:image may not be optimal size. Aim for 1200×630 pixels.</p>
                    )}
                    {ogTagsStatus.image === 'error' && (
                      <p className="text-sm text-white">Missing og:image tag. Social posts with images get more engagement.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Twitter Tab */}
            <TabsContent value="twitter" className="space-y-4 mt-0">
              <div className="w-full mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-32 sm:h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-3xl sm:text-4xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white p-3 border-t border-gray-300">
                  <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">
                    {tags['twitter:title'] || tags['og:title'] || tags.title || 'No title found'}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-snug line-clamp-2">
                    {tags['twitter:description'] || tags['og:description'] || tags.description || 'No description found'}
                  </p>
                  <div className="text-gray-500 text-xs mt-2 truncate">{getDomain(url)}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      twitterCardStatus.card === 'good' ? 'bg-[#d1f96d]' : 
                      twitterCardStatus.card === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">twitter:card</h3>
                    {twitterCardStatus.card === 'good' && (
                      <p className="text-sm text-white">Great! You have a twitter:card tag.</p>
                    )}
                    {twitterCardStatus.card === 'error' && (
                      <p className="text-sm text-white">Missing twitter:card tag. This defines how your content appears on Twitter.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      twitterCardStatus.title === 'good' ? 'bg-[#d1f96d]' : 
                      twitterCardStatus.title === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">twitter:title</h3>
                    {twitterCardStatus.title === 'good' && (
                      <p className="text-sm text-white">Great! You have a twitter:title tag.</p>
                    )}
                    {twitterCardStatus.title === 'warning' && (
                      <p className="text-sm text-white">Using og:title as fallback. Add a twitter:title for better Twitter sharing.</p>
                    )}
                    {twitterCardStatus.title === 'error' && (
                      <p className="text-sm text-white">Missing twitter:title tag. This affects how your content appears on Twitter.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      twitterCardStatus.image === 'good' ? 'bg-[#d1f96d]' : 
                      twitterCardStatus.image === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">twitter:image</h3>
                    {twitterCardStatus.image === 'good' && (
                      <p className="text-sm text-white">Great! You have a twitter:image tag.</p>
                    )}
                    {twitterCardStatus.image === 'warning' && (
                      <p className="text-sm text-white">Using og:image as fallback. Add a twitter:image for better Twitter sharing.</p>
                    )}
                    {twitterCardStatus.image === 'error' && (
                      <p className="text-sm text-white">Missing twitter:image tag. Tweets with images get more engagement.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* LinkedIn Tab */}
            <TabsContent value="linkedin" className="space-y-4 mt-0">
              <div className="w-full mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-32 sm:h-48 bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-3xl sm:text-4xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white p-3 border-t border-gray-300">
                  <div className="text-gray-500 text-xs uppercase tracking-wider mb-1 truncate">{getDomain(url)}</div>
                  <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">
                    {tags['og:title'] || tags.title || 'No title found'}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-snug line-clamp-2">
                    {tags['og:description'] || tags.description || 'No description found'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      ogTagsStatus.title === 'good' ? 'bg-[#d1f96d]' : 
                      ogTagsStatus.title === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">og:title</h3>
                    {ogTagsStatus.title === 'good' && (
                      <p className="text-sm text-white">Great! You have an og:title tag for LinkedIn sharing.</p>
                    )}
                    {ogTagsStatus.title === 'warning' && (
                      <p className="text-sm text-white">Using regular title as fallback. Add an og:title for better LinkedIn sharing.</p>
                    )}
                    {ogTagsStatus.title === 'error' && (
                      <p className="text-sm text-white">Missing og:title tag. This is important for LinkedIn sharing.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      ogTagsStatus.description === 'good' ? 'bg-[#d1f96d]' : 
                      ogTagsStatus.description === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">og:description</h3>
                    {ogTagsStatus.description === 'good' && (
                      <p className="text-sm text-white">Great! You have an og:description tag for LinkedIn sharing.</p>
                    )}
                    {ogTagsStatus.description === 'warning' && (
                      <p className="text-sm text-white">Using regular description as fallback. Add an og:description for better LinkedIn sharing.</p>
                    )}
                    {ogTagsStatus.description === 'error' && (
                      <p className="text-sm text-white">Missing og:description tag. This is important for LinkedIn sharing.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${
                      ogTagsStatus.image === 'good' ? 'bg-[#d1f96d]' : 
                      ogTagsStatus.image === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#03071C]">og:image</h3>
                    {ogTagsStatus.image === 'good' && (
                      <p className="text-sm text-white">Great! You have an og:image tag for LinkedIn sharing.</p>
                    )}
                    {ogTagsStatus.image === 'warning' && (
                      <p className="text-sm text-white">Your og:image may not be optimal size. Aim for 1200×630 pixels for LinkedIn.</p>
                    )}
                    {ogTagsStatus.image === 'error' && (
                      <p className="text-sm text-white">Missing og:image tag. LinkedIn posts with images get more engagement.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}