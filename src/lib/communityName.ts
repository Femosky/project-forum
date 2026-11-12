// How a community is named in the interface. URLs use the lowercase name (/c/lagosrent); the handle is shown with the
// capitals the community chose (c/LagosRent); people mostly see a proper name: the display name its moderators set,
// or the handle turned into words ("LagosRent" -> "Lagos Rent", and older "lagos_rent" handles the same way).
export function humanizeHandle(handle: string): string {
    return handle
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

type Named = { name: string; name_styled?: string | null; display_name?: string | null };

// "LagosRent": the handle with its capitals, for "c/LagosRent"
export const communityHandle = (community: Named) => community.name_styled || community.name;

export function communityLabel(community: Named): string {
    return community.display_name?.trim() || humanizeHandle(communityHandle(community));
}
