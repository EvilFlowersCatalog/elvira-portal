# Welcome to Elvira Portal! 📘 🏖

This delightful project is crafted with [React + Vite] version 18.2.0.
Sit back and relax, as the app automatically refreshes whenever you tweak any of the source files.

## Local Server

To fire up a local server, simply execute `npm run start`. Then, glide over to `http://localhost:5173/` in your browser to explore.
Feeling curious about the inner workings? Peek into the `.env.local` file for a glimpse.

## Build Process

Let's build some magic! ✨ Run `npm run build:key` to kickstart the build process. The key here represents the type of build.

### Build for Development

For a development version, invoke `npm run build:dev`. Curious minds can dive into the `.env.development` file to see how it shapes the environment.

### Build for Production

When it's time to go live, trigger `npm run build:prod` to prepare a polished production version. Peek into the `.env.production` file to see how we've tailored things for production.

### Environment Variables

Ah, the secret sauce behind the scenes! 🌟 Here's a quick rundown of our Elvira-specific environment variables:

- **_ELVIRA_BASE_URL_** - Where the FE (Frontend) fetches all its data from the server.
- **_ELVIRA_CATALOG_ID_** - The magical ID where all the data resides. Each catalog ID corresponds to a different department at the STU Faculty, housing its unique data.
- **ELVIRA_THEME** - The naming convention corresponds to each STU Faculty, leading you to their respective logo collections and uniqe colors.
- **ELVIRA_UMAMI_SERVER** - The url for server where you're handling analytics
- **ELVIRA_UMAMI_WEBSITE** - ID of website where those analytics should remain

Feel the urge to customize? You can effortlessly overwrite these variables using bash commands:

```bash
export  ELVIRA_BASE_URL=base_url
export  ELVIRA_CATALOG_ID=catalog_id
export  ELVIRA_THEME=theme
export  ELVIRA_UMAMI_SERVER=server_url
export  ELVIRA_UMAMI_WEBSITE=website_id

npm  run  build:key
```

🔔 **_Oh, and a gentle reminder_** 🔔 _It's best to tweak these variables via bash commands rather than directly modifying the env files._

And remember, it's the golden rule to clean up afterward:

```bash
unset  ELVIRA_BASE_URL
unset  ELVIRA_CATALOG_ID
unset  ELVIRA_THEME
unset  ELVIRA_UMAMI_SERVER
unset  ELVIRA_UMAMI_WEBSITE
```

## Preview your build

Excited to see your creation come to life?
Follow these steps:

1. Run `npm run build:key` (Check build process), to build your app.
2. Run `npm run preview` to run your build.

Let the adventure begin! 🚀
