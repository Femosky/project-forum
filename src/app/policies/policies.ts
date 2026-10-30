import { APP_NAME, LEGAL_EMAIL } from '@/lib/constants';

// The policy pages. Plain data so the pages stay static and the wording is easy to review in one place.
// Before public launch these should get a one-off legal review (see docs/ROADMAP.md, section 5).

export type PolicySection = { heading: string; paragraphs?: string[]; items?: string[] };
export type Policy = { slug: string; title: string; summary: string; updated: string; sections: PolicySection[] };

const UPDATED = '30 October 2026';

export const POLICIES: Policy[] = [
    {
        slug: 'content',
        title: 'Content policy',
        summary: `What can't be posted anywhere on ${APP_NAME}, whatever a community's own rules say.`,
        updated: UPDATED,
        sections: [
            {
                heading: 'The short version',
                paragraphs: [
                    `${APP_NAME} is for asking questions, sharing what you know and helping each other. Communities set their own rules on top of this policy, but nothing here can be switched off by a community.`,
                ],
            },
            {
                heading: 'Not allowed',
                items: [
                    'Scams and fraud: fake jobs, loans, investment or crypto schemes, advance-fee requests, romance scams, and anything asking people to pay or share details to receive money or work.',
                    'Spam: repeated or bulk posting, posts that exist only to drive traffic, and undisclosed advertising.',
                    'Harassment and bullying: targeting a person with abuse, threats or unwanted contact, or encouraging others to.',
                    'Hate: attacking people for their ethnicity, tribe, nationality, religion, gender, sexual orientation, disability or similar traits.',
                    'Violence: threats, incitement, or praise of violence against people.',
                    'Sexual content involving minors, in any form. This is reported to the authorities.',
                    'Pornography and explicit sexual content, anywhere on the site, including communities marked NSFW.',
                    'Sexual content shared without consent.',
                    "Personal information: someone's phone number, address, workplace, ID documents or private photos without their consent.",
                    'Impersonation of people, brands or organisations in a misleading way.',
                    'Content that breaks the law, including selling illegal goods or services.',
                    'False information that can cause real harm, such as fake health cures or fake emergency alerts.',
                ],
            },
            {
                heading: 'Mature (NSFW) content',
                paragraphs: [
                    'Some things worth discussing are hard to look at or not for every moment: graphic news, sexual health, strong language. Posts like these are marked NSFW, by their author, by the community, or automatically. NSFW means mature, never explicit: pornography is not allowed even there.',
                    'Mature posts and communities stay out of feeds, trending, search and the communities list unless you switch on "Show mature content" in your settings (only for accounts, which are for people 18 and over). If you follow a link to one, it opens blurred until you choose to see it. Mature pages have no ads and are kept out of search engines.',
                ],
            },
            {
                heading: 'Anonymous posting',
                paragraphs: [
                    'You can post anonymously so you can ask about sensitive things like salaries, landlords, health or relationships. Anonymity hides your name from other readers. It does not hide your account from the community\'s moderators or the site team, and it is not a shield for breaking this policy.',
                ],
            },
            {
                heading: 'What happens when something breaks the rules',
                paragraphs: [
                    'Moderators and the site team may remove content, lock threads, mute or ban accounts from a community, and suspend accounts from the whole site. Some posts and comments are held for review automatically, for example when a new account shares a phone number or a shortened link, or when an automatic check finds explicit sexual content. Sexual content is reviewed by the site team, not the community\'s moderators. Revealing or graphic content that is allowed is marked NSFW instead of being held. Held posts are reviewed by a person; nothing is deleted automatically.',
                    'Every moderation action is logged with who took it and why.',
                ],
            },
            {
                heading: 'Automatic checks',
                paragraphs: [
                    'We use automated checks to filter explicit content: words and phrases in posts and comments, and every picture before it appears. They run on our own servers. They are good at the obvious cases, but they can miss things and they can flag something by mistake, so a person reviews what they hold.',
                    'Anything that gets past them is still against this policy. When it is reported or we find it, we review it, and we can remove any content or account at our discretion.',
                ],
            },
            {
                heading: 'Reporting',
                paragraphs: [
                    'Use Report on any post, comment or profile. Reports are anonymous to the person reported. For legal requests, see the legal and takedown page.',
                ],
            },
        ],
    },
    {
        slug: 'community-guidelines',
        title: 'Community guidelines',
        summary: 'How to be a good member: the habits that make answers worth reading.',
        updated: UPDATED,
        sections: [
            {
                heading: 'Ask well',
                items: [
                    'Search first; your question may already have good answers.',
                    'Give context: where you are, what you have tried, what you need.',
                    'Pick the community that fits, and follow its rules.',
                ],
            },
            {
                heading: 'Answer well',
                items: [
                    'Share what you know first-hand, and say when you are guessing.',
                    'Disagree with ideas, not people.',
                    'Vote for answers that help, not for people you like.',
                ],
            },
            {
                heading: 'Stay safe',
                items: [
                    'Never pay anyone or share bank, card or ID details because of a post or a private message.',
                    'Be careful with offers that move the conversation to WhatsApp, Telegram or phone calls.',
                    'Report anything that looks like a scam. It helps everyone.',
                ],
            },
            {
                heading: 'New accounts',
                paragraphs: [
                    'To keep scammers out, new accounts have a few limits at first: no links for the first day (or until you have some karma), a cap on how many posts and comments you can make in an hour, and anonymous posting opens once your account is a day old and your email is verified.',
                ],
            },
        ],
    },
    {
        slug: 'moderators',
        title: 'Moderator guidelines',
        summary: 'What we expect from the people who run communities.',
        updated: UPDATED,
        sections: [
            {
                heading: 'Your role',
                paragraphs: [
                    'Moderators are volunteers who keep a community on topic and safe. You can set rules, remove content, lock threads, pin posts, and mute or ban members, all within the content policy.',
                ],
            },
            {
                heading: 'Expectations',
                items: [
                    'Write clear rules and apply them the same way to everyone.',
                    'Give a reason when you remove something or ban someone; it is kept in the mod log.',
                    'Check the mod queue regularly. Held posts wait for you before anyone sees them.',
                    "Don't use moderator access to identify anonymous posters to anyone else, or to settle personal disputes.",
                    'Never ask members for money, personal details or private contact in exchange for posting or approval.',
                    'Escalate scams, threats and illegal content to the site team with a report.',
                ],
            },
            {
                heading: 'When moderators break these guidelines',
                paragraphs: [
                    'The site team may remove moderators, hand a community to someone else, or take a community down.',
                ],
            },
        ],
    },
    {
        slug: 'legal',
        title: 'Legal requests and takedowns',
        summary: 'How to ask for content to be removed for legal reasons, and how to appeal a decision.',
        updated: UPDATED,
        sections: [
            {
                heading: 'Contact',
                paragraphs: [
                    `Email ${LEGAL_EMAIL}. Include links to the exact posts or comments, the legal basis for your request (for example defamation, copyright or privacy), your name and how to reach you, and a statement that the information you give is accurate.`,
                ],
            },
            {
                heading: 'What we do',
                items: [
                    'We acknowledge requests and review them as quickly as we can.',
                    'Content that clearly breaks the law or the content policy is removed; we may restrict it while we look into a request.',
                    'We keep moderation records and respond to valid requests from law enforcement and courts.',
                    'We may tell the person who posted the content that it was removed, unless the law or the request says otherwise.',
                ],
            },
            {
                heading: 'Your personal data',
                paragraphs: [
                    'You can download everything your account has written from Settings, and delete your account at any time. To ask about other personal data we hold, email the address above.',
                ],
            },
            {
                heading: 'Appeals',
                paragraphs: [
                    `If your content was removed or your account was suspended and you think it was a mistake, email ${LEGAL_EMAIL} with your username and a link to what was removed.`,
                ],
            },
        ],
    },
    {
        slug: 'terms',
        title: 'Terms of use',
        summary: `The agreement between you and ${APP_NAME} when you use the site.`,
        updated: UPDATED,
        sections: [
            {
                heading: 'Using the site',
                items: [
                    'You must be 18 or older to create an account.',
                    'Keep your password to yourself. You are responsible for what happens on your account.',
                    'Follow the content policy and community guidelines. Moderators and the site team can remove content and limit or close accounts that break them.',
                    'We use automated checks to filter explicit content, but they can miss things. Anything that gets past them is reviewed when it is reported or found, and we can remove any content or account at our discretion. Use Report to tell us about anything that breaks the rules.',
                    "Don't scrape the site in a way that slows it down, try to break its security, or use it to send spam.",
                ],
            },
            {
                heading: 'Your content',
                paragraphs: [
                    'You keep ownership of what you post. By posting, you give us a worldwide, free licence to host, show, share and adapt it (for example in previews and search results) so the site can work. The licence ends when you delete the content, except where others have quoted it or we must keep it for legal reasons.',
                    'Posts are public unless they are in a private community. Anonymous posts hide your username from other people, but the site team can see who wrote them when that is needed to deal with abuse or a legal request.',
                ],
            },
            {
                heading: 'No advice',
                paragraphs: [
                    'Answers on the site come from other people, not from professionals. Nothing here is legal, medical, financial or immigration advice. Check anything important with a qualified person.',
                ],
            },
            {
                heading: 'Availability and liability',
                paragraphs: [
                    `The site is provided as it is. We try to keep it running and correct, but we don't promise that it will always be available or free of errors. To the extent the law allows, ${APP_NAME} is not liable for losses that come from using the site or from what other people post.`,
                ],
            },
            {
                heading: 'Changes and contact',
                paragraphs: [
                    `We may update these terms. If a change matters, we will say so on the site before it takes effect. Questions go to ${LEGAL_EMAIL}.`,
                ],
            },
        ],
    },
    {
        slug: 'privacy',
        title: 'Privacy policy',
        summary: `What ${APP_NAME} collects, why, who it is shared with, and how to see or delete it.`,
        updated: UPDATED,
        sections: [
            {
                heading: 'What we collect',
                items: [
                    'Account details: your email address, username, password (stored only as a secure hash) and, if you use Google sign-in, your Google account id.',
                    'What you post: posts, comments, votes, saved posts, community memberships and reports.',
                    'Sign-in sessions: the device type, browser, approximate location (country and city from your IP address) and IP address, so you can see and sign out of your sessions and so we can stop abuse.',
                    'Usage counts: page views, shares and searches, and events such as "signed up" or "posted a comment". These are linked to your account id when you are signed in, never to what you wrote.',
                ],
            },
            {
                heading: 'Why we use it',
                items: [
                    'To run your account and show your content (performing our agreement with you).',
                    'To keep the site safe: spam and scam filters, rate limits and moderation (our legitimate interest in a safe site).',
                    'To understand which features and topics people use, so we can improve them (legitimate interest). Visitors who are not signed in are counted without any id that lasts beyond the current tab.',
                    'To show ads. Sponsored posts are chosen by the community you are reading, not by your personal details. Google ads only use cookies if you allow them.',
                ],
            },
            {
                heading: 'Who we share it with',
                paragraphs: [
                    'We do not sell your data. Service providers process it for us under contract: Neon (database), Render and Vercel (hosting), Resend (email), PostHog (usage counts, stored in the EU), OpenAI (only if we switch on its extra safety check of posts, comments and pictures; it does not use them to train its models), Cloudflare (bot checks and image storage) and Google (sign-in, and ads if you allow them). Some of them store data outside Nigeria, including in the United States and the European Union. We share data with authorities only when the law requires it.',
                ],
            },
            {
                heading: 'How long we keep it',
                items: [
                    'Your account and content: until you delete them.',
                    'Sign-in sessions: until they expire or you sign out.',
                    'Moderation records: kept after removal, because we need them to handle appeals and legal requests.',
                    'Usage counts: kept in aggregate; individual events are deleted after a year.',
                ],
            },
            {
                heading: 'Your rights',
                paragraphs: [
                    `In Settings you can download a copy of your data and delete your account. You can also ask us to correct your data, or object to how we use it, by emailing ${LEGAL_EMAIL}. If you are in Nigeria, this policy follows the Nigeria Data Protection Act 2023, and you can complain to the Nigeria Data Protection Commission.`,
                ],
            },
            {
                heading: 'Security',
                paragraphs: [
                    "Connections are encrypted, passwords are hashed, and access to personal data is limited to the people who run the site. If a breach puts your data at risk, we will tell you and the regulator as the law requires.",
                ],
            },
        ],
    },
    {
        slug: 'cookies',
        title: 'Cookies',
        summary: `The small number of cookies ${APP_NAME} sets, and the ones it asks about first.`,
        updated: '29 October 2026',
        sections: [
            {
                heading: 'Your choice',
                paragraphs: [
                    'On your first visit we ask which optional cookies you allow: "Accept all", "Reject all", or "Choose" to pick. You can change your answer any time with "Cookie settings" at the bottom of the menu or on the Policies page. We keep your answer for 12 months and ask again if this policy changes.',
                ],
            },
            {
                heading: 'Strictly necessary (always on)',
                items: [
                    'access_token and refresh_token keep you signed in (HttpOnly, set by our API; 15 minutes and 90 days).',
                    'theme and data_saver remember the settings you pick (a year).',
                    'cookie_consent remembers your answer to the cookie banner (12 months).',
                    'ad_seen counts how often you have seen each ad today, so the same ad does not follow you around. It holds no personal details and lasts a day.',
                    'Cloudflare Turnstile, the security check on sign-up and some forms, may set its own cookie to tell people from bots.',
                ],
            },
            {
                heading: 'Analytics (on unless you turn it off)',
                paragraphs: [
                    'We count page visits without cookies or anything stored on your device: a visit is identified by a code made from your IP address and browser that changes every day and cannot be traced back to you, and the IP address itself is never stored. Page views also go to PostHog (EU) with a random id that only lives in the open tab. Nothing is counted when you turn analytics off, or when your browser sends a Do Not Track or Global Privacy Control signal (PostHog only).',
                ],
            },
            {
                heading: 'Advertising (off until you allow it)',
                paragraphs: [
                    'With advertising allowed, Google AdSense may set cookies to show ads that match your interests, and the Google Ads tag measures sign-ups and new posts from our own ad campaigns. Without it, you still see ads, but general ones that do not use your browsing history, and the Google Ads tag does not load. We use Google Consent Mode, so Google is told your choice before any of its scripts run.',
                    'Visitors from the EEA and the UK may be asked by Google\'s own consent message instead; when that message is on the page, ours stays out of the way.',
                ],
            },
        ],
    },
    {
        slug: 'ads',
        title: 'Ads and sponsored posts',
        summary: `How ads appear on ${APP_NAME}, how they are chosen, and the rules advertisers follow.`,
        updated: UPDATED,
        sections: [
            {
                heading: 'How ads look',
                paragraphs: [
                    'Ads appear in the feed and between comments. Every one is labelled "Sponsored" (or "From us" for our own announcements) and names the advertiser. Ads cannot be voted on or replied to, and their links are marked as sponsored.',
                ],
            },
            {
                heading: 'How ads are chosen',
                items: [
                    "Sponsored posts from advertisers we work with directly are chosen by the community or topic you're reading, not by your personal details or what you've done elsewhere.",
                    'When no sponsored post fills a space, we may show an ad from Google AdSense. Google uses cookies for this. We ask before Google ads load: allow personalised ads, or choose general ads only. You can change your answer by clearing this site\'s cookies.',
                    'With data saver on, Google ads and ad images are not loaded.',
                    'There are no ads in NSFW communities, in sensitive communities such as health and support spaces, or on locked or removed threads.',
                ],
            },
            {
                heading: 'Rules for advertisers',
                items: [
                    'Ads must follow the content policy. No scams, misleading claims, or adult, gambling or get-rich-quick offers.',
                    'Advertisers are responsible for any regulatory approval their ad needs, such as vetting by the Advertising Regulatory Council of Nigeria (ARCON).',
                    'We may refuse or remove any ad.',
                ],
            },
            {
                heading: 'Reporting an ad',
                paragraphs: ['Use the menu on any ad and choose Report ad. Reports go to the site team.'],
            },
        ],
    },
];

export const findPolicy = (slug: string) => POLICIES.find((policy) => policy.slug === slug);
