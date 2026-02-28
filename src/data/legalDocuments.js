// Legal document drafts for the Mythouse platform
// Each key matches the document ID in AdminPage's LEGAL_CONTRACTS / LEGAL_POLICIES arrays

const LEGAL_DOCUMENTS = {

  // ═══════════════════════════════════════════════════
  // CONTRACTS & AGREEMENTS
  // ═══════════════════════════════════════════════════

  'terms-of-service': `
MYTHOUSE — TERMS OF SERVICE

Last Updated: [DATE]

Welcome to the Mythouse. By creating an account or using this platform, you agree to the following terms. Please read them carefully.

1. ACCEPTANCE OF TERMS

By accessing or using the Mythouse platform ("the Platform," "the Site"), operated by Mythouse / Meteor Steel ("we," "us," "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.

2. ELIGIBILITY

You must be at least 13 years of age to create an account. Users between 13 and 18 must have the consent of a parent or guardian. By creating an account, you represent that you meet these eligibility requirements.

3. ACCOUNT REGISTRATION

You may register using Google authentication via Firebase Auth. You are responsible for maintaining the security of your account credentials. You agree to provide accurate profile information and to notify us promptly of any unauthorized access to your account.

4. PERMITTED USE

The Platform is provided for educational, cultural, and creative exploration of mythology, storytelling, depth psychology, and related fields. You may:
- Browse and interact with all accessible content areas
- Use the Atlas AI companion for educational and exploratory conversation
- Participate in mythic board games (Senet, Pachisi, Royal Game of Ur, Mehen, Snakes & Ladders, Mythouse)
- Create and save personal stories, reflections, and creative writing in the Story Forge
- Complete courses and earn credentials through the Coursework system
- Enter your birth data for natal chart computation and numerological profiles
- Participate in Journeys and Yellow Brick Road challenges

5. PROHIBITED CONDUCT

You agree not to:
- Use the Platform for any unlawful purpose
- Attempt to gain unauthorized access to any part of the Platform or its systems
- Interfere with the proper functioning of the Platform
- Harass, abuse, or harm other users, including guild members, students, and partners
- Upload malicious code or attempt to compromise Platform security
- Misrepresent your identity or qualifications, particularly in the guild program
- Use AI features (Atlas, Story Forge) to generate harmful, abusive, or illegal content
- Scrape, crawl, or systematically download Platform content
- Resell or redistribute Platform content without authorization

6. SUBSCRIPTIONS AND PURCHASES

Certain features require paid subscriptions or one-time purchases. Payment terms, pricing, refund policies, and access levels are governed by the separate Subscription & Purchase Agreement, which is incorporated by reference.

7. INTELLECTUAL PROPERTY

All original content on the Platform — including but not limited to text, data structures, visual designs, game mechanics, journey configurations, synthesis essays, and the Atlas AI system prompt — is the intellectual property of Mythouse / Meteor Steel and is protected by copyright, trademark, and trade secret law.

Third-party content (YouTube videos, Google Maps embeds, Wikisource texts, Stith Thompson Motif-Index data) is used under their respective licenses and terms.

8. USER-GENERATED CONTENT

You retain ownership of original content you create on the Platform (stories, reflections, chat messages). By creating content on the Platform, you grant us a limited, non-exclusive license to store, display, and process your content as necessary to provide the service. See the User Content & Story Forge License for full terms.

9. AI-POWERED FEATURES

The Platform uses artificial intelligence (Anthropic Claude, OpenAI) to power Atlas chat, Story Forge narrative generation, journey synthesis, and other features. AI-generated content is provided for educational and entertainment purposes only. See the AI Usage Disclaimer for important limitations.

10. PRIVACY

Your use of the Platform is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information.

11. DISCLAIMER OF WARRANTIES

THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. ALL CONTENT — INCLUDING MYTHOLOGICAL, PSYCHOLOGICAL, ASTROLOGICAL, AND SPIRITUAL MATERIAL — IS FOR EDUCATIONAL AND ENTERTAINMENT PURPOSES ONLY.

12. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, MYTHOUSE / METEOR STEEL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR DATA, ARISING FROM YOUR USE OF THE PLATFORM. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.

13. INDEMNIFICATION

You agree to indemnify and hold harmless Mythouse / Meteor Steel, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform, your violation of these Terms, or your violation of any rights of a third party.

14. MODIFICATIONS

We may modify these Terms at any time by posting updated Terms on the Platform. Your continued use after such changes constitutes acceptance. Material changes will be communicated via email or Platform notification.

15. TERMINATION

We may suspend or terminate your account at any time for violation of these Terms, with or without notice. Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination (including intellectual property, limitation of liability, and indemnification) shall survive.

16. GOVERNING LAW

These Terms shall be governed by the laws of the State of [STATE], without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts of [STATE/COUNTY].

17. SEVERABILITY

If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.

18. ENTIRE AGREEMENT

These Terms, together with the Privacy Policy, Subscription & Purchase Agreement, and other documents referenced herein, constitute the entire agreement between you and Mythouse / Meteor Steel regarding the Platform.

19. CONTACT

Questions about these Terms may be directed to: [CONTACT EMAIL]
`,

  'privacy-policy': `
MYTHOUSE — PRIVACY POLICY

Last Updated: [DATE]

This Privacy Policy describes how Mythouse / Meteor Steel ("we," "us," "our") collects, uses, stores, and shares your information when you use the Mythouse platform.

1. INFORMATION WE COLLECT

1.1 Account Information
- Email address and display name (provided via Google authentication through Firebase Auth)
- Profile photo (optional, uploaded by you)
- User handle (chosen by you)

1.2 Personal Profile Data
- Birth date and birth time (optional, for natal chart computation)
- Birth location (optional, for rising sign and house placements)
- Full name (optional, for numerological profile)
- Lucky number (optional)

1.3 Usage and Activity Data
- Pages visited and time spent (coursework tracking)
- Course progress and completion status
- Game starts, completions, and scores
- Journey participation and progress
- Element interaction tracking (clicks, selections, tab views)

1.4 AI Interaction Data
- Atlas chat conversation history
- Story Forge drafts and assembled narratives
- Guild application chat transcripts
- Journey synthesis and story interview interactions
- Tarot reading requests and interpretations

1.5 User-Generated Content
- Personal stories and reflections (Writings)
- Story Forge creative writing
- Guild member bios and application materials
- Consulting profiles

1.6 Financial and Subscription Data
- Subscription status and purchase history (stored in Firestore)
- We do not store credit card numbers or payment instrument details directly

1.7 API Keys (BYOK Users)
- Anthropic and OpenAI API keys (stored in a Firestore document with owner-only read access, separate from your profile)

1.8 Technical Data
- IP address (for rate limiting only; not stored long-term)
- Browser and device information (standard HTTP headers)
- localStorage data (last visited page path and timestamp)

2. HOW WE USE YOUR INFORMATION

We use collected information to:
- Provide and maintain the Platform and its features
- Compute natal charts and numerological profiles
- Power AI features (Atlas chat, Story Forge, journey synthesis)
- Track coursework progress and award credentials
- Facilitate the guild program (applications, pairings, directory listings)
- Enable multiplayer game functionality
- Improve the Platform based on usage patterns
- Communicate about your account or Platform changes
- Enforce our Terms of Service

3. AI DATA PROCESSING

When you interact with Atlas or other AI features:
- Your messages are sent to Anthropic (Claude) or OpenAI APIs for processing
- Area-specific knowledge from the Platform is included as context (not your personal data beyond the conversation)
- Conversations are stored in your Firestore profile for continuity
- AI providers process your messages under their own privacy policies
- If you use BYOK (Bring Your Own Key), your messages are sent using your own API key, and billing occurs under your account with the respective provider

4. DATA STORAGE AND SECURITY

- All data is stored in Google Firebase / Firestore
- Authentication is handled by Firebase Auth (Google sign-in)
- The Platform is hosted on Vercel
- BYOK API keys are stored in a separate Firestore document with owner-only security rules
- We use HTTPS for all data transmission
- We do not sell your personal data to third parties

5. THIRD-PARTY SERVICES

The Platform integrates with the following third-party services, each with their own privacy practices:
- Google Firebase (authentication, database, storage) — Google Privacy Policy applies
- Anthropic Claude API (AI processing) — Anthropic Privacy Policy applies
- OpenAI API (narrative generation) — OpenAI Privacy Policy applies
- Vercel (hosting, serverless functions) — Vercel Privacy Policy applies
- YouTube (embedded video playlists) — Google/YouTube Privacy Policy applies
- Google Maps / Street View (Mythic Earth, Sacred Sites 360) — Google Privacy Policy applies

6. DATA SHARING

We do not sell your personal data. We may share data:
- With third-party service providers as described above, solely to provide Platform functionality
- With guild member-student pairings: limited profile information is shared between paired guild members and students
- If required by law, regulation, or legal process
- To protect the rights, safety, or property of Mythouse, our users, or the public

7. YOUR RIGHTS AND CHOICES

You may:
- Access your profile data at any time via the Profile page
- Update or correct your personal information
- Delete your natal chart, numerology name, lucky number, or profile photo
- Export your conversation history and writings
- Request complete account deletion by contacting us
- Opt out of specific data collection by not providing optional information

For users in the European Economic Area (EEA), you have additional rights under GDPR including the right to data portability, the right to restrict processing, and the right to lodge a complaint with a supervisory authority.

For California residents, the CCPA provides the right to know what personal information is collected, the right to delete, and the right to opt out of the sale of personal information. We do not sell personal information.

8. DATA RETENTION

- Account data is retained as long as your account is active
- Coursework progress is retained for credential verification
- AI conversations may be retained for continuity unless you clear them
- Upon account deletion, we will remove your personal data within 30 days, except where retention is required by law
- Backup copies may persist for up to 90 days after deletion

9. CHILDREN'S PRIVACY

The Platform is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected such information, we will take steps to delete it promptly.

10. COOKIES AND LOCAL STORAGE

We use localStorage (not cookies) to:
- Remember your last visited page for session continuity (path + timestamp, expires after 4 hours)
- No advertising cookies or third-party tracking cookies are used
- YouTube and Google Maps embeds may set their own cookies per their policies

11. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. Material changes will be communicated via email or Platform notification. Your continued use of the Platform after changes constitutes acceptance.

12. CONTACT

For privacy inquiries or data requests, contact: [CONTACT EMAIL]
`,

  'guild-member-agreement': `
MYTHOUSE — GUILD MEMBER AGREEMENT

Last Updated: [DATE]

This Guild Member Agreement ("Agreement") is between Mythouse / Meteor Steel ("the Platform," "we," "us") and you ("Guild Member"), an approved guild member on the Mythouse platform.

By activating your guild member status, you agree to the following terms.

1. QUALIFICATION AND ELIGIBILITY

1.1 You have earned at least one Level 2 credential in a recognized Mythouse credential category (Scholar, Storyteller, Healer, Media Voice, or Adventurer).

1.2 You have completed the required guild coursework.

1.3 Your guild application has been reviewed and approved by the Platform administrator.

1.4 You understand that guild member status is a privilege, not a right, and may be revoked for cause.

2. GUILD MEMBER ROLES AND RESPONSIBILITIES

2.1 You may serve as a guild member in the categories for which you hold qualifying credentials:
- Mythologist (Scholar track)
- Storyteller (Storyteller track)
- Healer (Healer track)
- Media Voice (Media Voice track)
- Adventurer (Adventurer track)

2.2 You agree to:
- Respond to student pairing requests in a timely manner (accept or decline)
- Maintain your stated capacity for active students (default: 5)
- Provide guidance within your areas of qualification
- Respect the boundaries of the guild member-student relationship
- Keep your bio and directory listing accurate and up to date

2.3 You agree NOT to:
- Represent yourself as a licensed professional (therapist, doctor, lawyer, financial advisor) unless you hold such licensure separately and disclose it clearly
- Provide medical, psychological, legal, or financial advice
- Engage in romantic or sexual relationships with students you guide on the Platform
- Share student personal information with third parties
- Use the guild member relationship for personal financial gain outside the Platform's consulting framework

3. STUDENT RELATIONSHIPS

3.1 Guild member-student pairings are facilitated through the Platform. Either party may end a pairing at any time.

3.2 You acknowledge that students may range in age (13+) and experience. You will adapt your guidance appropriately.

3.3 Communications with students should remain professional, supportive, and within the scope of mythological, creative, and cultural exploration.

4. CONSULTING SERVICES

4.1 If you choose to offer paid consulting sessions, these are governed by the separate Consulting Services Agreement.

4.2 You set your own consulting rates and availability. The Platform facilitates discovery and scheduling but does not set rates or guarantee bookings.

4.3 You are an independent contractor, not an employee of Mythouse / Meteor Steel.

5. DIRECTORY LISTING

5.1 By publishing to the Guild Directory, you consent to making your guild member bio, credential categories, and capacity visible to all Platform users.

5.2 You may unpublish from the Directory at any time, which removes your listing but does not end active pairings.

6. GUILD PARTICIPATION

6.1 As an active guild member, you have access to the Guild — a community space for guild members to discuss practices, share insights, and collaborate.

6.2 Guild interactions are subject to the Community Guidelines.

7. CONTENT AND INTELLECTUAL PROPERTY

7.1 Content you create as a guild member (guidance, resources, written materials) remains your intellectual property.

7.2 You grant the Platform a non-exclusive license to display your guild member bio and directory information as part of the service.

7.3 You will not reproduce or redistribute proprietary Platform content (synthesis essays, system prompts, course materials, game data) outside the Platform.

8. TERMINATION

8.1 You may resign your guild member status at any time by unpublishing and ending all active pairings.

8.2 We may revoke your guild member status for:
- Violation of this Agreement or the Terms of Service
- Sustained complaints from students
- Misrepresentation of qualifications
- Conduct detrimental to the Platform community
- Inactivity exceeding 12 months without communication

8.3 Upon termination, active pairings will be ended, your directory listing will be removed, and Guild access will be revoked.

9. LIABILITY AND INDEMNIFICATION

9.1 You acknowledge that guild membership involves interpersonal guidance in subjective fields (mythology, storytelling, spiritual exploration) and that outcomes are not guaranteed.

9.2 THE PLATFORM IS NOT LIABLE FOR ANY ACTIONS, ADVICE, OR CONDUCT OF GUILD MEMBERS. GUILD MEMBERS ACT AS INDEPENDENT INDIVIDUALS.

9.3 You agree to indemnify the Platform against claims arising from your guild member activities.

10. ACKNOWLEDGMENT

By activating your guild member status, you confirm that you have read, understood, and agree to this Guild Member Agreement.
`,

  'subscription-agreement': `
MYTHOUSE — SUBSCRIPTION & PURCHASE AGREEMENT

Last Updated: [DATE]

This Agreement governs all paid features, subscriptions, and purchases on the Mythouse platform.

1. AVAILABLE SUBSCRIPTIONS AND FEATURES

The Platform offers tiered access through subscriptions and one-time purchases. Available tiers include:

1.1 Free Access
- Monomyth / Meteor Steel (hero's journey content)
- Basic Atlas AI chat
- Board games
- Journeys and Yellow Brick Road
- Profile and coursework tracking

1.2 Chronosphaera Subscriptions
- Active Buttons: Interactive Chronosphaera features
- Clock Buttons: Clock and time-cycle features
- Body Buttons: Embodied correspondences
- Atlas Enhanced: Extended Atlas AI capabilities

1.3 Content Subscriptions
- Monomyth + Meteor Steel (extended depth psychology, theorists, models)
- Fallen Starlight + Story of Stories (original literary works)
- Medicine Wheels (medicine wheel teachings and content)
- Mythosphaera (documentary synthesis, motif index, tarot decks)

1.4 Coursework
- Coursework activation (progress tracking and credential earning)

Note: Specific features, pricing, and tier composition may change over time. Current offerings are displayed on the Platform.

2. PAYMENT

2.1 Subscription fees are billed at the frequency stated at the time of purchase (monthly or annually).

2.2 One-time purchases grant permanent access to the specified content area.

2.3 All prices are stated in US dollars unless otherwise noted.

2.4 Payment processing is handled by our payment provider. We do not store credit card numbers or payment instrument details on our servers.

3. FREE TRIALS

3.1 If a free trial is offered, you will not be charged during the trial period.

3.2 Unless you cancel before the trial ends, your subscription will automatically begin at the stated price.

4. CANCELLATION AND REFUNDS

4.1 You may cancel any subscription at any time through your profile or by contacting us.

4.2 Upon cancellation, you retain access through the end of your current billing period.

4.3 Refund requests for subscriptions may be made within 14 days of the initial charge. Refunds are issued at our discretion and will be prorated based on usage.

4.4 One-time purchases are non-refundable after 14 days or after substantial use of the purchased content.

5. CHANGES TO PRICING

5.1 We may change subscription pricing with 30 days' notice. Existing subscribers will be notified before the new rate takes effect.

5.2 Price changes do not apply retroactively to current billing periods.

6. ACCESS AND AVAILABILITY

6.1 We strive to maintain continuous access to all paid features but do not guarantee uninterrupted availability.

6.2 Scheduled maintenance will be communicated in advance when possible.

6.3 We are not liable for temporary unavailability due to technical issues, third-party service outages, or force majeure.

7. BYOK (BRING YOUR OWN KEY)

7.1 Users who provide their own Anthropic or OpenAI API keys ("BYOK") may access enhanced AI features. BYOK usage is governed by the separate BYOK Agreement.

7.2 BYOK is separate from and in addition to Platform subscriptions. Having a BYOK key does not substitute for a required subscription.

8. TERMINATION

8.1 If your account is terminated for violation of the Terms of Service, access to paid features ceases immediately. No refund is provided for termination due to Terms violations.

8.2 If we discontinue a paid feature, we will provide notice and prorated refunds for any remaining subscription period.

9. CONTACT

For billing inquiries or refund requests, contact: [CONTACT EMAIL]
`,

  'byok-agreement': `
MYTHOUSE — BRING YOUR OWN KEY (BYOK) AGREEMENT

Last Updated: [DATE]

This Agreement governs the use of personal API keys on the Mythouse platform.

1. WHAT IS BYOK?

BYOK (Bring Your Own Key) allows you to provide your own Anthropic or OpenAI API key to access enhanced AI features on the Platform. When you use BYOK, AI requests are billed directly to your account with the respective provider, not to Mythouse.

2. KEY STORAGE

2.1 Your API keys are stored in a dedicated Firestore document with owner-only read access, separate from your general profile data.

2.2 Keys are transmitted over HTTPS and stored in Firestore's encrypted-at-rest infrastructure.

2.3 Your keys are never exposed to other users, displayed in logs, or shared with any party other than the respective AI provider during API calls.

3. KEY USAGE

3.1 Your API keys are used exclusively for the following Platform features:
- Atlas AI chat (Anthropic Claude)
- Story Forge narrative generation (OpenAI)
- Story Forge draft and assembly (Anthropic Claude, when BYOK Anthropic key is present)
- Other AI features as they become available

3.2 Your keys are never used for:
- Other users' requests
- Platform analytics or testing
- Any purpose outside the scope of your Platform interactions

4. BILLING RESPONSIBILITY

4.1 When using BYOK, all API usage costs are billed by the respective provider (Anthropic or OpenAI) directly to your account with that provider.

4.2 Mythouse is not responsible for charges incurred on your API accounts.

4.3 You are responsible for monitoring your own API usage and spending limits.

4.4 The Platform does not currently display API usage metrics. You should monitor usage through your Anthropic or OpenAI dashboard.

5. ENHANCED FEATURES

5.1 BYOK users may access enhanced AI features, including:
- Higher-quality model access (e.g., Claude Sonnet for Story Forge drafts instead of Claude Haiku)
- Extended output lengths
- Additional AI-powered tools as they become available

5.2 The specific enhancements available to BYOK users may change over time.

6. KEY MANAGEMENT

6.1 You may add, update, or remove your API keys at any time through your Profile page.

6.2 When you remove a key, it is deleted from Firestore immediately.

6.3 We recommend rotating your API keys periodically as a security best practice.

6.4 If you suspect your key has been compromised, revoke it immediately through the respective provider's dashboard and update or remove it from the Platform.

7. DISCLAIMERS

7.1 Mythouse is not responsible for:
- Charges incurred on your API accounts
- Service interruptions from Anthropic or OpenAI
- Changes to API pricing by the respective providers
- Data processing by Anthropic or OpenAI under their respective terms

7.2 Your use of BYOK is subject to the terms of service of the respective AI provider.

8. TERMINATION

8.1 You may stop using BYOK at any time by removing your keys.

8.2 If your Platform account is terminated, your stored API keys will be deleted.
`,

  'consulting-agreement': `
MYTHOUSE — CONSULTING SERVICES AGREEMENT

Last Updated: [DATE]

This Agreement governs paid consulting sessions facilitated through the Mythouse platform, involving Guild Members, Clients, and the Platform.

1. PARTIES

- "Platform" refers to Mythouse / Meteor Steel
- "Guild Member" refers to an approved Mythouse guild member offering consulting services
- "Client" refers to a Platform user booking a consulting session

2. NATURE OF SERVICES

2.1 Consulting sessions are conversations between a Guild Member and Client on topics within the Guild Member's qualified credential categories (mythology, storytelling, healing arts, media/communication, adventure/exploration).

2.2 Consulting sessions are NOT:
- Licensed therapy, counseling, or psychological treatment
- Medical, legal, or financial advice
- Guaranteed to produce specific outcomes
- An employment or agency relationship between Guild Member and Client

3. INDEPENDENT CONTRACTOR STATUS

3.1 Guild Members are independent contractors, not employees, agents, or representatives of Mythouse / Meteor Steel.

3.2 The Platform facilitates discovery, scheduling, and payment processing. The Platform does not control the content, methods, or outcomes of consulting sessions.

4. SCHEDULING AND SESSIONS

4.1 Sessions are arranged through the Platform's consulting interface.

4.2 Both parties should honor scheduled session times. Cancellations should be made with reasonable advance notice (at least 24 hours).

4.3 If a Guild Member fails to appear for a scheduled session without notice, the Client is entitled to a full refund.

4.4 If a Client fails to appear without notice, the Guild Member may charge the full session fee.

5. FEES AND PAYMENT

5.1 Guild Members set their own consulting rates, which are displayed on their consulting profile.

5.2 The Platform may charge a service fee on each transaction.

5.3 Payment is processed through the Platform. Guild Members receive their portion according to the Platform's payout schedule.

5.4 Specific fee structures, platform percentages, and payout terms will be communicated separately and may be updated with notice.

6. CONFIDENTIALITY

6.1 Both Guild Members and Clients agree to treat session content as confidential.

6.2 Neither party may record sessions without the other's explicit consent.

6.3 Guild Members may not share Client personal information with third parties.

6.4 Exceptions to confidentiality include situations involving:
- Imminent risk of harm to self or others
- Legal requirements (court orders, subpoenas)
- With explicit written consent of the other party

7. DISPUTES

7.1 Disputes between Guild Members and Clients should first be addressed directly between the parties.

7.2 If direct resolution fails, either party may contact the Platform for mediation.

7.3 The Platform may, at its discretion:
- Issue refunds to Clients
- Suspend or revoke Guild Member consulting privileges
- Remove either party's access to the consulting system

7.4 The Platform's decision in disputes is final.

8. LIABILITY

8.1 THE PLATFORM IS NOT LIABLE FOR THE QUALITY, ACCURACY, OR OUTCOMES OF CONSULTING SESSIONS.

8.2 Guild Members are solely responsible for the content and quality of their consulting services.

8.3 Clients participate in consulting sessions at their own discretion and risk.

8.4 Both parties agree to indemnify the Platform against claims arising from consulting sessions.

9. TERMINATION

9.1 Either the Guild Member or Client may decline future sessions at any time.

9.2 The Platform may suspend consulting features for either party for violation of this Agreement, the Terms of Service, or the Guild Member Agreement.
`,

  'story-forge-content': `
MYTHOUSE — USER CONTENT & STORY FORGE LICENSE

Last Updated: [DATE]

This Agreement governs the ownership and licensing of content you create on the Mythouse platform.

1. YOUR CONTENT

"Your Content" includes:
- Personal stories and reflections saved in the Writings system
- Story Forge drafts, assembled narratives, and creative writing
- Atlas chat conversation messages you compose
- Guild application materials and bios
- Profile information and descriptions
- Any other original material you create on the Platform

2. OWNERSHIP

2.1 You retain full ownership of all original content you create on the Platform. Mythouse does not claim ownership of Your Content.

2.2 The ideas, stories, characters, and creative elements in Your Content belong to you.

3. LICENSE TO MYTHOUSE

3.1 By creating content on the Platform, you grant Mythouse a limited, non-exclusive, royalty-free license to:
- Store Your Content on our servers (Firebase/Firestore)
- Display Your Content back to you within the Platform interface
- Process Your Content through AI services (Anthropic, OpenAI) to provide Platform features such as Atlas chat context, Story Forge generation, and journey synthesis
- Include Your Content in anonymized, aggregated analytics (e.g., total word counts, usage statistics — never individual content)

3.2 This license is solely for the purpose of providing and improving Platform services. We will not:
- Publish Your Content publicly without your consent
- Sell Your Content to third parties
- Use Your Content to train AI models (note: third-party AI providers may have their own data usage policies)
- Share Your Content with other users without your explicit action (e.g., publishing to the Guild Directory)

4. AI-GENERATED CONTENT

4.1 When the Platform generates content using AI (Atlas responses, Story Forge narratives, journey synthesis), that content is created collaboratively between you (through your inputs) and the AI.

4.2 You may use AI-generated content from the Platform for any personal or commercial purpose, subject to the following:
- AI-generated content may not be perfectly accurate, original, or suitable for all purposes
- You are responsible for reviewing and editing AI-generated content before use
- Attribution to the specific AI model (Claude, GPT-4o-mini) is recommended but not required
- AI-generated content should not be represented as entirely human-authored if accuracy of attribution matters in your context

4.3 Mythouse does not claim ownership of AI-generated content produced in response to your inputs.

5. STORY FORGE SPECIFIC TERMS

5.1 The Story Forge assists you in structuring and generating narrative content using the monomyth framework.

5.2 Your Story Forge notes, entries, and reflections are Your Content and belong to you.

5.3 The assembled narratives produced by the Story Forge AI are collaborative works. You own and may use them freely.

5.4 The Story Forge templates, stage structures, and generation prompts are Mythouse intellectual property and may not be extracted or reproduced.

6. DATA PORTABILITY

6.1 You may export your content at any time. The Platform provides access to your:
- Atlas conversation history
- Story Forge drafts and assembled texts
- Personal writings and reflections

6.2 Upon account deletion, we will remove Your Content from active storage within 30 days.

7. CONTENT REMOVAL

7.1 You may delete Your Content at any time through the Platform interface.

7.2 We may remove content that violates the Terms of Service or Community Guidelines.

7.3 Deleted content may persist in backups for up to 90 days.

8. NO OBLIGATION

8.1 We are not obligated to store Your Content indefinitely. While we intend to maintain reliable storage, we recommend keeping your own copies of important creative work.

8.2 We are not liable for data loss due to technical failures, though we will make reasonable efforts to maintain data integrity.
`,

  // ═══════════════════════════════════════════════════
  // POLICIES & DISCLAIMERS
  // ═══════════════════════════════════════════════════

  'ai-disclaimer': `
MYTHOUSE — AI USAGE DISCLAIMER

Last Updated: [DATE]

The Mythouse platform uses artificial intelligence to power several features. This disclaimer explains the nature and limitations of AI-powered content.

1. AI FEATURES ON THE PLATFORM

The following features are powered by AI:
- Atlas: An AI companion providing conversational guidance on mythology, storytelling, depth psychology, and the Platform's content areas (powered by Anthropic Claude)
- Story Forge: AI-assisted narrative generation and story structuring (powered by OpenAI and Anthropic Claude)
- Journey Synthesis: AI-generated thematic summaries of journey experiences (powered by Anthropic Claude)
- Story Interview: AI-guided reflective storytelling (powered by Anthropic Claude)
- Tarot Reading: AI-interpreted tarot card readings within a mythological framework (powered by Anthropic Claude)
- Profile Onboarding: AI-guided initial profile setup (powered by Anthropic Claude)
- Guild Application: AI-facilitated guild application process (powered by Anthropic Claude)

2. NOT PROFESSIONAL ADVICE

AI-generated content on the Platform is NOT:
- Licensed therapy, counseling, or psychological treatment
- Medical diagnosis or health advice
- Legal advice or representation
- Financial planning or investment advice
- A substitute for professional services in any regulated field

Atlas and other AI features provide educational, cultural, and creative content within the domain of mythology, storytelling, and cultural exploration.

3. NATAL CHART AND ASTROLOGY

The Platform computes natal charts using astronomical calculation (the astronomy-engine library for precise ecliptic longitude computation). While astronomically accurate, astrological interpretations are:
- Part of a cultural and historical tradition, not empirical science
- Provided for educational and self-reflective purposes
- Not predictive of future events
- Not a basis for important life decisions

4. NUMEROLOGY AND TAROT

Numerological profiles and tarot readings on the Platform:
- Draw from Pythagorean numerology traditions and historical tarot symbolism
- Are presented as cultural exploration and self-reflection tools
- Are not predictive or diagnostic
- Should be engaged with in a spirit of curiosity, not dependency

5. AI LIMITATIONS

AI-generated content may:
- Contain factual inaccuracies, especially about historical events, dates, or figures
- Reflect biases present in training data
- Produce inconsistent or contradictory information across sessions
- Generate content that sounds authoritative but is incorrect ("hallucinations")
- Not have access to the most current information

6. YOUR RESPONSIBILITY

You are responsible for:
- Evaluating AI-generated content critically
- Seeking qualified professionals for medical, psychological, legal, or financial matters
- Not relying solely on AI-generated content for important decisions
- Supervising minors' interactions with AI features

7. DEPTH PSYCHOLOGY CONTENT

The Platform draws heavily on the traditions of depth psychology (Jung, Campbell, Hillman, von Franz, and others). This content:
- Is presented as educational interpretation of these traditions
- Is not clinical psychology or psychotherapy
- May involve archetypal, symbolic, and mythological frameworks that some find deeply meaningful and others find unsuitable
- Should be engaged with according to your own comfort level and mental health needs

If you are experiencing psychological distress, please contact a licensed mental health professional or crisis service.
`,

  'content-disclaimer': `
MYTHOUSE — EDUCATIONAL CONTENT DISCLAIMER

Last Updated: [DATE]

The Mythouse platform presents mythological, cultural, psychological, and spiritual content for educational and creative purposes. This disclaimer clarifies the nature of that content.

1. MYTHOLOGICAL AND CULTURAL CONTENT

1.1 The Platform presents myths, legends, religious narratives, and cultural traditions from around the world. This content is presented for educational and comparative study, not as religious instruction, endorsement, or criticism of any tradition.

1.2 Interpretations of myths and cultural material reflect the perspectives of specific scholars, traditions, or the Platform's creators. They are not definitive or universally accepted readings.

1.3 Content areas include:
- Monomyth / Hero's Journey (Campbell, Vogler, and others)
- Seven Metals / Celestial Clocks (planetary symbolism, alchemy, astrology, Hebrew creation theology, medicine wheels)
- Mythology Channel / Mythosphaera (documentary interview synthesis from "Myths: The Greatest Mysteries of Humanity")
- Fallen Starlight (original literary work)
- Mythic Earth (sacred sites, literary locations, cultural geography)
- Stith Thompson Motif-Index (folk-literature classification)

2. DOCUMENTARY CONTENT

2.1 The Myths series synthesis essays represent the interview perspectives of Will Linn as a mythologist and are editorial interpretations, not peer-reviewed academic publications.

2.2 The interview transcripts and synthesis essays are primary source material from a television documentary production and reflect the perspective of the interviewee at the time of recording.

3. DEPTH PSYCHOLOGY

3.1 The Platform draws on the work of Carl Jung, Joseph Campbell, James Hillman, Marie-Louise von Franz, and other depth psychologists. This content is presented as cultural and intellectual history, not clinical methodology.

3.2 Concepts like archetypes, the shadow, anima/animus, and individuation are presented as frameworks for self-reflection and storytelling, not diagnostic categories.

4. GAME CONTENT

4.1 The Platform's board games (Senet, Pachisi, Royal Game of Ur, Mehen, Snakes & Ladders, Mythouse) draw on historical and mythological sources. Game rules and interpretations are adaptations for educational play, not historically definitive reconstructions.

5. LIBRARY RECOMMENDATIONS

5.1 The Myth Salon Library is a curated reading list. Inclusion of a book does not constitute endorsement of all its content or claims.

5.2 Some recommended works may contain outdated, culturally insensitive, or contested perspectives. They are included for their historical significance in the fields of mythology and depth psychology.

6. NO GUARANTEE OF ACCURACY

6.1 While we strive for accuracy, mythological and cultural content is inherently interpretive. Scholarly consensus evolves, and multiple valid interpretations may exist.

6.2 The Platform should be used as a starting point for exploration, not a definitive reference. We encourage users to pursue additional sources and form their own conclusions.
`,

  'copyright-notice': `
MYTHOUSE — COPYRIGHT & ATTRIBUTION NOTICE

Last Updated: [DATE]

1. MYTHOUSE ORIGINAL CONTENT

Copyright (c) [YEAR] Mythouse / Meteor Steel. All rights reserved.

The following are original works of Mythouse / Meteor Steel, protected by copyright:
- Platform design, visual identity, and user interface
- Atlas AI system prompt, personality, and knowledge architecture
- Monomyth / Meteor Steel editorial content (stage overviews, synthesis essays, figure analyses)
- Seven Metals / Celestial Clocks data structures and correspondences
- Myths series synthesis essays (synthesized from Will Linn interviews)
- Fallen Starlight (original literary work)
- Story of Stories (original book proposal)
- Coursework system, course definitions, and credential framework
- Journey definitions and configurations
- Game adaptations and Mythouse card game
- Yellow Brick Road challenge system
- All original data files (JSON, JS) created for the Platform

2. WILL LINN INTERVIEW CONTENT

Interview transcripts and documentary contributions from Will Linn for "Myths: The Greatest Mysteries of Humanity" are used with the rights holder's authorization. Synthesis essays derived from these interviews are original Mythouse works.

3. THIRD-PARTY CONTENT — OPEN SOURCE & PUBLIC DOMAIN

3.1 Stith Thompson Motif-Index of Folk-Literature
- Data source: fbkarsdorp/tmi (GitHub)
- License: Apache License 2.0
- Citation: Thompson, Stith. Motif-Index of Folk-Literature. Indiana University Press, 1955-1958.

3.2 Wikisource Sacred Texts
- Texts accessed via the Wikisource API are in the public domain
- Retrieved and displayed under Wikisource's terms of use

3.3 astronomy-engine
- Used for natal chart computation
- License: MIT License
- Author: Don Cross

4. THIRD-PARTY SERVICES — EMBEDDED CONTENT

4.1 YouTube
- Video playlists are embedded using the YouTube IFrame API
- All video content remains the property of the respective copyright holders
- Embedded under YouTube's Terms of Service

4.2 Google Maps / Street View
- Maps and Street View imagery are provided by Google
- Used under the Google Maps Platform Terms of Service
- Google's copyright and attribution apply to all map imagery

5. THIRD-PARTY SERVICES — API PROVIDERS

5.1 Anthropic Claude
- AI responses are generated by Anthropic's Claude models
- Anthropic's terms of service and usage policies apply to API interactions

5.2 OpenAI
- Narrative generation uses OpenAI's models
- OpenAI's terms of service and usage policies apply to API interactions

6. FAIR USE

Certain Platform content may include brief quotations, references, or citations from published works for purposes of education, commentary, and scholarship, which we believe constitutes fair use under copyright law.

7. REPORTING COPYRIGHT CONCERNS

If you believe any content on the Platform infringes your copyright, please contact us at [CONTACT EMAIL] with:
- Identification of the copyrighted work
- Identification of the infringing material and its location on the Platform
- Your contact information
- A statement of good faith belief that the use is not authorized
- A statement under penalty of perjury that the information is accurate and you are authorized to act on behalf of the copyright owner
`,

  'community-guidelines': `
MYTHOUSE — COMMUNITY GUIDELINES

Last Updated: [DATE]

The Mythouse is a space for mythic exploration, creative growth, and meaningful connection. These guidelines ensure that all community interactions remain respectful, productive, and safe.

1. GENERAL PRINCIPLES

1.1 Treat all community members with respect and dignity.

1.2 Engage with curiosity and openness. The Mythouse brings together diverse perspectives on mythology, spirituality, psychology, and culture. Disagreement is welcome; disrespect is not.

1.3 Remember that users range in age (13+), experience, and cultural background.

2. MULTIPLAYER GAMES

2.1 Board games on the Platform are mythic experiences, not competitive arenas. Play with sportsmanship and good humor.

2.2 Do not exploit bugs, use unauthorized tools, or manipulate game states.

2.3 If playing against another user in real-time, be respectful in any communications.

3. GUILD MEMBER-STUDENT INTERACTIONS

3.1 Guild Members should provide guidance that is supportive, within scope, and appropriate to the student's level and age.

3.2 Students should communicate respectfully with their Guild Members and honor scheduled commitments.

3.3 Both parties should maintain professional boundaries. The Guild Member-student relationship exists within the context of mythological, creative, and cultural exploration.

3.4 If either party feels uncomfortable, they may end the pairing at any time without explanation.

4. GUILD CONDUCT

4.1 The Guild is a space for guild members to discuss practices, share insights, and support each other's growth.

4.2 Guild discussions should remain constructive, collegial, and focused on the shared mission of mythic education.

4.3 Disagreements about interpretation or methodology should be engaged with intellectual humility.

4.4 Do not share student personal information in Guild discussions.

5. PROHIBITED BEHAVIOR

The following are prohibited across all Platform interactions:

5.1 Harassment, bullying, intimidation, or threats directed at any user.

5.2 Hate speech, discrimination, or content targeting individuals or groups based on race, ethnicity, gender, sexual orientation, religion, disability, or other protected characteristics.

5.3 Sharing sexually explicit, violent, or gratuitously offensive content.

5.4 Doxxing or sharing another user's personal information without consent.

5.5 Spam, commercial solicitation, or advertising unrelated to Platform activities.

5.6 Impersonation of other users, guild members, or Platform administrators.

5.7 Deliberately providing harmful advice, especially regarding mental health, physical health, or safety.

6. AI INTERACTION GUIDELINES

6.1 Do not attempt to manipulate Atlas or other AI features to produce harmful, illegal, or abusive content.

6.2 Do not use AI features to generate content that harasses, threatens, or targets other individuals.

7. REPORTING

7.1 If you experience or witness behavior that violates these guidelines, please report it to [CONTACT EMAIL].

7.2 Reports will be reviewed promptly and confidentially.

8. ENFORCEMENT

8.1 Violations may result in:
- A warning from the Platform administrator
- Temporary suspension of specific features (chat, multiplayer, consulting)
- Removal from the Guild Directory or Guild
- Permanent account termination

8.2 Enforcement decisions are made by the Platform administrator and are final.

8.3 Egregious violations (threats, illegal activity, exploitation of minors) may be reported to appropriate authorities.
`,

  'data-retention': `
MYTHOUSE — DATA RETENTION & DELETION POLICY

Last Updated: [DATE]

This policy describes how long we retain user data and how you can request deletion.

1. ACTIVE ACCOUNT DATA

While your account is active, the following data is retained:

1.1 Profile Data (retained indefinitely while account is active)
- Email, display name, handle, profile photo
- Birth date, birth time, birth location
- Numerology name, lucky number
- Natal chart data
- Subscription and purchase records

1.2 Activity Data (retained indefinitely while account is active)
- Coursework progress and element tracking
- Game completion records
- Journey participation records

1.3 Content Data (retained indefinitely while account is active)
- Atlas conversation history
- Story Forge drafts and assembled narratives
- Personal stories and writings
- Guild application materials

1.4 BYOK API Keys (retained until you remove them)
- Stored in separate owner-only Firestore document
- Deleted immediately upon removal

2. AUTOMATIC EXPIRATION

2.1 Session persistence data in localStorage (last visited page) expires after 4 hours.

2.2 Rate limiting data (IP-based) is held in server memory only and is not persisted. It expires when the serverless function cold-starts.

2.3 Server-side area knowledge caches are in-memory only and expire on serverless function cold-start.

3. ACCOUNT DELETION

3.1 You may request account deletion by contacting [CONTACT EMAIL].

3.2 Upon receiving a verified deletion request, we will:
- Delete your profile data from Firestore within 30 days
- Delete your coursework progress and activity data
- Delete your AI conversation history and writings
- Delete your BYOK API keys
- Remove your Guild Directory listing (if applicable)
- End all active guild member-student pairings (if applicable)
- Remove your Guild access (if applicable)

3.3 The following may be retained after account deletion:
- Anonymized, aggregated analytics data (no personally identifiable information)
- Records required by law (e.g., transaction records for tax purposes)
- Backup copies, which are purged within 90 days

3.4 Deletion is permanent and cannot be undone. We recommend exporting any content you wish to keep before requesting deletion.

4. DATA PORTABILITY

4.1 You may access and export your data at any time:
- Profile data: visible on the Profile page
- Conversation history: accessible in the Atlas chat interface
- Writings: accessible in the Writings interface
- Coursework progress: visible on the Profile page

4.2 For a comprehensive data export, contact [CONTACT EMAIL].

5. THIRD-PARTY DATA RETENTION

5.1 Data processed by third-party services (Anthropic, OpenAI, Google/Firebase, Vercel) is subject to those providers' data retention policies.

5.2 AI conversation data sent to Anthropic and OpenAI for processing may be retained by those providers according to their API data usage policies. Anthropic's API does not use customer data for training by default. OpenAI's API data usage policy should be reviewed on their website.

6. GDPR AND CCPA COMPLIANCE

6.1 For EEA residents: You have the right to access, rectify, erase, restrict processing, and port your data under GDPR. To exercise these rights, contact [CONTACT EMAIL].

6.2 For California residents: Under CCPA, you have the right to know what personal information is collected, request deletion, and opt out of data sales. We do not sell personal information.

6.3 We will respond to verified data requests within 30 days.
`,

  'third-party-services': `
MYTHOUSE — THIRD-PARTY SERVICES NOTICE

Last Updated: [DATE]

The Mythouse platform integrates with several third-party services to provide its features. This notice describes those services, what data they process, and where to find their terms.

1. GOOGLE FIREBASE

Service: Authentication, Database (Firestore), Storage
Data Processed: User accounts, all Platform data, profile photos
Provider: Google Cloud / Firebase
Terms: https://firebase.google.com/terms
Privacy: https://policies.google.com/privacy

Firebase handles all user authentication (Google sign-in) and stores all Platform data including profiles, coursework progress, writings, and conversations.

2. ANTHROPIC (CLAUDE API)

Service: AI language model
Data Processed: User messages, area knowledge context, system prompts
Provider: Anthropic
Terms: https://www.anthropic.com/terms
Privacy: https://www.anthropic.com/privacy

Powers Atlas chat, journey synthesis, story interviews, guild applications, profile onboarding, tarot readings, and Yellow Brick Road challenges. Anthropic's API does not use customer inputs/outputs for model training by default.

3. OPENAI

Service: AI language model
Data Processed: Story Forge content, user writing, narrative generation prompts
Provider: OpenAI
Terms: https://openai.com/policies/terms-of-use
Privacy: https://openai.com/policies/privacy-policy

Powers Story Forge narrative generation and persona voices. OpenAI's API data usage policies should be reviewed on their website.

4. VERCEL

Service: Hosting, serverless functions, deployment
Data Processed: HTTP requests, server-side processing
Provider: Vercel Inc.
Terms: https://vercel.com/legal/terms
Privacy: https://vercel.com/legal/privacy-policy

Hosts the Platform website and all serverless API functions (chat, natal chart computation, sacred text retrieval).

5. YOUTUBE (GOOGLE)

Service: Video playback
Data Processed: Video viewing activity, standard YouTube tracking
Provider: Google / YouTube
Terms: https://www.youtube.com/t/terms
Privacy: https://policies.google.com/privacy

Documentary playlists and episode videos are embedded using the YouTube IFrame Player API. YouTube may set cookies and collect viewing data according to Google's privacy policy.

6. GOOGLE MAPS / STREET VIEW

Service: Map display, Street View imagery
Data Processed: Map interaction data
Provider: Google
Terms: https://cloud.google.com/maps-platform/terms
Privacy: https://policies.google.com/privacy

Used on the Mythic Earth page and Sacred Sites 360 for displaying sacred sites, literary locations, and 360-degree views. Google may collect interaction data according to their privacy policy.

7. WIKISOURCE (WIKIMEDIA)

Service: Sacred text content
Data Processed: Text retrieval requests (server-side only, no user data sent)
Provider: Wikimedia Foundation
Terms: https://wikimediafoundation.org/wiki/Terms_of_Use
Privacy: https://foundation.wikimedia.org/wiki/Privacy_policy

The Platform retrieves public domain texts from Wikisource for the Sacred Text Reader feature. Requests are made server-side; no user data is transmitted to Wikisource.

8. YOUR CHOICES

8.1 Using the Platform means your data will be processed by these services as described above. If you do not consent to this processing, please do not use the Platform.

8.2 For YouTube and Google Maps embeds, blocking third-party cookies in your browser may limit tracking but could also affect functionality.

8.3 BYOK users should review the API data policies of Anthropic and OpenAI, as their personal API keys are used for direct API calls.

9. CHANGES

Third-party services may change their terms and privacy practices. We will update this notice as we become aware of material changes affecting Platform users.
`,

};

export default LEGAL_DOCUMENTS;
