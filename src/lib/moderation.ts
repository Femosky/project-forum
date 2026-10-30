import { CommunityCategoryId, ReportReason } from '@/types/api';

// Labels shared by the report dialog, mod queue, admin panel and communities directory

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: 'spam', label: 'Spam' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate', label: 'Hate speech' },
    { value: 'sexual', label: 'Sexual content' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'misinformation', label: 'False information' },
    { value: 'personal_info', label: 'Personal information' },
    { value: 'other', label: 'Something else' },
];

const OLDER_REASONS: Partial<Record<ReportReason, string>> = {
    self_harm: 'Self-harm',
    illegal: 'Illegal content',
    impersonation: 'Impersonation',
};

export const reasonLabel = (reason: ReportReason) =>
    REPORT_REASONS.find((option) => option.value === reason)?.label ?? OLDER_REASONS[reason] ?? reason;

// Same keys as COMMUNITY_CATEGORIES in the backend (src/shared/validation.ts)
export const COMMUNITY_CATEGORIES: { id: CommunityCategoryId; label: string }[] = [
    { id: 'careers', label: 'Jobs & Careers' },
    { id: 'tech', label: 'Tech & Startups' },
    { id: 'relocation', label: 'Relocation & Visas' },
    { id: 'education', label: 'Schools & Education' },
    { id: 'housing', label: 'Rent & Housing' },
    { id: 'money', label: 'Money & Banking' },
    { id: 'business', label: 'Small Business' },
    { id: 'cars', label: 'Cars' },
    { id: 'health', label: 'Health' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'sports', label: 'Sports' },
    { id: 'food', label: 'Food' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'other', label: 'Other' },
];

export const categoryLabel = (id: string | null) => COMMUNITY_CATEGORIES.find((category) => category.id === id)?.label ?? null;

const ACTION_LABELS: Record<string, string> = {
    remove_post: 'removed a post',
    approve_post: 'approved a post',
    lock_post: 'locked a post',
    unlock_post: 'unlocked a post',
    pin_post: 'pinned a post',
    unpin_post: 'unpinned a post',
    sponsor_post: 'marked a post sponsored',
    unsponsor_post: 'unmarked a sponsored post',
    remove_comment: 'removed a comment',
    approve_comment: 'approved a comment',
    lock_comment: 'locked a comment',
    unlock_comment: 'unlocked a comment',
    pin_comment: 'pinned a comment',
    unpin_comment: 'unpinned a comment',
    ban_user: 'banned a user',
    unban_user: 'lifted a ban',
    mute_user: 'muted a user',
    unmute_user: 'lifted a mute',
    set_role: 'changed a role',
    invite_mod: 'invited a moderator',
    cancel_mod_invite: 'cancelled a moderator invitation',
    accept_mod_invite: 'became a moderator',
    decline_mod_invite: 'declined to moderate',
    set_mod_permission: "changed a moderator's permissions",
    remove_mod: 'removed a moderator',
    step_down: 'stepped down as moderator',
    transfer_ownership: 'handed over ownership',
    accept_join_request: 'accepted a join request',
    reject_join_request: 'declined a join request',
    update_community: 'edited community settings',
    resolve_reports: 'closed reports',
    dismiss_reports: 'dismissed reports',
    suspend_user: 'suspended an account',
    unsuspend_user: 'lifted a suspension',
    shadow_ban_user: 'shadow-banned an account',
    lift_shadow_ban: 'lifted a shadow-ban',
    takedown_community: 'took down a community',
    restore_community: 'restored a community',
};

export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action.replace(/_/g, ' ');

// How long a ban, mute or suspension can be, as offered in the tools
export const DURATIONS: { days: number | null; label: string }[] = [
    { days: 1, label: '1 day' },
    { days: 3, label: '3 days' },
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: null, label: 'Permanent' },
];
