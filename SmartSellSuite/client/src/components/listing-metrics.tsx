import { useQuery } from "@tanstack/react-query";
import { format, formatDistance } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Eye, Share2, MousePointerClick, Clock } from "lucide-react";
import type { SelectListingMetrics } from "@db/schema";
import { useEffect } from "react";

interface ListingMetricsProps {
  listingId: number;
}

export function ListingMetrics({ listingId }: ListingMetricsProps) {
  const { data: metrics, isLoading, refetch } = useQuery<SelectListingMetrics>({
    queryKey: [`/api/listings/${listingId}/metrics`],
    refetchInterval: 5000, // Simple polling fallback
  });

  useEffect(() => {
    // WebSocket setup
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', listingId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'metrics_update') {
          refetch(); // Refetch metrics when we receive an update
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [listingId, refetch]);

  if (isLoading || !metrics) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-7 w-1/3 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Views",
      value: metrics.views,
      icon: Eye,
      description: "Total number of times your listing has been viewed",
      color: "text-blue-500",
    },
    {
      label: "Shares",
      value: metrics.shares,
      icon: Share2,
      description: "Number of times your listing has been shared",
      color: "text-green-500",
    },
    {
      label: "Click Rate",
      value: `${((metrics.clicks / metrics.views) * 100 || 0).toFixed(1)}%`,
      icon: MousePointerClick,
      description: "Percentage of views that resulted in clicks",
      color: "text-purple-500",
    },
    {
      label: "Last Update",
      value: formatDistance(new Date(metrics.lastUpdated), new Date(), { addSuffix: true }),
      icon: Clock,
      description: `Last updated on ${format(new Date(metrics.lastUpdated), 'MMM d, yyyy')}`,
      color: "text-orange-500",
    },
  ];

  const chartData = [
    { name: "Views", value: metrics.views },
    { name: "Shares", value: metrics.shares },
    { name: "Clicks", value: metrics.clicks },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Listing Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, description, color }) => (
            <HoverCard key={label}>
              <HoverCardTrigger asChild>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2 cursor-help">
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="text-sm text-gray-500">{label}</span>
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm text-gray-600">{description}</p>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>

        <div className="h-48 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}