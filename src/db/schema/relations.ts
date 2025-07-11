import { relations } from 'drizzle-orm';
import { languages, timezones } from './localization';
import { userPreferences } from './user-preferences';

/**
 * Relations for languages
 */
export const languagesRelations = relations(languages, ({ many }) => ({
  userPreferences: many(userPreferences),
}));

/**
 * Relations for timezones
 */
export const timezonesRelations = relations(timezones, ({ many }) => ({
  userPreferences: many(userPreferences),
}));
