// How a community is named in the interface. URLs keep the handle (/c/naija_tech); people see a proper name: the
// display name its moderators set, or the handle turned into words ("naija_tech" -> "Naija Tech").
export function humanizeHandle(handle: string): string {
    return handle
        .split(/[_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function communityLabel(community: { name: string; display_name?: string | null }): string {
    return community.display_name?.trim() || humanizeHandle(community.name);
}
