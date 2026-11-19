# MarketMate – Your AI Marketing Teammate

MarketMate is an AI-powered marketing assistant designed to help small businesses plan, create and organise their marketing campaigns.

Running a small business involves much more than creating and selling products. Marketing takes time, planning and creativity. MarketMate aims to make this process easier by bringing AI-powered marketing support into one place.

## Features

- **AI Campaign Planning:** Generate tailored marketing strategies based on your business, audience, goals and budget.
- **Multi-Channel Marketing:** Create channel-specific marketing content for Instagram, Facebook, Email, SMS, Google, Etsy and Pinterest.
- **AI Poster Design:** Generate and customise marketing posters using different visual styles and colour combinations.
- **Campaign Calendar:** Organise marketing activities and view campaign schedules.
- **Task Tracking:** Keep track of campaign activities and mark tasks as completed.
- **Campaign Management:** Save, edit and manage multiple campaigns.
- **Notes:** Add notes and checklists to individual campaigns.
- **User Accounts:** Sign in securely using Google or email and password.

## How It Works

1. Create an account and sign in.
2. Enter your business information and marketing goals.
3. Select your preferred marketing channels, campaign duration and budget.
4. Let the AI generate a tailored campaign.
5. Review and customise your marketing materials.
6. Organise your activities in the campaign calendar and track your progress.

## Technology Stack

| Technology | Purpose |
|---|---|
| Lovable | Frontend development |
| React / TypeScript | Application interface and functionality |
| Supabase | Authentication, database and backend functions |
| Google Gemini API | AI-powered campaign generation |
| Vercel | Application hosting |
| GitHub | Source code management |

## Project Architecture

MarketMate uses a frontend and backend architecture.

The user interacts with the application through the frontend. Campaign information is sent securely to a Supabase Edge Function, which communicates with the Google Gemini API. The generated campaign content is then returned to the application, where it is displayed and organised for the user.

## Live Application

Try MarketMate here:

**https://hey-marketmate.vercel.app/**

## Project Vision

The long-term vision for MarketMate is to become an AI marketing teammate for small businesses, helping entrepreneurs spend less time managing marketing and more time doing what they love.

Future possibilities include social media publishing, campaign performance analysis, deeper brand personalisation and more autonomous marketing workflows.

---

*MarketMate was developed as part of an agentic AI development assignment.*
