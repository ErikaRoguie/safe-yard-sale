import { pgTable, text, serial, integer, timestamp, boolean, decimal, jsonb, vector } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Keep existing tables unchanged
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  weight: decimal("weight").notNull().default("0"),
  width: decimal("width").notNull().default("0"),
  height: decimal("height").notNull().default("0"),
  length: decimal("length").notNull().default("0"),
  requiresShipping: boolean("requires_shipping").notNull().default(true),
  shippingFromZip: text("shipping_from_zip"),
  sellerId: integer("seller_id").notNull(),
});

// Add new listing_embeddings table
export const listingEmbeddings = pgTable("listing_embeddings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI embeddings are 1536 dimensions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Keep other existing tables unchanged
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  totalSales: integer("total_sales").notNull().default(0),
  averageRating: decimal("average_rating").notNull().default("0"),
  responseTime: integer("response_time").notNull().default(0),
  completedListings: integer("completed_listings").notNull().default(0),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  criteria: jsonb("criteria").notNull(),
  type: text("type").notNull(),
  tier: text("tier").notNull(),
});

export const sellerBadges = pgTable("seller_badges", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => sellers.id),
  badgeId: integer("badge_id")
    .notNull()
    .references(() => badges.id),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

export const listingMetrics = pgTable("listing_metrics", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  views: integer("views").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Define all relations in a single place
export const listingsRelations = relations(listings, ({ one }) => ({
  seller: one(sellers, {
    fields: [listings.sellerId],
    references: [sellers.id],
  }),
  metrics: one(listingMetrics, {
    fields: [listings.id],
    references: [listingMetrics.listingId],
  }),
  embedding: one(listingEmbeddings, {
    fields: [listings.id],
    references: [listingEmbeddings.listingId],
  }),
}));

export const sellerRelations = relations(sellers, ({ many }) => ({
  listings: many(listings),
  badges: many(sellerBadges),
}));

export const badgeRelations = relations(badges, ({ many }) => ({
  sellers: many(sellerBadges),
}));

export const sellerBadgeRelations = relations(sellerBadges, ({ one }) => ({
  seller: one(sellers, {
    fields: [sellerBadges.sellerId],
    references: [sellers.id],
  }),
  badge: one(badges, {
    fields: [sellerBadges.badgeId],
    references: [badges.id],
  }),
}));

// Export schemas and types
export const insertListingEmbeddingsSchema = createInsertSchema(listingEmbeddings);
export const selectListingEmbeddingsSchema = createSelectSchema(listingEmbeddings);
export type InsertListingEmbeddings = typeof listingEmbeddings.$inferInsert;
export type SelectListingEmbeddings = typeof listingEmbeddings.$inferSelect;

export const insertListingSchema = createInsertSchema(listings);
export const selectListingSchema = createSelectSchema(listings);
export type InsertListing = typeof listings.$inferInsert;
export type SelectListing = typeof listings.$inferSelect;

export const insertListingMetricsSchema = createInsertSchema(listingMetrics);
export const selectListingMetricsSchema = createSelectSchema(listingMetrics);
export type InsertListingMetrics = typeof listingMetrics.$inferInsert;
export type SelectListingMetrics = typeof listingMetrics.$inferSelect;

export const insertSellerSchema = createInsertSchema(sellers);
export const selectSellerSchema = createSelectSchema(sellers);
export type InsertSeller = typeof sellers.$inferInsert;
export type SelectSeller = typeof sellers.$inferSelect;

export const insertBadgeSchema = createInsertSchema(badges);
export const selectBadgeSchema = createSelectSchema(badges);
export type InsertBadge = typeof badges.$inferInsert;
export type SelectBadge = typeof badges.$inferSelect;

export const insertSellerBadgeSchema = createInsertSchema(sellerBadges);
export const selectSellerBadgeSchema = createSelectSchema(sellerBadges);
export type InsertSellerBadge = typeof sellerBadges.$inferInsert;
export type SelectSellerBadge = typeof sellerBadges.$inferSelect;