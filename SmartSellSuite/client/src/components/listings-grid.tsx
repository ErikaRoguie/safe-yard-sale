import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "./listing-card";
import { getListings } from "@/lib/openai";
import { Loader2 } from "lucide-react";

export function ListingsGrid() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/listings"],
    queryFn: getListings,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-gray-500 text-lg">
          No items listed yet. Be the first to list something!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}