/**
 * Public API for entities/user/ui
 * 
 * This file defines the public interface for this module.
 * Only exports from this file should be imported by other modules.
 */

export { AvatarGroup, AvatarOverflow, UserAvatar } from "./UserAvatar"
export type {
    AvatarGroupProps,
    AvatarOverflowProps, UserAvatarProps
} from "./UserAvatar"

export { UserCard } from "./UserCard"
export type { UserCardProps } from "./UserCard"

// export type { UserProfile } from './types'erProfile"
export type { UserProfileProps } from "./UserProfile"
