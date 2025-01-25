import type { InsertListing } from "@db/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateDescription(imageUrl: string): Promise<{ title: string; description: string }> {
  const response = await fetch("/api/generate-description", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate description");
  }

  return response.json();
}

export async function enhanceImage(imageUrl: string): Promise<string> {
  const response = await fetch("/api/enhance-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error("Failed to enhance image");
  }

  const { enhancedUrl } = await response.json();
  return enhancedUrl;
}

export async function createListing(data: Omit<InsertListing, "id" | "createdAt">): Promise<InsertListing> {
  const response = await fetch("/api/listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create listing");
  }

  return response.json();
}

export async function getListings(): Promise<InsertListing[]> {
  const response = await fetch("/api/listings");

  if (!response.ok) {
    throw new Error("Failed to fetch listings");
  }

  return response.json();
}