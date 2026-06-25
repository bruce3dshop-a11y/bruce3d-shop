import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ==================== USERS ====================
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  telegram: text("telegram"),
  password_hash: text("password_hash"),
  is_admin: boolean("is_admin").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ==================== ORDERS ====================
export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_number: text("order_number").notNull().unique(),
  user_id: integer("user_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  telegram: text("telegram"),
  service_type: text("service_type").notNull(),
  material: text("material").notNull(),
  description: text("description").notNull(),
  file_name: text("file_name"),
  delivery_type: text("delivery_type").default("pickup"),
  delivery_city: text("delivery_city"),
  delivery_address: text("delivery_address"),
  delivery_index: text("delivery_index"),
  status: text("status").default("new").notNull(),
  price: text("price"),
  payment_link: text("payment_link"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

// ==================== ORDER STATUS HISTORY ====================
export const orderStatusHistoryTable = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  status: text("status").notNull(),
  comment: text("comment"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistoryTable).omit({ id: true, created_at: true });
export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;
export type OrderStatusHistory = typeof orderStatusHistoryTable.$inferSelect;

// ==================== ORDER MESSAGES ====================
export const orderMessagesTable = pgTable("order_messages", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  sender: text("sender").notNull(), // 'admin' | 'client'
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderMessageSchema = createInsertSchema(orderMessagesTable).omit({ id: true, created_at: true });
export type InsertOrderMessage = z.infer<typeof insertOrderMessageSchema>;
export type OrderMessage = typeof orderMessagesTable.$inferSelect;

// ==================== REVIEWS ====================
export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  rating: integer("rating").default(5),
  text: text("text").notNull(),
  approved: boolean("approved").default(false),
  pinned: boolean("pinned").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, created_at: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

// ==================== GALLERY ====================
export const galleryItemsTable = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  image_url: text("image_url").notNull(),
  category: text("category"),
  telegram_file_id: text("telegram_file_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertGalleryItemSchema = createInsertSchema(galleryItemsTable).omit({ id: true, created_at: true });
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItemsTable.$inferSelect;

// ==================== PRODUCTS ====================
export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: text("price"),
  discount_price: text("discount_price"),
  image_url: text("image_url").default(""),
  extra_images: text("extra_images"), // JSON array string
  external_link: text("external_link"),
  badge: text("badge"),
  series: text("series").default("series-01"),
  in_stock: boolean("in_stock").default(true),
  hidden: boolean("hidden").default(false),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, created_at: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

// ==================== SUPPORT CHAT SESSIONS ====================
export const supportSessionsTable = pgTable("support_sessions", {
  id: serial("id").primaryKey(),
  session_key: text("session_key").notNull().unique(),
  user_id: integer("user_id"),
  visitor_name: text("visitor_name").default("Гость"),
  status: text("status").default("open").notNull(), // 'open' | 'closed'
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_message_at: timestamp("last_message_at").defaultNow().notNull(),
});

export const insertSupportSessionSchema = createInsertSchema(supportSessionsTable).omit({ id: true, created_at: true });
export type InsertSupportSession = z.infer<typeof insertSupportSessionSchema>;
export type SupportSession = typeof supportSessionsTable.$inferSelect;

// ==================== SUPPORT MESSAGES ====================
export const supportMessagesTable = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").notNull(),
  sender: text("sender").notNull(), // 'admin' | 'client'
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupportMessageSchema = createInsertSchema(supportMessagesTable).omit({ id: true, created_at: true });
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessagesTable.$inferSelect;
