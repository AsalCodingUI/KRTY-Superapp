export const SETTINGS_TABS = ["general", "notifications", "appearance"] as const
export type SettingsTab = (typeof SETTINGS_TABS)[number]
