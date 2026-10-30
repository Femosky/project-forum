// The community icons anyone can pick: a line drawing on a soft tint. The picture is drawn by /community-icon/{name}.svg
// (nothing to store), and these lists are what the picker needs. `words` are what the suggestions match.

export const ICON_COLOURS = {
    indigo: { background: '#26255c', line: '#b4b8fb' },
    violet: { background: '#33235f', line: '#cdb9fb' },
    blue: { background: '#1b3263', line: '#a9c8fb' },
    fuchsia: { background: '#4a1f55', line: '#efb3f7' },
    pink: { background: '#55203f', line: '#f8b4d3' },
    red: { background: '#552128', line: '#fbb4bc' },
    amber: { background: '#4d3214', line: '#f6cf89' },
    slate: { background: '#2a3240', line: '#c3cddb' },
} as const;

export type IconColour = keyof typeof ICON_COLOURS;

export const ICON_GLYPHS: { name: string; label: string; words: string[] }[] = [
    { name: 'football', label: 'Football', words: ['football', 'soccer', 'eagles', 'league', 'sport', 'sports', 'match', 'club'] },
    { name: 'trophy', label: 'Trophy', words: ['trophy', 'champion', 'premier', 'league', 'cup', 'win', 'competition'] },
    { name: 'music', label: 'Music', words: ['music', 'afrobeats', 'songs', 'album', 'artist', 'dj'] },
    { name: 'mic', label: 'Mic', words: ['mic', 'podcast', 'comedy', 'radio', 'singing', 'rap'] },
    { name: 'plane', label: 'Travel', words: ['travel', 'japa', 'visa', 'abroad', 'flight', 'relocate', 'migration', 'immigration'] },
    { name: 'house', label: 'Home', words: ['house', 'home', 'rent', 'property', 'landlord', 'real', 'estate', 'housing'] },
    { name: 'briefcase', label: 'Work', words: ['job', 'jobs', 'career', 'careers', 'work', 'cv', 'interview', 'salary'] },
    { name: 'code', label: 'Code', words: ['code', 'coding', 'developer', 'programming', 'software', 'web'] },
    { name: 'chip', label: 'Tech', words: ['tech', 'technology', 'ai', 'gadget', 'startup', 'computer', 'phone'] },
    { name: 'chart', label: 'Investing', words: ['invest', 'investing', 'stocks', 'crypto', 'market', 'trading', 'economy'] },
    { name: 'wallet', label: 'Money', words: ['money', 'finance', 'budget', 'savings', 'salary', 'naira'] },
    { name: 'bank', label: 'Government', words: ['bank', 'government', 'policy', 'civic', 'state'] },
    { name: 'shop', label: 'Business', words: ['business', 'shop', 'store', 'sme', 'seller', 'market', 'trader', 'entrepreneur'] },
    { name: 'food', label: 'Food', words: ['food', 'cooking', 'recipe', 'recipes', 'restaurant', 'jollof', 'eat', 'chef'] },
    { name: 'graduation', label: 'Study', words: ['study', 'school', 'university', 'scholarship', 'student', 'students', 'education', 'exam'] },
    { name: 'book', label: 'Books', words: ['book', 'books', 'reading', 'writing', 'literature', 'poetry'] },
    { name: 'heart', label: 'Relationships', words: ['relationship', 'relationships', 'dating', 'love', 'marriage', 'family'] },
    { name: 'vote', label: 'Elections', words: ['vote', 'election', 'elections', 'politics', 'political', 'inec', 'poll'] },
    { name: 'news', label: 'News', words: ['news', 'current', 'affairs', 'headlines', 'journalism'] },
    { name: 'tv', label: 'TV', words: ['tv', 'bbnaija', 'brother', 'reality', 'show', 'series', 'nollywood'] },
    { name: 'film', label: 'Film', words: ['film', 'films', 'movie', 'movies', 'cinema', 'nollywood'] },
    { name: 'gamepad', label: 'Gaming', words: ['game', 'games', 'gaming', 'esports', 'playstation', 'xbox'] },
    { name: 'camera', label: 'Photography', words: ['photo', 'photos', 'photography', 'camera', 'video'] },
    { name: 'health', label: 'Health', words: ['health', 'medical', 'doctor', 'nurse', 'hospital', 'wellness'] },
    { name: 'fitness', label: 'Fitness', words: ['fitness', 'gym', 'workout', 'weight', 'running'] },
    { name: 'church', label: 'Christianity', words: ['church', 'christian', 'christianity', 'faith', 'bible', 'gospel'] },
    { name: 'mosque', label: 'Islam', words: ['islam', 'muslim', 'faith', 'quran', 'ramadan'] },
    { name: 'car', label: 'Cars', words: ['car', 'cars', 'auto', 'driving', 'mechanic', 'traffic'] },
    { name: 'bike', label: 'Cycling', words: ['bike', 'cycling', 'okada', 'dispatch'] },
    { name: 'baby', label: 'Parenting', words: ['baby', 'parent', 'parents', 'parenting', 'mums', 'kids', 'children'] },
    { name: 'fashion', label: 'Fashion', words: ['fashion', 'style', 'clothes', 'ankara', 'beauty', 'hair'] },
    { name: 'art', label: 'Art', words: ['art', 'design', 'creative', 'artist', 'drawing', 'painting'] },
    { name: 'chat', label: 'Chat', words: ['chat', 'talk', 'discussion', 'gist', 'advice', 'ask', 'questions'] },
    { name: 'people', label: 'Community', words: ['community', 'people', 'local', 'neighbours', 'group', 'meetup'] },
    { name: 'globe', label: 'World', words: ['world', 'global', 'international', 'diaspora', 'africa'] },
    { name: 'language', label: 'Languages', words: ['language', 'languages', 'yoruba', 'igbo', 'hausa', 'pidgin', 'translation'] },
    { name: 'law', label: 'Law', words: ['law', 'legal', 'lawyer', 'rights', 'court'] },
    { name: 'farm', label: 'Farming', words: ['farm', 'farming', 'agriculture', 'garden', 'climate', 'environment'] },
    { name: 'pets', label: 'Pets', words: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animals'] },
    { name: 'idea', label: 'Ideas', words: ['idea', 'ideas', 'learn', 'science', 'tips', 'how'] },
    { name: 'rocket', label: 'Startups', words: ['startup', 'startups', 'founder', 'founders', 'launch', 'product'] },
    { name: 'shield', label: 'Safety', words: ['safety', 'security', 'scam', 'scams', 'privacy', 'police'] },
];

export const iconUrl = (glyph: string, colour: IconColour) => `/community-icon/${glyph}-${colour}.svg`;

// Best matches for a community, from the words in its name and description ("LagosRent" counts as lagos and rent)
export function suggestIcons(name: string, description: string | null | undefined, limit = 6) {
    const text = `${name.replace(/([a-z])([A-Z])/g, '$1 $2')} ${description ?? ''}`.toLowerCase();
    const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
    return ICON_GLYPHS.map((glyph) => ({ glyph, score: glyph.words.filter((word) => words.has(word)).length }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ glyph }) => glyph);
}
