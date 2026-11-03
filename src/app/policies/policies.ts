import { APP_NAME, LEGAL_EMAIL } from '@/lib/constants';

// The policy pages. Plain data so the pages stay static and the wording is easy to review in one place.
// Before public launch these should get a one-off legal review (see docs/ROADMAP.md, section 5).

export type PolicySection = { heading: string; id?: string; paragraphs?: string[]; items?: string[]; links?: { label: string; href: string }[] };
export type Policy = { slug: string; title: string; summary: string; updated: string; sections: PolicySection[] };

const UPDATED = '30 October 2026';
const REVISED = '3 November 2026';

export const POLICIES: Policy[] = [
    {
        slug: 'content',
        title: 'Content policy',
        summary: `What can't be posted anywhere on ${APP_NAME}, whatever a community's own rules say.`,
        updated: REVISED,
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
                    'Terrorism and violent extremism: recruiting for, funding or promoting groups that use violence.',
                    'Encouraging suicide, self-harm or eating disorders. Talking about your own struggles, or supporting someone else, is welcome.',
                    'Sexual content involving minors, or anyone who looks under 18, in any form. This is reported to the authorities.',
                    'Pornography and explicit sexual content, anywhere on the site, including communities marked NSFW. That includes sexual acts, exposed genitals, and links to porn sites.',
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
                heading: 'What is reputation?',
                id: 'reputation',
                paragraphs: [
                    'Reputation is the score shown on your profile. It goes up when people upvote your posts and comments, and down when they downvote them. It shows that real people find what you share useful, which is why it unlocks a few things for new accounts.',
                ],
            },
            {
                heading: 'New accounts',
                id: 'new-accounts',
                paragraphs: [
                    'To keep scammers out, new accounts have a few limits at first. Whenever one stops you, the site tells you which one and when it lifts.',
                ],
                items: [
                    'Links and pictures: open once your account is a day old or has 10 reputation, whichever comes first.',
                    'Posting pace: for the first week (or until you have 10 reputation) you can make 3 posts and 10 comments an hour.',
                    'Anonymous posts: open once your account is a day old and your email is verified.',
                    'Accounts the site knows and trusts can be marked as trusted by the admins, which lifts these limits.',
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
        updated: REVISED,
        sections: [
            {
                heading: 'Using the site',
                items: [
                    'Anyone can read public posts. You must be 18 or older to create an account, post, comment or vote. If we learn that an account belongs to someone under 18, we close it.',
                    'Keep your password to yourself. You are responsible for what happens on your account.',
                    'Follow the content policy and community guidelines. Moderators and the site team can remove content and limit or close accounts that break them.',
                    'We use automated checks to filter explicit content, but they can miss things. Anything that gets past them is reviewed when it is reported or found, and we can remove any content or account at our discretion. Use Report to tell us about anything that breaks the rules.',
                    "Don't scrape the site in a way that slows it down, try to break its security, or use it to send spam.",
                    "Don't click your own ads or Google ads, or ask anyone else to. It harms advertisers and can get the site's ads switched off.",
                ],
            },
            {
                heading: 'Your content',
                paragraphs: [
                    'You keep ownership of what you post. By posting, you give us a worldwide, free licence to host, show, share and adapt it (for example in previews and search results) so the site can work. The licence ends when you delete the content, except where others have quoted it or we must keep it for legal reasons.',
                    'Posts are public unless they are in a private community. Anonymous posts hide your username from other people, but the site team can see who wrote them when that is needed to deal with abuse or a legal request.',
                    'If you delete your account, your posts and comments stay on the site without your name, so the conversations they belong to still make sense. Delete anything you want gone before you delete your account.',
                ],
            },
            {
                heading: 'Mature content',
                paragraphs: [
                    'Mature (NSFW) posts are only shown to signed-in adults who switch them on in Settings, and never with ads. By switching them on, you confirm you are 18 or older and want to see them. Pornography is not allowed anywhere, including in mature communities.',
                ],
            },
            {
                heading: 'Ads',
                paragraphs: [
                    'The site is free because it shows ads. How ads are chosen and labelled is explained on the ads page. An ad is not an endorsement by us or by the community it appears in.',
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
                    `The site is provided as it is. We try to keep it running and correct, but we don't promise that it will always be available or free of errors. To the extent the law allows, ${APP_NAME} is not liable for losses that come from using the site or from what other people post. Nothing in these terms takes away rights you have by law as a consumer.`,
                ],
            },
            {
                heading: 'Ending this agreement',
                paragraphs: [
                    'You can stop using the site and delete your account at any time from Settings. We can suspend or close an account that breaks these terms, and we will usually say why. You can appeal as described on the legal page.',
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
        summary: `What ${APP_NAME} collects, why, who it is shared with, how long it is kept, and how to see or delete it.`,
        updated: REVISED,
        sections: [
            {
                heading: 'Who we are',
                paragraphs: [
                    `${APP_NAME} ("we") runs this site and decides how the personal data on it is used. For anything about your data, write to ${LEGAL_EMAIL}. We answer within a month, usually much sooner.`,
                ],
            },
            {
                heading: 'What we collect',
                items: [
                    'Account details: your email address, username, password (stored only as a secure hash) and, if you use Google sign-in, your Google account id.',
                    'What you post: posts, comments, pictures, votes, saved posts, community memberships and reports.',
                    'Sign-in records: the device type, browser, approximate location (country and city from your IP address) and IP address of each sign-in, so you can see and sign out of your sessions and so we can stop account takeovers and abuse.',
                    'Settings: your email and notification choices, and, if you turn on browser notifications, the address your browser gives us to deliver them.',
                    'Usage counts: page views, shares and searches, and events such as "signed up" or "posted a comment". These are linked to your account id when you are signed in, never to what you wrote.',
                    'Error reports: when a page breaks, the page address, your browser type and the error message, so we can fix it. They do not include your account or what you wrote.',
                ],
            },
            {
                heading: 'Why we use it, and our legal basis',
                items: [
                    'To run your account and show your content (to perform our agreement with you).',
                    'To keep the site safe: spam and scam filters, explicit-content checks, rate limits and moderation (our legitimate interest in a safe site, and yours).',
                    'To understand which features and topics people use, and to fix errors, so we can improve the site (legitimate interest). Visitors who are not signed in are counted without any id that lasts beyond the current tab. You can turn this off in Cookie settings.',
                    'To bring you back when there is something for you: emails about replies and mentions, a digest of top posts from your communities (based on the communities you joined and what you voted on or commented in), and browser notifications if you turn them on. You can change or stop each one in Settings, and every email has an unsubscribe link. The digest stops by itself if you stop visiting.',
                    'To show ads. Sponsored posts are chosen by the community you are reading, not by your personal details. Google only personalises ads if you allow advertising cookies (your consent, which you can withdraw at any time in Cookie settings).',
                    'To meet legal duties, such as answering valid orders from courts and authorities (legal obligation).',
                ],
            },
            {
                heading: 'Anonymous posts',
                paragraphs: [
                    'An anonymous post or comment hides your username from readers, but it is still linked to your account in our records. Moderators of the community and the site team can see who wrote it when they need to deal with abuse, and we may have to share it if the law requires.',
                ],
            },
            {
                heading: 'Who we share it with',
                paragraphs: [
                    'We do not sell your data. These service providers process it for us under contract, only to run the site:',
                ],
                items: [
                    'Neon (database) and Render (our servers), both in Frankfurt, Germany.',
                    'Vercel (serves the website pages, from Frankfurt and nearby edge servers).',
                    'Cloudflare (picture storage and the bot check on sign-up).',
                    'Resend (sends our emails).',
                    'PostHog (usage counts, stored in the EU).',
                    'Sentry (error reports, stored in the United States).',
                    'Google (sign-in, if you use it, and ads).',
                    'OpenAI, only if we switch on its extra safety check of posts, comments and pictures. It does not use them to train its models.',
                ],
            },
            {
                heading: 'Data sent outside Nigeria',
                paragraphs: [
                    'Most of your data is stored in the European Union, and some providers are based in the United States. When data leaves Nigeria or the EU, we rely on safeguards the law recognises, such as the European Commission\'s standard contractual clauses in our providers\' data agreements. We share data with authorities only when the law requires it.',
                ],
            },
            {
                heading: 'How long we keep it',
                items: [
                    'Your account: until you delete it. When you do, we remove your email address, password, Google link, sign-in records and notification settings at once. Your username stays reserved so nobody can pretend to be you, and your posts and comments stay up without your name unless you delete them first.',
                    'Sign-in records: deleted 30 days after the session ends.',
                    'Moderation records and reports: kept after removal, because we need them to handle appeals, repeat abuse and legal requests.',
                    'Usage counts: kept in aggregate; individual events are deleted after a year.',
                    'Error reports: deleted by Sentry within 90 days.',
                    'Backups: encrypted copies of the database are kept for 35 days, so deleted data is gone from them within 35 days.',
                ],
            },
            {
                heading: 'Your rights',
                paragraphs: [
                    `You can ask to see the data we hold about you, to correct it, to delete it, to get a copy you can take elsewhere, or to limit or object to how we use it. You can withdraw a consent at any time, without affecting what happened before. In Settings you can already download what your account has written and delete your account; for anything else, email ${LEGAL_EMAIL}. We may ask you to confirm it is really you.`,
                    'If you are unhappy with our answer, you can complain to the Nigeria Data Protection Commission (ndpc.gov.ng), or, if you are in the European Union or the UK, to the data protection authority where you live.',
                ],
            },
            {
                heading: 'Children',
                paragraphs: [
                    'Accounts are for people 18 and over, and the site is not meant for children. If we learn that we hold data from someone under 18, we delete it. If you think a child has an account, tell us at the address above.',
                ],
            },
            {
                heading: 'Automatic checks',
                paragraphs: [
                    'Automated filters look for spam, scams and explicit content in what is posted. When they hold something, a person reviews it before any final decision; nothing is deleted or banned by a machine alone.',
                ],
            },
            {
                heading: 'Security',
                paragraphs: [
                    'Connections are encrypted, passwords are hashed, backups are encrypted, and access to personal data is limited to the people who run the site. If a breach puts your data at risk, we will tell you and the regulator as the law requires, within 72 hours of finding out where the law asks for that.',
                ],
            },
            {
                heading: 'Changes',
                paragraphs: [
                    'If we change this policy in a way that matters, we will say so on the site before the change takes effect, and ask again about cookies if the cookie choices change.',
                ],
            },
        ],
    },
    {
        slug: 'cookies',
        title: 'Cookies',
        summary: `The small number of cookies ${APP_NAME} sets, and the ones it asks about first.`,
        updated: REVISED,
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
                    'Google sign-in: on the log-in and sign-up pages only, Google\'s sign-in script loads to show the "Continue with Google" button, and Google may set its own cookies when you use it. It does not load anywhere else on the site.',
                ],
            },
            {
                heading: 'Analytics (cookie-free, on unless you turn it off)',
                paragraphs: [
                    'We count page visits without cookies or anything stored on your device: a visit is identified by a code made from your IP address and browser that changes every day and cannot be traced back to you, and the IP address itself is never stored. Page views also go to PostHog (EU) with a random id that only lives in the open tab. Nothing is counted when you turn analytics off, or when your browser sends a Do Not Track or Global Privacy Control signal (PostHog only). Error reports to Sentry use no cookies either.',
                ],
            },
            {
                heading: 'Advertising (off until you allow it)',
                paragraphs: [
                    'Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this site and other sites. Google\'s advertising cookies let it and its partners show you ads based on those visits. On this site that only happens if you allow advertising; the Google Ads tag that measures sign-ups and new posts from our own ad campaigns also loads only then.',
                    'Without it, you still see ads, but general ones that do not use your browsing history. Google may still use cookies or local storage to limit how often an ad is shown and to stop ad fraud. We use Google Consent Mode, so Google is told your choice before any of its scripts run.',
                    'Visitors from the EEA, the UK and Switzerland may be asked by Google\'s own consent message instead; when that message is on the page, ours stays out of the way.',
                    'You can turn off personalised ads from Google, and from many other ad companies, here:',
                ],
                links: [
                    { label: 'Google Ads Settings', href: 'https://adssettings.google.com' },
                    { label: 'How Google uses data from sites that show its ads', href: 'https://policies.google.com/technologies/partner-sites' },
                    { label: 'aboutads.info (other ad companies)', href: 'https://www.aboutads.info/choices' },
                    { label: 'Your Online Choices (Europe)', href: 'https://www.youronlinechoices.eu' },
                ],
            },
        ],
    },
    {
        slug: 'ads',
        title: 'Ads and sponsored posts',
        summary: `How ads appear on ${APP_NAME}, how they are chosen, and the rules advertisers follow.`,
        updated: REVISED,
        sections: [
            {
                heading: 'How ads look',
                paragraphs: [
                    'Ads appear in the feed and between comments, never inside a post or comment. Every one is labelled "Sponsored", "Advertisement" or, for our own announcements, "From us". Sponsored posts name the advertiser, cannot be voted on or replied to, and their links are marked as sponsored.',
                ],
            },
            {
                heading: 'How ads are chosen',
                items: [
                    "Sponsored posts from advertisers we work with directly are chosen by the community or topic you're reading, not by your personal details or what you've done elsewhere.",
                    'When no sponsored post fills a space, we may show an ad from Google AdSense. Google only uses advertising cookies to personalise it if you allow advertising in Cookie settings; otherwise you get general ads. The cookie policy explains this and how to opt out.',
                    'With data saver on, Google ads and ad images are not loaded.',
                    'There are no ads in NSFW communities or on mature posts, in sensitive communities such as health and support spaces, on locked or removed threads, or on account, settings and sign-in pages.',
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
                paragraphs: [
                    'Use the menu on any sponsored post and choose Report ad; reports go to the site team. For a Google ad, use the AdChoices icon on the ad itself.',
                ],
            },
        ],
    },
    {
        slug: 'about',
        title: 'About and contact',
        summary: `What ${APP_NAME} is, who runs it, and how to reach us.`,
        updated: REVISED,
        sections: [
            {
                heading: `What ${APP_NAME} is`,
                paragraphs: [
                    `${APP_NAME} is a place to ask questions and get real answers from people who have been there: about work, money, school, travel, tech, and everyday life. It started in Nigeria and is open to everyone. Communities are run by volunteer moderators, and the site is free because it shows ads.`,
                ],
            },
            {
                heading: 'Contact',
                items: [
                    `Legal requests, privacy and data questions, appeals: ${LEGAL_EMAIL}.`,
                    'Something wrong with a post, comment or profile: use Report on it. It is faster than email.',
                    `Advertising with us, and anything else: ${LEGAL_EMAIL}.`,
                ],
            },
        ],
    },
];

export const findPolicy = (slug: string) => POLICIES.find((policy) => policy.slug === slug);
