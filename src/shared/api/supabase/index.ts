/**
 * Public API for api/supabase
 * 
 * This file defines the public interface for this slice.
 * Only exports from this file should be imported by other slices.
 * 
 * FSD Rule: Keep your public API minimal and stable.
 */

// export * from './api';

export * from './client'; // Default to client? Or be selective.
export { createClient as createBrowserSupabaseClient } from './client';
export { createClient as createServerSupabaseClient } from './server';
export { };

