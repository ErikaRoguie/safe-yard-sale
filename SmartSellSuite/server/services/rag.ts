import OpenAI from "openai";
import { db } from "@db";
import { listings, listingEmbeddings } from "@db/schema";
import { eq, sql } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required for RAG functionality");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0].embedding;
}

export async function findSimilarListings(listingId: number, limit = 5) {
  try {
    // For a new listing (id = 0), return recent listings as context
    if (listingId === 0) {
      return await db
        .select()
        .from(listings)
        .orderBy(sql`${listings.createdAt} DESC`)
        .limit(limit);
    }

    // Get the embedding for the current listing
    const [currentEmbedding] = await db
      .select()
      .from(listingEmbeddings)
      .where(eq(listingEmbeddings.listingId, listingId))
      .limit(1);

    if (!currentEmbedding) {
      console.log("No embedding found for listing", listingId);
      return [];
    }

    // Find similar listings using cosine similarity
    const similarListings = await db.execute(sql`
      WITH similarity_scores AS (
        SELECT l.*,
               1 - (le.embedding <=> ${currentEmbedding.embedding}::vector) as similarity
        FROM ${listings} l
        JOIN ${listingEmbeddings} le ON l.id = le.listing_id
        WHERE le.listing_id != ${listingId}
      )
      SELECT *
      FROM similarity_scores
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return similarListings;
  } catch (error) {
    console.error("Error finding similar listings:", error);
    return [];
  }
}

export async function generateEnhancedDescription(imageUrl: string, similarListings: typeof listings.$inferSelect[]) {
  try {
    console.log("Generating description for image:", imageUrl);
    console.log("Similar listings context:", similarListings);

    const similarListingsContext = similarListings
      .map(l => `Title: ${l.title}\nDescription: ${l.description}\nPrice: $${l.price}`)
      .join('\n\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a listing description expert. Use the provided similar listings as context to generate a more accurate and marketplace-appropriate description. Format your response as a JSON object with 'title' and 'description' fields.\n\nSimilar listings for reference:\n\n${similarListingsContext}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Generate a title and detailed description for this item that's being sold. Focus on key features, condition, and unique selling points."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    console.log("OpenAI response:", response.choices[0].message);
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error(`Failed to generate description: ${error.message}`);
  }
}

export async function storeEmbedding(listingId: number, text: string) {
  try {
    console.log("Generating embedding for listing:", listingId);
    const embedding = await generateEmbedding(text);

    await db.insert(listingEmbeddings).values({
      listingId,
      embedding,
    });
    console.log("Stored embedding for listing:", listingId);
  } catch (error) {
    console.error("Error storing embedding:", error);
    throw new Error(`Failed to store embedding: ${error.message}`);
  }
}