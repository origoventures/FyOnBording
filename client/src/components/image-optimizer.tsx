import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ImageAuditResult, ImageData, ImageConversionJob } from '@shared/schema';
import { Loader2, Image as ImageIcon, AlertCircle, CheckCircle, FileWarning } from 'lucide-react';

export default function ImageOptimizer() {
  const [url, setUrl] = useState('');
  const [directoryPath, setDirectoryPath] = useState('./public/images');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [conversionSettings, setConversionSettings] = useState({
    quality: 80,
    maxWidth: 1280,
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [auditTab, setAuditTab] = useState<'url' | 'directory'>('url');

  // Query to audit images from a URL
  const {
    data: urlAuditResult,
    isLoading: isUrlAuditLoading,
    isError: isUrlAuditError,
    refetch: refetchUrlAudit,
  } = useQuery({
    queryKey: ['image-audit-url', url],
    queryFn: async () => {
      if (!url) return null;
      return apiRequest<ImageAuditResult>({
        url: '/api/images/audit',
        method: 'POST',
        data: { url },
      });
    },
    enabled: false,
  });

  // Query to audit images from a directory
  const {
    data: directoryAuditResult,
    isLoading: isDirectoryAuditLoading,
    isError: isDirectoryAuditError,
    refetch: refetchDirectoryAudit,
  } = useQuery({
    queryKey: ['image-audit-directory', directoryPath],
    queryFn: async () => {
      if (!directoryPath) return null;
      return apiRequest<ImageAuditResult>({
        url: '/api/images/audit',
        method: 'POST',
        data: { path: directoryPath },
      });
    },
    enabled: false,
  });

  // Mutation to convert images to WebP
  const convertMutation = useMutation({
    mutationFn: async (images: ImageData[]) => {
      return apiRequest<{ jobId: string }>({
        url: '/api/images/convert',
        method: 'POST',
        data: {
          images,
          options: conversionSettings,
        },
      });
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setActiveJobId(data.jobId);
        toast({
          title: 'Conversion started',
          description: `Job ID: ${data.jobId}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Conversion failed',
        description: error.message || 'Failed to start conversion job',
        variant: 'destructive',
      });
    },
  });

  // Query for job status
  const {
    data: jobStatus,
    isLoading: isJobStatusLoading,
    refetch: refetchJobStatus,
  } = useQuery({
    queryKey: ['image-job-status', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      return apiRequest<ImageConversionJob>({
        url: `/api/images/job/${activeJobId}`,
        method: 'GET',
      });
    },
    enabled: !!activeJobId,
    refetchInterval: activeJobId ? 3000 : false, // Poll every 3 seconds if we have an active job
  });

  const handleAuditUrl = () => {
    if (!url) {
      toast({
        title: 'URL required',
        description: 'Please enter a URL to audit',
        variant: 'destructive',
      });
      return;
    }
    refetchUrlAudit();
  };

  const handleAuditDirectory = () => {
    if (!directoryPath) {
      toast({
        title: 'Directory path required',
        description: 'Please enter a directory path to audit',
        variant: 'destructive',
      });
      return;
    }
    refetchDirectoryAudit();
  };

  const handleConvertSelected = () => {
    const images: ImageData[] = [];
    const auditResult = auditTab === 'url' ? urlAuditResult : directoryAuditResult;

    if (!auditResult) {
      toast({
        title: 'No audit results',
        description: 'Please audit images first',
        variant: 'destructive',
      });
      return;
    }

    if (selectedImages.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select at least one image to convert',
        variant: 'destructive',
      });
      return;
    }

    auditResult.images.forEach((image) => {
      if (selectedImages.includes(image.src)) {
        images.push(image);
      }
    });

    convertMutation.mutate(images);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const auditResult = auditTab === 'url' ? urlAuditResult : directoryAuditResult;
    if (auditResult) {
      if (e.target.checked) {
        setSelectedImages(auditResult.images.map((img) => img.src));
      } else {
        setSelectedImages([]);
      }
    }
  };

  const handleImageSelection = (src: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedImages([...selectedImages, src]);
    } else {
      setSelectedImages(selectedImages.filter((imgSrc) => imgSrc !== src));
    }
  };

  const isLoading = isUrlAuditLoading || isDirectoryAuditLoading || convertMutation.isPending;
  const auditResult = auditTab === 'url' ? urlAuditResult : directoryAuditResult;
  const isAuditError = auditTab === 'url' ? isUrlAuditError : isDirectoryAuditError;

  // Calculate job progress percentage
  const progressPercentage = jobStatus
    ? Math.round((jobStatus.completed / (jobStatus.total || 1)) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Image Optimizer</CardTitle>
          <CardDescription>
            Audit, analyze, and optimize images to improve website performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audit" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="audit">Audit Images</TabsTrigger>
              <TabsTrigger value="optimize">Optimize & Convert</TabsTrigger>
              {activeJobId && (
                <TabsTrigger value="status">Conversion Status</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="audit">
              <div className="mb-6">
                <Tabs value={auditTab} onValueChange={(val) => setAuditTab(val as 'url' | 'directory')}>
                  <TabsList>
                    <TabsTrigger value="url">Audit URL</TabsTrigger>
                    <TabsTrigger value="directory">Audit Directory</TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        placeholder="Enter website URL (e.g., https://example.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button onClick={handleAuditUrl} disabled={isLoading}>
                        {isUrlAuditLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Auditing...
                          </>
                        ) : (
                          'Audit Images'
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="directory" className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        placeholder="Enter directory path (e.g., ./public/images)"
                        value={directoryPath}
                        onChange={(e) => setDirectoryPath(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button onClick={handleAuditDirectory} disabled={isLoading}>
                        {isDirectoryAuditLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Auditing...
                          </>
                        ) : (
                          'Audit Images'
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {isAuditError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Failed to audit images. Please try again.</span>
                  </div>
                </div>
              )}

              {auditResult && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">
                      Audit Results - {auditResult.images.length} Images Found
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="select-all"
                        onChange={handleSelectAll}
                        checked={
                          auditResult.images.length > 0 &&
                          selectedImages.length === auditResult.images.length
                        }
                      />
                      <label htmlFor="select-all">Select All</label>
                    </div>
                  </div>

                  <div className="bg-muted p-4 mb-4 rounded-md">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Source</p>
                        <p className="font-medium">
                          {auditTab === 'url' ? auditResult.url : auditResult.path}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="font-medium">{auditResult.totalOriginalSize.toFixed(2)} KB</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Images with Issues</p>
                        <p className="font-medium">
                          {auditResult.images.filter((img) => img.flags.length > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {auditResult.images.length > 0 ? (
                    <div className="divide-y">
                      {auditResult.images.map((image, index) => (
                        <div key={index} className="py-3 grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1">
                            <Checkbox
                              id={`img-${index}`}
                              checked={selectedImages.includes(image.src)}
                              onCheckedChange={(checked) =>
                                handleImageSelection(image.src, checked === true)
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="relative aspect-square w-12 h-12 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                              {image.src ? (
                                image.src.startsWith('http') || image.src.startsWith('/') ? (
                                  <img
                                    src={image.src}
                                    alt={image.alt || 'Image'}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      e.currentTarget.src = '';
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.parentElement!.innerHTML = 
                                        '<div class="text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                )
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="col-span-5 overflow-hidden">
                            <p className="text-sm font-medium truncate" title={image.src}>
                              {image.src
                                ? image.src.split('/').pop() || image.src
                                : 'Unknown source'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {image.width}×{image.height} • {image.format.toUpperCase()} •{' '}
                              {image.sizeKB} KB
                            </p>
                          </div>
                          <div className="col-span-4 flex flex-wrap gap-1">
                            {image.flags.includes('OVERSIZE') && (
                              <Badge variant="destructive" className="px-2 py-0 text-xs">
                                Oversized
                              </Badge>
                            )}
                            {image.flags.includes('MISSING_ALT') && (
                              <Badge variant="destructive" className="px-2 py-0 text-xs">
                                Missing Alt
                              </Badge>
                            )}
                            {image.flags.includes('NOT_WEBP') && (
                              <Badge variant="warning" className="px-2 py-0 text-xs bg-amber-500">
                                Not WebP
                              </Badge>
                            )}
                            {image.flags.length === 0 && (
                              <Badge variant="outline" className="px-2 py-0 text-xs">
                                Optimized
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-muted-foreground">No images found.</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="optimize">
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-4">Conversion Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="quality">Quality: {conversionSettings.quality}%</Label>
                      </div>
                      <Slider
                        id="quality"
                        min={1}
                        max={100}
                        step={1}
                        value={[conversionSettings.quality]}
                        onValueChange={(value) =>
                          setConversionSettings({
                            ...conversionSettings,
                            quality: value[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Smaller file</span>
                        <span>Better quality</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="max-width">
                          Max Width: {conversionSettings.maxWidth}px
                        </Label>
                      </div>
                      <Slider
                        id="max-width"
                        min={320}
                        max={2560}
                        step={10}
                        value={[conversionSettings.maxWidth]}
                        onValueChange={(value) =>
                          setConversionSettings({
                            ...conversionSettings,
                            maxWidth: value[0],
                          })
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Mobile-friendly</span>
                        <span>High resolution</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Selected Images</h3>
                  {selectedImages.length > 0 ? (
                    <div className="bg-muted p-4 rounded-md">
                      <p className="mb-2">
                        {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
                        for optimization
                      </p>
                      <Button
                        onClick={handleConvertSelected}
                        disabled={isLoading || selectedImages.length === 0}
                        className="mt-2"
                      >
                        {convertMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          'Convert to WebP'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-md text-center">
                      <p className="text-muted-foreground">
                        No images selected. Go to the Audit tab to select images for conversion.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {activeJobId && (
              <TabsContent value="status">
                <div className="space-y-6">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">Conversion Job Status</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Job ID: {activeJobId}
                    </p>

                    {isJobStatusLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : jobStatus ? (
                      <div>
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            {jobStatus.status === 'pending' && (
                              <Badge variant="outline" className="px-2 py-0">
                                Pending
                              </Badge>
                            )}
                            {jobStatus.status === 'processing' && (
                              <Badge variant="secondary" className="px-2 py-0">
                                Processing
                              </Badge>
                            )}
                            {jobStatus.status === 'completed' && (
                              <Badge variant="success" className="px-2 py-0 bg-green-500 text-white">
                                Completed
                              </Badge>
                            )}
                            {jobStatus.status === 'failed' && (
                              <Badge variant="destructive" className="px-2 py-0">
                                Failed
                              </Badge>
                            )}
                            <span>
                              {jobStatus.completed} of {jobStatus.total} images processed
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>

                        {jobStatus.error && (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            <div className="flex items-start">
                              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                              <div>
                                <p className="font-bold">Error</p>
                                <p>{jobStatus.error}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {jobStatus.status === 'completed' && jobStatus.results.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Results</h4>
                            <Accordion type="single" collapsible>
                              <AccordionItem value="results">
                                <AccordionTrigger>
                                  View optimized images ({jobStatus.results.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-4 mt-2">
                                    {jobStatus.results.map((result, index) => (
                                      <div
                                        key={index}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-md"
                                      >
                                        <div>
                                          <h5 className="font-medium mb-1">Original</h5>
                                          <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                                            <img
                                              src={result.src}
                                              alt={result.alt || 'Original image'}
                                              className="object-contain w-full h-full"
                                              onError={(e) => {
                                                e.currentTarget.src = '';
                                                e.currentTarget.parentElement!.innerHTML = 
                                                  '<div class="flex items-center justify-center h-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                              }}
                                            />
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {result.format.toUpperCase()} • {result.width}×
                                            {result.height} • {result.sizeKB.toFixed(2)} KB
                                          </p>
                                        </div>

                                        <div>
                                          <h5 className="font-medium mb-1">Optimized</h5>
                                          <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                                            {result.optimizedSrc ? (
                                              <img
                                                src={result.optimizedSrc}
                                                alt={result.alt || 'Optimized image'}
                                                className="object-contain w-full h-full"
                                                onError={(e) => {
                                                  e.currentTarget.src = '';
                                                  e.currentTarget.parentElement!.innerHTML = 
                                                    '<div class="flex items-center justify-center h-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                                }}
                                              />
                                            ) : (
                                              <div className="flex items-center justify-center h-full">
                                                <FileWarning className="h-8 w-8 text-gray-400" />
                                              </div>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            WebP • {result.optimizedSizeKB?.toFixed(2)} KB
                                            {result.savingsPercent !== undefined && (
                                              <span className="text-green-600 ml-2">
                                                {result.savingsPercent > 0
                                                  ? `(${result.savingsPercent}% smaller)`
                                                  : '(No reduction)'}
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        )}

                        {jobStatus.status === 'completed' && (
                          <Button
                            onClick={() => setActiveJobId(null)}
                            variant="outline"
                            className="mt-4"
                          >
                            Start New Optimization
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <span>
                            Could not retrieve job status. The job may have expired or been deleted.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>
            Images are converted to WebP format, which offers superior compression and quality
            compared to traditional formats like JPEG and PNG.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}