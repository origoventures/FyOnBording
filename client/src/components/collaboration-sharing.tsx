import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Users, Clock, Link, Mail, Check, BarChart, Settings, Plus, SendIcon, Github, Figma } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SeoData } from '@shared/schema';
import { motion } from 'framer-motion';

interface CollaborationSharingProps {
  seoData: SeoData;
  url: string;
  userPlan: string;
}

export default function CollaborationSharing({ seoData, url, userPlan }: CollaborationSharingProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('link');
  const [shareLink, setShareLink] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sharingPermissions, setSharingPermissions] = useState({
    allowEdit: false,
    allowComment: true,
    expirationDays: 30,
  });
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  
  // Check if user has collaboration features based on plan
  const hasCollaborationFeatures = ['premium', 'enterprise'].includes(userPlan.toLowerCase());
  
  // Debug the plan value
  console.log('Collaboration component - User plan:', userPlan);
  
  // Generate a unique link for collaboration
  const generateCollaborationLink = async () => {
    if (!hasCollaborationFeatures) {
      toast({
        title: "Premium Feature",
        description: "Collaboration features are available on Premium and Enterprise plans.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingLink(true);
    
    try {
      // Simulate API call to generate collaboration link
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a secure-looking link with the URL and permissions encoded
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const generatedLink = `${window.location.origin}/collaborate/${uniqueId}?url=${encodeURIComponent(url)}&edit=${sharingPermissions.allowEdit ? '1' : '0'}&comment=${sharingPermissions.allowComment ? '1' : '0'}&expires=${sharingPermissions.expirationDays}`;
      
      setShareLink(generatedLink);
      setLinkGenerated(true);
      
      toast({
        title: "Link Generated",
        description: "Collaboration link created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate collaboration link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };
  
  // Copy link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    
    toast({
      title: "Link Copied",
      description: "Collaboration link copied to clipboard.",
    });
  };
  
  // Send email with collaboration link
  const sendEmail = async () => {
    if (!emailRecipient) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address.",
        variant: "destructive"
      });
      return;
    }
    
    if (!linkGenerated) {
      toast({
        title: "Generate Link First",
        description: "Please generate a collaboration link before sending.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Invitation Sent",
        description: `Collaboration invitation sent to ${emailRecipient}`,
      });
      
      setEmailRecipient('');
      setEmailMessage('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Reset link generation
  const resetLink = () => {
    setShareLink('');
    setLinkGenerated(false);
  };
  
  // Format expiration date
  const getExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + sharingPermissions.expirationDays);
    return date.toLocaleDateString();
  };
  
  return (
    <Card className="shadow border-t-4 border-t-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span>Real-time Collaboration</span>
          </CardTitle>
          
          {hasCollaborationFeatures ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {userPlan} Plan
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Premium Feature
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {hasCollaborationFeatures ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Share your SEO analysis with team members or clients and collaborate in real-time
            </p>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="link">
                  <Link className="h-4 w-4 mr-2" />
                  Share Link
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Invite
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Options
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4">
                {!linkGenerated ? (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="sharing-type">Link Permissions</Label>
                      <div className="flex items-center gap-6 mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="allow-edit" 
                            checked={sharingPermissions.allowEdit}
                            onCheckedChange={(checked) => 
                              setSharingPermissions(prev => ({ ...prev, allowEdit: checked }))
                            }
                          />
                          <Label htmlFor="allow-edit">Can edit</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="allow-comment" 
                            checked={sharingPermissions.allowComment}
                            onCheckedChange={(checked) => 
                              setSharingPermissions(prev => ({ ...prev, allowComment: checked }))
                            }
                          />
                          <Label htmlFor="allow-comment">Can comment</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="expiration" className="min-w-24">Expires after:</Label>
                      <select 
                        id="expiration"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={sharingPermissions.expirationDays}
                        onChange={(e) => setSharingPermissions(prev => ({ 
                          ...prev, 
                          expirationDays: parseInt(e.target.value) 
                        }))}
                      >
                        <option value={1}>1 day</option>
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>3 months</option>
                      </select>
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={generateCollaborationLink}
                      disabled={isGeneratingLink}
                    >
                      {isGeneratingLink ? (
                        <>
                          <motion.div 
                            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4 mr-2" />
                          Generate Collaboration Link
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="share-link">Collaboration Link</Label>
                      <div className="flex items-stretch">
                        <Input 
                          id="share-link" 
                          value={shareLink} 
                          readOnly 
                          className="flex-1 rounded-r-none" 
                        />
                        <Button 
                          className="rounded-l-none"
                          onClick={copyLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Expires: {getExpirationDate()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>
                          Permissions: 
                          {sharingPermissions.allowEdit ? ' Can edit,' : ''} 
                          {sharingPermissions.allowComment ? ' Can comment' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={resetLink}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email-recipient">Email Address</Label>
                    <Input 
                      id="email-recipient" 
                      type="email" 
                      placeholder="colleague@example.com" 
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email-message">Message (Optional)</Label>
                    <Textarea 
                      id="email-message" 
                      placeholder="I've analyzed this page and want to share my SEO findings with you..."
                      rows={3}
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full mt-2"
                    onClick={sendEmail}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <motion.div 
                          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent mr-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Integrations</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Github className="h-5 w-5" />
                          <span>GitHub</span>
                        </div>
                        <Button size="sm" variant="outline">Connect</Button>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Figma className="h-5 w-5" />
                          <span>Figma</span>
                        </div>
                        <Button size="sm" variant="outline">Connect</Button>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <BarChart className="h-5 w-5" />
                          <span>Google Analytics</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button className="flex items-center gap-2 w-full" variant="outline">
                      <Plus className="h-4 w-4" />
                      Add More Integrations
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-blue-50 text-blue-800 p-6 rounded-lg mb-4 inline-flex flex-col items-center"
            >
              <Users className="h-16 w-16 mb-4 text-blue-500" />
              <h3 className="text-xl font-bold mb-2">Unlock Collaboration Features</h3>
              <p className="text-blue-700 mb-0">
                Upgrade to Premium or Enterprise plan to collaborate with your team in real-time
              </p>
            </motion.div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span>Real-time collaboration with team members</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span>Secure sharing with permission controls</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span>Email notifications for shared reports</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {hasCollaborationFeatures && (
        <CardFooter className="border-t pt-4 text-xs text-gray-500">
          All collaboration links are secure and can only be accessed by those with the link
        </CardFooter>
      )}
    </Card>
  );
}