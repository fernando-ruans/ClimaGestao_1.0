import { pgTable, text, serial, integer, boolean, date, time, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("technician"),
  isActive: boolean("is_active").notNull().default(true),
  photoUrl: text("photo_url"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true,
});

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

// Service schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  pdfPath: text("pdf_path"),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  completedDate: true,
  createdAt: true,
  updatedAt: true,
  pdfPath: true,
});

// Service Items (for materials and labor)
export const serviceItems = pgTable("service_items", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull(),
  type: text("type").notNull(), // 'material' or 'labor'
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // Stored in cents
  total: integer("total").notNull(), // Stored in cents
});

export const insertServiceItemSchema = createInsertSchema(serviceItems).omit({
  id: true,
});

// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id"),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  total: integer("total").notNull(), // Stored in cents
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pdfPath: text("pdf_path"),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  pdfPath: true,
});

// Quote Items
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(),
  type: text("type").notNull(), // 'material' or 'labor'
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // Stored in cents
  total: integer("total").notNull(), // Stored in cents
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
});

// Work Orders
export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  technicianIds: text("technician_ids").array(), // Array of user IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pdfPath: text("pdf_path"),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  completedDate: true,
  createdAt: true,
  pdfPath: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type ServiceItem = typeof serviceItems.$inferSelect;
export type InsertServiceItem = z.infer<typeof insertServiceItemSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
