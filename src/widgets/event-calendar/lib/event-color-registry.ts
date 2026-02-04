/**
 * Calendar Event Color Registry
 * 
 * Centralized color mapping for calendar events using semantic tokens.
 * This ensures consistent color usage across all calendar views and components.
 */

import type { EventColor } from '../ui/types';

/**
 * Semantic color category for event types
 */
export type SemanticColorCategory =
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

/**
 * Event color mapping with semantic tokens
 */
export interface EventColorMapping {
    /** Background color using semantic tokens */
    background: string;
    /** Text color using semantic tokens */
    text: string;
    /** Border color using semantic tokens */
    border: string;
    /** Semantic category for the color */
    semanticCategory: SemanticColorCategory;
    /** Display label for the event type */
    label: string;
}

/**
 * Event type definition with color mapping
 */
export interface EventTypeDefinition {
    /** Unique identifier for the event type */
    value: string;
    /** Display label */
    label: string;
    /** Event color */
    color: EventColor;
    /** Semantic color mapping */
    colorMapping: EventColorMapping;
}

/**
 * Centralized registry of event types and their color mappings
 * 
 * This registry maps event types to semantic color tokens, ensuring
 * consistent styling across all calendar views and components.
 */
export const EVENT_TYPE_REGISTRY: Record<string, EventTypeDefinition> = {
    Internal: {
        value: 'Internal',
        label: 'Internal',
        color: 'blue',
        colorMapping: {
            background: 'bg-primary-subtle',
            text: 'text-primary-text',
            border: 'border-primary',
            semanticCategory: 'primary',
            label: 'Internal Meeting',
        },
    },
    WFH: {
        value: 'WFH',
        label: 'WFH',
        color: 'violet',
        colorMapping: {
            background: 'bg-primary-subtle',
            text: 'text-primary-text',
            border: 'border-primary',
            semanticCategory: 'primary',
            label: 'Work From Home',
        },
    },
    Cuti: {
        value: 'Cuti',
        label: 'Cuti',
        color: 'rose',
        colorMapping: {
            background: 'bg-danger-subtle',
            text: 'text-danger-text',
            border: 'border-danger',
            semanticCategory: 'danger',
            label: 'Leave',
        },
    },
    Event: {
        value: 'Event',
        label: 'Event',
        color: 'orange',
        colorMapping: {
            background: 'bg-warning-subtle',
            text: 'text-warning-text',
            border: 'border-warning',
            semanticCategory: 'warning',
            label: 'Event',
        },
    },
    '301Meeting': {
        value: '301Meeting',
        label: '301 Meeting',
        color: 'amber',
        colorMapping: {
            background: 'bg-warning-subtle',
            text: 'text-warning-text',
            border: 'border-warning',
            semanticCategory: 'warning',
            label: '301 Meeting',
        },
    },
    CompanyHoliday: {
        value: 'CompanyHoliday',
        label: 'Company Holiday',
        color: 'emerald',
        colorMapping: {
            background: 'bg-success-subtle',
            text: 'text-success-text',
            border: 'border-success',
            semanticCategory: 'success',
            label: 'Company Holiday',
        },
    },
    holiday: {
        value: 'holiday',
        label: 'Public Holiday',
        color: 'neutral',
        colorMapping: {
            background: 'bg-muted',
            text: 'text-content',
            border: 'border-border',
            semanticCategory: 'neutral',
            label: 'Public Holiday',
        },
    },
};

/**
 * Legacy color to semantic token mapping
 * 
 * Maps legacy EventColor values to semantic token classes.
 * This maintains backward compatibility while migrating to semantic tokens.
 */
export const COLOR_TO_SEMANTIC_MAPPING: Record<EventColor, EventColorMapping> = {
    blue: {
        background: 'bg-primary-subtle',
        text: 'text-primary-text',
        border: 'border-primary',
        semanticCategory: 'primary',
        label: 'Primary',
    },
    violet: {
        background: 'bg-primary-subtle',
        text: 'text-primary-text',
        border: 'border-primary',
        semanticCategory: 'primary',
        label: 'Primary',
    },
    emerald: {
        background: 'bg-success-subtle',
        text: 'text-success-text',
        border: 'border-success',
        semanticCategory: 'success',
        label: 'Success',
    },
    rose: {
        background: 'bg-danger-subtle',
        text: 'text-danger-text',
        border: 'border-danger',
        semanticCategory: 'danger',
        label: 'Danger',
    },
    orange: {
        background: 'bg-warning-subtle',
        text: 'text-warning-text',
        border: 'border-warning',
        semanticCategory: 'warning',
        label: 'Warning',
    },
    amber: {
        background: 'bg-warning-subtle',
        text: 'text-warning-text',
        border: 'border-warning',
        semanticCategory: 'warning',
        label: 'Warning',
    },
    cyan: {
        background: 'bg-info-subtle',
        text: 'text-info-text',
        border: 'border-info',
        semanticCategory: 'info',
        label: 'Info',
    },
    neutral: {
        background: 'bg-muted',
        text: 'text-content',
        border: 'border-border',
        semanticCategory: 'neutral',
        label: 'Neutral',
    },
};

/**
 * Get event type definition by value
 * 
 * @param eventType - The event type value
 * @returns Event type definition or undefined if not found
 */
export function getEventTypeDefinition(eventType?: string): EventTypeDefinition | undefined {
    if (!eventType) return undefined;
    return EVENT_TYPE_REGISTRY[eventType];
}

/**
 * Get semantic color mapping for an event type
 * 
 * @param eventType - The event type value
 * @returns Semantic color mapping
 */
export function getEventTypeColorMapping(eventType?: string): EventColorMapping {
    const definition = getEventTypeDefinition(eventType);
    if (definition) {
        return definition.colorMapping;
    }

    // Default to primary color for unknown event types
    return COLOR_TO_SEMANTIC_MAPPING.blue;
}

/**
 * Get semantic color mapping from legacy EventColor
 * 
 * @param color - Legacy event color
 * @returns Semantic color mapping
 */
export function getSemanticColorMapping(color: EventColor): EventColorMapping {
    return COLOR_TO_SEMANTIC_MAPPING[color] || COLOR_TO_SEMANTIC_MAPPING.blue;
}

/**
 * Get CSS classes for event styling using semantic tokens
 * 
 * @param color - Event color
 * @param variant - Style variant ('default' | 'subtle' | 'solid')
 * @returns CSS class string
 */
export function getEventColorClasses(
    color: EventColor,
    variant: 'default' | 'subtle' | 'solid' = 'default'
): string {
    const mapping = getSemanticColorMapping(color);

    switch (variant) {
        case 'subtle':
            return `${mapping.background} ${mapping.text} border ${mapping.border}`;
        case 'solid':
            // For solid variant, use stronger background colors
            const solidBg = mapping.background.replace('-subtle', '');
            return `${solidBg} text-white border ${mapping.border}`;
        case 'default':
        default:
            return `${mapping.background} ${mapping.text} border ${mapping.border}`;
    }
}

/**
 * Get CSS classes for event type using semantic tokens
 * 
 * @param eventType - Event type value
 * @param variant - Style variant
 * @returns CSS class string
 */
export function getEventTypeColorClasses(
    eventType?: string,
    variant: 'default' | 'subtle' | 'solid' = 'default'
): string {
    const mapping = getEventTypeColorMapping(eventType);

    switch (variant) {
        case 'subtle':
            return `${mapping.background} ${mapping.text} border ${mapping.border}`;
        case 'solid':
            const solidBg = mapping.background.replace('-subtle', '');
            return `${solidBg} text-white border ${mapping.border}`;
        case 'default':
        default:
            return `${mapping.background} ${mapping.text} border ${mapping.border}`;
    }
}

/**
 * Get all available event types
 * 
 * @returns Array of event type definitions
 */
export function getAllEventTypes(): EventTypeDefinition[] {
    return Object.values(EVENT_TYPE_REGISTRY);
}

/**
 * Validate if an event type exists in the registry
 * 
 * @param eventType - Event type to validate
 * @returns True if event type exists
 */
export function isValidEventType(eventType: string): boolean {
    return eventType in EVENT_TYPE_REGISTRY;
}
