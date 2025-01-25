import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Facebook, Twitter, Linkedin, Link2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectListing } from "@db/schema";
import { ListingMetrics } from "./listing-metrics";

interface ListingCardProps {
  listing: SelectListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Track view when card is rendered
    fetch(`/api/listings/${listing.id}/view`, { method: 'POST' });
  }, [listing.id]);

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/listing/${listing.id}`;
  };

  const shareUrl = getShareUrl();
  const shareTitle = listing.title;
  const shareText = `Check out this great deal: ${listing.title} - $${Number(listing.price).toFixed(2)}`;

  const getSocialShareUrl = (platform: string) => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
    };

    return urls[platform] || shareUrl;
  };

  const shareToSocialMedia = async (platform: string) => {
    try {
      const url = getSocialShareUrl(platform);

      // Track share before opening share dialog
      await fetch(`/api/listings/${listing.id}/share`, { method: 'POST' });

      if (platform === 'email') {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'width=600,height=400');
      }

      toast({
        title: "Shared!",
        description: `Successfully opened ${platform} sharing dialog`,
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: `Unable to share to ${platform}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "The listing URL has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareListing = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Thank you for sharing this listing.",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast({
            title: "Sharing failed",
            description: "Please try another sharing method.",
            variant: "destructive",
          });
        }
      }
    } else {
      const dropdownTrigger = document.querySelector('[data-share-trigger]');
      if (dropdownTrigger instanceof HTMLElement) {
        dropdownTrigger.click();
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="aspect-square relative bg-gray-100">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-semibold text-lg leading-tight">{listing.title}</h3>
            <span className="font-bold text-xl text-green-600">
              ${Number(listing.price).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">{listing.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                onClick={shareListing}
                data-share-trigger
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Listing
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => shareToSocialMedia('facebook')} className="cursor-pointer">
                <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                Share on Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocialMedia('twitter')} className="cursor-pointer">
                <Twitter className="w-4 h-4 mr-2 text-sky-500" />
                Share on Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocialMedia('linkedin')} className="cursor-pointer">
                <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                Share on LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocialMedia('email')} className="cursor-pointer">
                <Mail className="w-4 h-4 mr-2 text-gray-600" />
                Share via Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
                <Link2 className="w-4 h-4 mr-2 text-gray-600" />
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
      <ListingMetrics listingId={listing.id} />
    </div>
  );
}