import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  deviceId: text("device_id").primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time"),
  birthPlace: text("birth_place"),
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
  /** Free Premium trial for new accounts (ISO). Access is Premium while this is in the future. */
  trialEndsAt: text("trial_ends_at"),
  trialDay2SentAt: text("trial_day2_sent_at"),
  trialReminderSentAt: text("trial_reminder_sent_at"),
  trialEndedSentAt: text("trial_ended_sent_at"),
  /** Secret for the one-click unsubscribe link in lifecycle e-mails. */
  emailToken: text("email_token"),
  emailOptOut: integer("email_opt_out", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
  uniqueIndex("users_email_token_idx").on(table.emailToken),
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

/** One row per wrong-password login (kept 24 h): the evidence behind IP blocks and account locks. */
export const loginFailures = sqliteTable("login_failures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ip: text("ip").notNull(),
  asn: text("asn"),
  /** Hash of the e-mail that was tried, so unknown addresses are tracked too and nothing reveals whether one exists. */
  account: text("account").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("login_failures_ip_idx").on(table.ip, table.createdAt),
  index("login_failures_account_idx").on(table.account, table.createdAt),
  index("login_failures_asn_idx").on(table.asn, table.createdAt),
]);

export const ipBlocks = sqliteTable("ip_blocks", {
  ip: text("ip").primaryKey(),
  until: text("until").notNull(),
  strikes: integer("strikes").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

/** What the defenses did (kept 30 days), for the admin panel. */
export const securityEvents = sqliteTable("security_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  ip: text("ip").notNull(),
  asn: text("asn"),
  country: text("country"),
  detail: text("detail").notNull().default(""),
  createdAt: text("created_at").notNull(),
}, (table) => [index("security_events_created_at_idx").on(table.createdAt)]);

/** Machine translations of interface text, shared by every visitor (key = hash of language + source text). */
export const translations = sqliteTable("translations", {
  key: text("key").primaryKey(),
  lang: text("lang").notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("translations_created_at_idx").on(table.createdAt)]);

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

export const chatThreads = sqliteTable("chat_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  title: text("title").notNull().default("Nova conversa"),
  messagesJson: text("messages_json").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("chat_threads_device_id_idx").on(table.deviceId)]);

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id"),
  eventName: text("event_name").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("analytics_events_device_id_idx").on(table.deviceId), index("analytics_events_name_idx").on(table.eventName)]);

/** Live sky and daily horoscope content (CosmyDay), adapted to Portuguese once per day and shared by everyone. */
export const skyDaily = sqliteTable("sky_daily", {
  day: text("day").notNull(),
  key: text("key").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.day, table.key] })]);

/**
 * One row per page view by a person (crawlers and prefetches excluded). `visitor` is a hash of IP +
 * browser with a salt that changes every day and is then deleted: unique visitors can be counted
 * per day, but nobody can be recognised across days, and no cookie is set.
 */
export const pageViews = sqliteTable("page_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  day: text("day").notNull(),
  path: text("path").notNull(),
  visitor: text("visitor").notNull(),
  referrer: text("referrer"),
  country: text("country"),
  device: text("device").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("page_views_day_idx").on(table.day)]);

/** Developer access to /admin: separate from app sessions, short-lived, only for ADMIN_EMAILS. */
export const adminSessions = sqliteTable("admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Second step of the admin login: a 6-digit code e-mailed to the admin, valid for 10 minutes. */
export const adminLoginCodes = sqliteTable("admin_login_codes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** "Meus Sinais": every equal-hour reading a user opened, so it can be reopened later. One row per hour per day. */
export const signalReadings = sqliteTable("signal_readings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  time: text("time").notNull(),
  dayKey: text("day_key").notNull(),
  sign: text("sign"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("signal_readings_unique_idx").on(table.deviceId, table.dayKey, table.time), index("signal_readings_device_idx").on(table.deviceId, table.createdAt)]);

/** Radar da Prosperidade (Premium): each analysis, with the answers that produced it and the results the person opened (plans, offers). */
export const radarReports = sqliteTable("radar_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => profiles.deviceId, { onDelete: "cascade" }),
  answersJson: text("answers_json").notNull(),
  resultJson: text("result_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("radar_reports_device_idx").on(table.deviceId, table.createdAt)]);
