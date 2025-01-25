import type { InsertListing } from "@db/schema";

export async function createEbayListing(_listing: InsertListing) {
  console.log("eBay integration temporarily disabled");
  return {
    listingId: "",
    status: "disabled",
    message: "eBay integration is currently disabled"
  };
}

export async function getEbayListing(_listingId: string) {
  console.log("eBay integration temporarily disabled");
  return null;
}

export async function updateEbayListing(_listingId: string, _updates: Partial<InsertListing>) {
  console.log("eBay integration temporarily disabled");
  return null;
}