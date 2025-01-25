import { useQuery } from "@tanstack/react-query";
import { BadgeDisplay } from "./badge-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Package } from "lucide-react";

export function SellerProfile({ sellerId }: { sellerId: number }) {
  const { data: seller, isLoading } = useQuery({
    queryKey: ["/api/seller", sellerId],
  });

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-7 w-1/3 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!seller) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {seller.username}'s Profile
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {seller.badges?.map((badge) => (
            <BadgeDisplay key={badge.id} badge={badge} />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Seller Rating</span>
            </div>
            <span className="text-sm font-semibold">
              {seller.averageRating.toFixed(1)}/5.0
            </span>
          </div>
          <Progress value={seller.averageRating * 20} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Avg. Response Time</span>
          </div>
          <Badge variant="secondary">
            {seller.responseTime < 60
              ? `${seller.responseTime}m`
              : `${Math.round(seller.responseTime / 60)}h`}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-green-500" />
            <span className="text-sm">Completed Sales</span>
          </div>
          <Badge variant="secondary">{seller.totalSales}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
