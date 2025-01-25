import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { db } from "@db";
import { listings, listingMetrics } from "@db/schema";
import { eq, sql } from "drizzle-orm";
import multer from "multer";
import express from "express";
import { generateEmbedding, generateEnhancedDescription, storeEmbedding, findSimilarListings } from "./services/rag";

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function registerRoutes(app: Express): Server {
  // Create HTTP server first
  const httpServer = createServer(app);

  // Set up WebSocket server with error handling
  const wss = new WebSocketServer({ 
    server: httpServer,
    perMessageDeflate: false,
    handleProtocols: (protocols: string[] | Set<string> | null) => {
      if (!protocols) return null;

      const protocolArray = Array.isArray(protocols) ? protocols : Array.from(protocols);
      if (protocolArray.includes('vite-hmr')) {
        return null;
      }
      return protocolArray[0] || null;
    }
  });

  // Track client subscriptions
  const subscriptions = new Map<number, Set<WebSocket>>();

  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);

        if (data.type === 'subscribe' && data.listingId) {
          const listingId = parseInt(data.listingId);
          if (!subscriptions.has(listingId)) {
            subscriptions.set(listingId, new Set());
          }
          subscriptions.get(listingId)?.add(ws);
          console.log(`Client subscribed to listing ${listingId}`);

          // Send initial metrics right after subscription
          broadcastMetricsUpdate(listingId);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      subscriptions.forEach(clients => {
        clients.delete(ws);
      });
    });

    // Send initial ping to verify connection
    try {
      ws.send(JSON.stringify({ type: 'ping' }));
      console.log('Sent initial ping');
    } catch (error) {
      console.error('Error sending initial ping:', error);
    }
  });

  // Configure express
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
          details: "Please select an image file to upload"
        });
      }

      const base64Image = req.file.buffer.toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      console.log("Image uploaded successfully, size:", req.file.size);
      res.json({ url: imageUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: "Upload failed",
        details: error.message
      });
    }
  });

  // Get listing metrics
  app.get("/api/listings/:id/metrics", async (req, res) => {
    try {
      let [existingMetrics] = await db
        .select()
        .from(listingMetrics)
        .where(eq(listingMetrics.listingId, parseInt(req.params.id)))
        .limit(1);

      if (!existingMetrics) {
        [existingMetrics] = await db
          .insert(listingMetrics)
          .values({
            listingId: parseInt(req.params.id),
            views: 0,
            shares: 0,
            clicks: 0,
            lastUpdated: new Date()
          })
          .returning();
      }

      res.json(existingMetrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Track view
  app.post("/api/listings/:id/view", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      let [metrics] = await db
        .select()
        .from(listingMetrics)
        .where(eq(listingMetrics.listingId, listingId))
        .limit(1);

      if (!metrics) {
        [metrics] = await db
          .insert(listingMetrics)
          .values({
            listingId,
            views: 1,
            shares: 0,
            clicks: 0,
            lastUpdated: new Date()
          })
          .returning();
      } else {
        [metrics] = await db
          .update(listingMetrics)
          .set({ 
            views: sql`${listingMetrics.views} + 1`,
            lastUpdated: new Date()
          })
          .where(eq(listingMetrics.listingId, listingId))
          .returning();
      }

      await broadcastMetricsUpdate(listingId);
      res.json(metrics);
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });

  // Track share
  app.post("/api/listings/:id/share", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      let [metrics] = await db
        .select()
        .from(listingMetrics)
        .where(eq(listingMetrics.listingId, listingId))
        .limit(1);

      if (!metrics) {
        [metrics] = await db
          .insert(listingMetrics)
          .values({
            listingId,
            views: 0,
            shares: 1,
            clicks: 0,
            lastUpdated: new Date()
          })
          .returning();
      } else {
        [metrics] = await db
          .update(listingMetrics)
          .set({ 
            shares: sql`${listingMetrics.shares} + 1`,
            lastUpdated: new Date()
          })
          .where(eq(listingMetrics.listingId, listingId))
          .returning();
      }

      await broadcastMetricsUpdate(listingId);
      res.json(metrics);
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({ error: "Failed to track share" });
    }
  });

  // Track click
  app.post("/api/listings/:id/click", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      let [metrics] = await db
        .select()
        .from(listingMetrics)
        .where(eq(listingMetrics.listingId, listingId))
        .limit(1);

      if (!metrics) {
        [metrics] = await db
          .insert(listingMetrics)
          .values({
            listingId,
            views: 0,
            shares: 0,
            clicks: 1,
            lastUpdated: new Date()
          })
          .returning();
      } else {
        [metrics] = await db
          .update(listingMetrics)
          .set({
            clicks: sql`${listingMetrics.clicks} + 1`,
            lastUpdated: new Date()
          })
          .where(eq(listingMetrics.listingId, listingId))
          .returning();
      }

      await broadcastMetricsUpdate(listingId);
      res.json(metrics);
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Get all listings
  app.get("/api/listings", async (_req, res) => {
    try {
      const allListings = await db.select().from(listings).orderBy(listings.createdAt);
      res.json(allListings);
    } catch (error: any) {
      console.error("Fetch listings error:", error);
      res.status(500).send("Failed to fetch listings");
    }
  });

  // Generate description endpoint
  app.post("/api/generate-description", async (req, res) => {
    try {
      const { imageUrl } = req.body;

      // Find similar listings to use as context
      const similarListings = await findSimilarListings(0, 5); // Pass 0 as we don't have a listing ID yet

      // Generate enhanced description using RAG
      const result = await generateEnhancedDescription(imageUrl, similarListings);
      res.json(result);
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      res.status(500).json({
        title: "Sample Item",
        description: "Failed to generate AI description. Please provide your own title and description."
      });
    }
  });

  // Create listing
  app.post("/api/listings", async (req, res) => {
    try {
      const [listing] = await db.insert(listings).values(req.body).returning();

      // Generate and store embedding for the new listing
      const text = `${listing.title} ${listing.description}`;
      await storeEmbedding(listing.id, text);

      // Initialize metrics for the new listing
      await db.insert(listingMetrics).values({
        listingId: listing.id,
        views: 0,
        shares: 0,
        clicks: 0,
        lastUpdated: new Date()
      });

      res.json(listing);
    } catch (error: any) {
      console.error("Create listing error:", error);
      res.status(500).send("Failed to create listing");
    }
  });

  // Broadcast metrics updates to subscribed clients
  async function broadcastMetricsUpdate(listingId: number) {
    const subscribers = subscriptions.get(listingId);
    if (!subscribers || subscribers.size === 0) return;

    try {
      const [metrics] = await db
        .select()
        .from(listingMetrics)
        .where(eq(listingMetrics.listingId, listingId))
        .limit(1);

      if (!metrics) return;

      const message = JSON.stringify({
        type: 'metrics_update',
        listingId,
        metrics
      });

      const deadSockets: WebSocket[] = [];
      subscribers.forEach(client => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          } else {
            deadSockets.push(client);
          }
        } catch (error) {
          console.error('Error sending metrics update:', error);
          deadSockets.push(client);
        }
      });

      // Clean up dead sockets
      deadSockets.forEach(socket => {
        subscribers.delete(socket);
      });
    } catch (error) {
      console.error('Failed to broadcast metrics:', error);
    }
  }

  return httpServer;
}

function calculateShippingRate(weight: number, length: number, width: number, height: number, distance: number) {
  const dimensionalWeight = (length * width * height) / 139;
  const billableWeight = Math.max(weight, dimensionalWeight);
  const baseRate = 4.99;
  const weightRate = billableWeight * 0.55;
  const distanceRate = distance * 0.12;

  return {
    economy: {
      service: "Economy Shipping (5-7 business days)",
      rate: +(baseRate + weightRate + distanceRate).toFixed(2)
    },
    standard: {
      service: "Standard Shipping (3-5 business days)",
      rate: +(1.5 * (baseRate + weightRate + distanceRate)).toFixed(2)
    },
    expedited: {
      service: "Expedited Shipping (1-3 business days)",
      rate: +(2.2 * (baseRate + weightRate + distanceRate)).toFixed(2)
    }
  };
}

function calculateZipCodeDistance(fromZip: string, toZip: string): number {
  const difference = Math.abs(parseInt(fromZip) - parseInt(toZip));
  return Math.min(Math.max(difference / 100, 1), 30);
}

// Placeholder for sellers and badges - needs to be defined based on your schema
const sellers = {} as any;
const badges = {} as any;
const sellerBadges = {} as any;