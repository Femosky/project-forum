// How a community is named in the interface. URLs use the lowercase name (/c/naijatech); the handle is shown with the
// capitals the community chose (c/NaijaTech); people mostly see a proper name: the display name its moderators set,
// or the handle turned into words ("NaijaTech" -> "Naija Tech", and older "naija_tech" handles the same way).
export function humanizeHandle(handle: string): string {
    return handle
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

type Named = { name: string; name_styled?: string | null; display_name?: string | null };

// "NaijaTech": the handle with its capitals, for "c/NaijaTech"
export const communityHandle = (community: Named) => community.name_styled || community.name;

export function communityLabel(community: Named): string {
    return community.display_name?.trim() || humanizeHandle(communityHandle(community));
}
