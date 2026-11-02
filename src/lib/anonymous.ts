// Who a post or comment shows as. Anonymous ones show a starter picture, to everyone, including their author, who also
// sees "(you)" so they can tell which are theirs. Moderators still see the name.
type Item = { author: { username: string; avatar?: string | null } | null; anon_avatar?: string | null; viewer?: { is_author?: boolean } | null };

export function anonymousFor(item: Item) {
    const hidden = Boolean(item.anon_avatar) && (!item.author || Boolean(item.viewer?.is_author));
    return { hidden, mine: hidden && Boolean(item.viewer?.is_author), picture: { username: 'anonymous', avatar: item.anon_avatar } };
}
