import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  deviceId: text("device_id").primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  sign: text("sign").notNull(),
  objective: text("objective").notNull(),
  intention: text("intention").notNull().default(""),
  theme: text("theme").notNull().default("dourado"),
  avatarKey: text("avatar_key"),
  avatarData: text("avatar_data"),
  avatarType: text("avatar_type"),
  plan: text("plan").notNull().default("free"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull().default(100000),
  primaryDeviceId: text("primary_device_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
  uniqueIndex("users_primary_device_idx").on(table.primaryDeviceId),
]);

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("sessions_user_id_idx").on(table.userId), index("sessions_expires_at_idx").on(table.expiresAt)]);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("password_reset_user_id_idx").on(table.userId), index("password_reset_expires_at_idx").on(table.expiresAt)]);

export const userProgress = sqliteTable("user_progress", {
  deviceId: text("device_id").primaryKey().references(() => profiles.deviceId, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(1),
  missionDone: integer("mission_done", { mode: "boolean" }).notNull().default(false),
  lastMissionDate: text("last_mission_date"),
  ritualDone: integer("ritual_done", { mode: "boolean" }).notNull().default(false),
  lastRitualDate: text("last_ritual_date"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStartedAt: text("window_started_at").notNull(),
  expiresAt: text("expires_at").notNull(),
}, (table) => [index("rate_limits_expires_at_idx").on(table.expiresAt)]);

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey(),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("active"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  kind: text("kind"),
  targetAmount: integer("target_amount"),
  currentAmount: integer("current_amount"),
  deadline: text("deadline"),
  motivation: text("motivation"),
  stage: text("stage"),
  blocker: text("blocker"),
  dailyMinutes: integer("daily_minutes"),
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

export const trailProgress = sqliteTable("trail_progress", {
  deviceId: text("device_id").primaryKey().references(() => profiles.deviceId, { onDelete: "cascade" }),
  trailId: text("trail_id").notNull(),
  startedAt: text("started_at").notNull(),
  completedDaysJson: text("completed_days_json").notNull().default("[]"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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

export const subscriptions = sqliteTable("subscriptions", {
  purchaseToken: text("purchase_token").primaryKey(),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  status: text("status").notNull().default("active"),
  expiryTimeMillis: text("expiry_time_millis"),
  autoRenewing: integer("auto_renewing", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("subscriptions_device_id_idx").on(table.deviceId)]);

export const aiWeeklyReports = sqliteTable("ai_weekly_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  weekStart: text("week_start").notNull(),
  summary: text("summary").notNull(),
  recommendation: text("recommendation").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("ai_weekly_reports_device_week_idx").on(table.deviceId, table.weekStart)]);

export const goalSuggestions = sqliteTable("goal_suggestions", {
  goalId: integer("goal_id").primaryKey(),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  stepsJson: text("steps_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("goal_suggestions_device_id_idx").on(table.deviceId)]);

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id"),
  eventName: text("event_name").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("analytics_events_device_id_idx").on(table.deviceId), index("analytics_events_name_idx").on(table.eventName)]);
