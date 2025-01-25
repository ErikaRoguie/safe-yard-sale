import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface ListingPreviewProps {
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  requiresShipping: boolean;
}

export function ListingPreview({
  title,
  description,
  price,
  imageUrl,
  requiresShipping,
}: ListingPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <motion.div
          className="aspect-square relative bg-gray-100"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {imageUrl ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image uploaded
            </div>
          )}
        </motion.div>
        <CardContent className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex justify-between items-start gap-4 mb-2"
          >
            <h3 className="font-semibold text-lg leading-tight">
              {title || "Item Title"}
            </h3>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="font-bold text-xl text-green-600"
            >
              ${Number(price || 0).toFixed(2)}
            </motion.span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="text-sm text-gray-600 line-clamp-3"
          >
            {description || "Item description will appear here"}
          </motion.p>
          {requiresShipping && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-3"
            >
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                Shipping Available
              </Badge>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
