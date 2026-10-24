import { APP_NAME, LEGAL_EMAIL } from '@/lib/constants';

// The policy pages. Plain data so the pages stay static and the wording is easy to review in one place.
// Before public launch these should get a one-off legal review (see docs/ROADMAP.md, section 5).

export type PolicySection = { heading: string; paragraphs?: string[]; items?: string[] };
export type Policy = { slug: string; title: string; summary: string; updated: string; sections: PolicySection[] };

const UPDATED = '24 October 2026';

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
                    'Sexual content shared without consent, and explicit content outside communities marked NSFW.',
                    "Personal information: someone's phone number, address, workplace, ID documents or private photos without their consent.",
                    'Impersonation of people, brands or organisations in a misleading way.',
                    'Content that breaks the law, including selling illegal goods or services.',
                    'False information that can cause real harm, such as fake health cures or fake emergency alerts.',
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
                    'Moderators and the site team may remove content, lock threads, mute or ban accounts from a community, and suspend accounts from the whole site. Some posts are held for review automatically, for example when a new account shares a phone number or a shortened link. Held posts are reviewed by a person; nothing is deleted automatically.',
                    'Every moderation action is logged with who took it and why.',
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
];

export const findPolicy = (slug: string) => POLICIES.find((policy) => policy.slug === slug);
