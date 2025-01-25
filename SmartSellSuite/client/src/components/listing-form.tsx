import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Camera, ImagePlus, Loader2, Package } from "lucide-react";
import { generateDescription, enhanceImage, createListing } from "@/lib/openai";
import type { InsertListing } from "@db/schema";

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  weight: string;
  width: string;
  height: string;
  length: string;
  requiresShipping: boolean;
  shippingFromZip: string;
  sellerId: number;
  enhanceImage: boolean;
}

export function ListingForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ListingFormData>({
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      imageUrl: "",
      weight: "0",
      width: "0",
      height: "0",
      length: "0",
      requiresShipping: true,
      shippingFromZip: "",
      sellerId: 1, // TODO: Get from auth context
      enhanceImage: false,
    },
  });

  const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const { url } = await res.json();

      // Enhance image if the enhance switch is on
      if (form.watch("enhanceImage")) {
        setIsEnhancing(true);
        try {
          const enhancedUrl = await enhanceImage(url);
          form.setValue("imageUrl", enhancedUrl);
          toast({
            title: "Success",
            description: "Image enhanced successfully",
          });
        } catch (error) {
          console.error("Enhancement failed:", error);
          form.setValue("imageUrl", url); // Use original if enhancement fails
          toast({
            title: "Note",
            description: "Using original image (enhancement unavailable)",
            variant: "destructive",
          });
        }
        setIsEnhancing(false);
      } else {
        form.setValue("imageUrl", url);
      }

      // Generate description
      setIsGenerating(true);
      const { title, description } = await generateDescription(form.watch("imageUrl"));
      form.setValue("title", title);
      form.setValue("description", description);

      toast({
        title: "Success",
        description: "Image uploaded and description generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    try {
      setIsSubmitting(true);
      // Remove enhanceImage from data before sending to API
      const { enhanceImage: _, ...listingData } = data;
      await createListing(listingData as InsertListing);
      form.reset();
      toast({
        title: "Success",
        description: "Item listed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">List Your Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="image" className="block text-sm font-medium">
                Take a Photo
              </Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="enhanceImage">AI Enhancement</Label>
                <Switch
                  id="enhanceImage"
                  checked={form.watch("enhanceImage")}
                  onCheckedChange={(checked) => form.setValue("enhanceImage", checked)}
                />
              </div>
            </div>
            <div className="mt-1 flex items-center justify-center">
              <label
                htmlFor="image"
                className="relative cursor-pointer bg-white rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 w-full text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="space-y-1">
                  {isEnhancing ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ImagePlus className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
                      <span className="text-sm text-blue-600">Enhancing image...</span>
                    </div>
                  ) : isGenerating ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-600">Generating description...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span>Take a photo or upload an image</span>
                        {form.watch("enhanceImage") && (
                          <p className="text-xs text-blue-600 mt-1">
                            AI enhancement enabled
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={onImageUpload}
                  disabled={isGenerating || isEnhancing || isSubmitting}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              className="block w-full rounded-md"
              {...form.register("title", { required: true })}
              disabled={isGenerating || isEnhancing || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="block w-full rounded-md"
              {...form.register("description", { required: true })}
              disabled={isGenerating || isEnhancing || isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              className="block w-full rounded-md"
              {...form.register("price", { required: true, min: 0 })}
              disabled={isGenerating || isEnhancing || isSubmitting}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Shipping Details</span>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="requiresShipping">Requires Shipping</Label>
                <Switch
                  id="requiresShipping"
                  checked={form.watch("requiresShipping")}
                  onCheckedChange={(checked) => form.setValue("requiresShipping", checked)}
                />
              </div>
            </div>
          </div>

          {form.watch("requiresShipping") && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    className="mt-1"
                    {...form.register("weight", { required: true, min: 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingFromZip">Ship From (ZIP)</Label>
                  <Input
                    id="shippingFromZip"
                    className="mt-1"
                    {...form.register("shippingFromZip", { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="length">Length (in)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    className="mt-1"
                    {...form.register("length", { required: true, min: 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (in)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    className="mt-1"
                    {...form.register("width", { required: true, min: 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (in)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    className="mt-1"
                    {...form.register("height", { required: true, min: 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6 text-lg"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isGenerating || isEnhancing || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Listing Item...
              </>
            ) : (
              "List Item"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}