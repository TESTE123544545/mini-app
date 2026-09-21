import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  deviceId: text("device_id").primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  sign: text("sign").notNull(),
  objective: text("objective").notNull(),
  plan: text("plan").notNull().default("free"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userProgress = sqliteTable("user_progress", {
  deviceId: text("device_id").primaryKey().references(() => profiles.deviceId, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(1),
  missionDone: integer("mission_done", { mode: "boolean" }).notNull().default(false),
  lastMissionDate: text("last_mission_date"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey(),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [index("goals_device_id_idx").on(table.deviceId)]);

export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  entryDate: text("entry_date").notNull(),
  answersJson: text("answers_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("journal_entries_device_id_idx").on(table.deviceId)]);

export const missionCompletions = sqliteTable("mission_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  missionKey: text("mission_key").notNull(),
  xpAwarded: integer("xp_awarded").notNull().default(20),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("mission_completions_device_id_idx").on(table.deviceId)]);

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  achievementKey: text("achievement_key").notNull(),
  unlockedAt: text("unlocked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("achievements_device_key_idx").on(table.deviceId, table.achievementKey)]);

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id"),
  eventName: text("event_name").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("analytics_events_device_id_idx").on(table.deviceId), index("analytics_events_name_idx").on(table.eventName)]);
