# Changelog

## 3.1.0 : TBD

- **Added**: ALT in every img entity
- **Added**: Loading progress bar in viewer
- **Added**: Edit page for entries
- **Added**: Confiration dialog for appling identifier info
- **Added**: Edit and add for feeds
- **Added**: Link to stu logo in navbar
- **Added**: Images in `static` folder in `assets` for about page
- **Added**: Assets for MTF
- **Added**: Scripts for analysis
- **Added**: Layout for entries
- **Added**: Catalogs
- **Changed**: Design of `ElviraInput`
- **Changed**: Design of `ElviraTextarea`
- **Changed**: In breadcrumbs `Edit` to actual name of editing entry
- **Changed**: Viewer version from 0.4.21 to 0.5.5
- **Changed**: About page
- **Changed**: `year` to `published_at`
- **Changed**: Translation of year
- **Changed**: In `AdminAddEntry` page in step one (identifiers) 2 inputs to 1
- **Changed**: Entries loading
- **Changed**: Modal
- **Changed**: Favicon to transparent and size 32x32
- **Changed**: README.md
- **Changed**: `Entry.thumbnail` now contains URL path instead of base64
- **Fixed**: Scroll in `EntryDetail`
- **Fixed**: API for getting data from identifier
- **Fixed**: Checking if `entry.authors.lenght` is > 0 befor accesing it
- **Fixed**: Importing
- **Removed**: In `useUserAcquistion` `format` param

## 3.0.18 : 2024-05-10

- **Changed**: Zotero metadata pdf url tag
- **Fixed**: Top padding in viewer page

## 3.0.17 : 2024-05-10

- **Fixed**: Favicon

## 3.0.16 : 2024-05-10

- **Changed**: Favicon size to 16x16
- **Fixed**: Breadcrumbs typo

## 3.0.15 : 2024-05-09

- **Changed**: Few code changing
- **Fixed**: Scroll up button position when search bar is open

## 3.0.14 : 2024-05-09

- **Added**: Mouse scroll button new tab click
- **Changed**: Elvira logo in header clickable -> return to home

## 3.0.13 : 2024-05-09

- **Changed**: Padding putted back (did not help fixed the bug on mobile in feeds)

## 3.0.12 : 2024-05-08

- **Added**: Gravatar and login user
- **Added**: Logos in administration button
- **Changed**: Padding in pages
- **Fixed**: Design mismash

## 3.0.11 : 2024-05-08

- **Chnaged**: translation for entries from 'Dokumenty' to 'Publikácie'
- **Changed**: Swiper interval to 5s

## 3.0.10 : 2024-05-08

- **Changed**: Swiper interval
- **Fixed**: Header showing

## 3.0.9 : 2024-05-08

- **Fixed**: Error with param

## 3.0.8 : 2024-05-08

- **Changed**: Last added entries back from populars (little mistake)

## 3.0.7 : 2024-05-08

- **Added**: Breadcrumbs translation
- **Added**: Swiper in home
- **Changed**: Entry detail
- **Changed**: Advanced search
- **Fixed**: image
- **Fixed**: Select in swipers

## 3.0.6 : 2024-05-08

- **Added**: new params
- **Changed**: README.md
- **Changed**: Advanced search
- **Changed**: Entry detail contributors
- **Fixed**: Entries responzivness

## 3.0.5 : 2024-05-07

- **Fixed**: Not showing logos, needed to be moved to public dir

## 3.0.4 : 2024-05-07

- **Added**: README.md file

## 3.0.3 : 2024-05-07

- **Added**: Search bar in home
- **Changed**: Few translates
- **Changed**: Few icons
- **Removed**: Loans history page
- **Fixed**: "Relogin" - bad code order

## 3.0.2 : 2024-05-05

- **Changed**: Login function

## 3.0.1 : 2024-05-05

- **Changed**: Navbar design
- **Fixed**: Home entries
- **Added**: Advanced Search
- **Added**: Scroll up button
- **Added**: Responsivness
- **Added**: Advanced Search
- **Change**: Few new things

## 3.0.0 : 2024-04-23

- **Changed**: The whole web app design

## 2.0.7 : 2023-10-15

- **Added**: active buttons in navbar
- **Added**: few icons
- **Changed**: sidebar size
- **Changed**: viewer 0.4.17 -> 0.4.18
- **Changed**: sidebar closing
- **Changed**: little advanced search

## 2.0.6 : 2023-10-13

- **Added**: infinit scroll everywhere
- **Added**: path in feed page
- **Added**: year, publisher and generating citation in admin add entry
- **Added**: auto fill in admin, based on DOI/ISBN
- **Added**: DOI/ISBN validator
- **Changed**: scrolling listener
- **Changed**: favorite to my shelf
- **Changed**: admin -> add new entry form
- **Changed**: viewer 0.4.11 -> 0.4.17
- **Fixed**: infinit scroll in admin
- **Removed**: paginator everywhere
- **Removed**: title validator in admin -> new entry

## 2.0.5 : 2023-09-28

- **Added**: query param to entries and feeds service
- **Fixed**: refresh token
- **Fixed**: adding entries in feeds
- **Fixed**: mobile navbar search
- **Fixed**: Admin document management
- **Changed**: elvira log
- **Changed**: admin entry design
- **Changed**: viewer 0.3.9 -> 0.4.11
- **Removed**: few useless images

## 2.0.4 : 2023-09-23

- **Added**: infinit scroll in library
- **Fixed**: auto logout
- **Fixed**: mobile/tablet navbar
- **Removed**: interval interceptor
- **Removed**: paginator in library
- **Changed**: feed styles in entries
- **Changed**: `o projekte` and `nastavenie čítačky` in footer were hidden
- **Changed**: viewer 0.3.6 -> 0.3.9

## 2.0.3 : 2023-09-16

- **Added**: interval interceptor
- **Added**: observer on request interval
- **Fixed**: detection of slow internet

## 2.0.2 : 2023-09-15

- **Added**: tools in library
- **Added**: sorting in library
- **Added**: filter dialog
- **Changed**: filter
- **Changed**: reader setting button in footer desibled
- **Changed**: little design
- **Changed**: change-log design
- **Changed**: viewer version 0.3.5 -> 0.3.6
- **Changed**: visible lines in entry title (1 -> 2)
- **Removed**: filter from navbar
- **Fixed**: gravatar for profile picture

## 2.0.1 : 2023-09-11

- **Changed**: lib in tsconfig.json
- **Changed**: evilFlowersViewer 0.3.4 -> 0.3.5
- **Changed**: feed design (centering)
- **Changed**: loading pdf from BE
- **Removed**: Few useless lines in app-wrapper
- **Moved**: CHANGELOG.md from `src` folder
- **Fixed**: title validator
- **Fixed**: viewer searchWorker

## 2.0.0 : 2023-09-09

- **Added**: Library component and page
- **Added**: Footer
- **Added**: Share function in pdf-viewer
- **Added**: Entry component for admin
- **Added**: Feed component for admin
- **Added**: Page for feeds that users use
- **Added**: Feed component used in feed page
- **Added**: Global folder for services and types
- **Added**: Feed dialog in admin
- **Added**: Footer components such as `about project`, `change log` and `reader settings`
- **Added**: Elvira directive, for own button click handler
- **Added**: Rooting for new pages such as elvira/library
- **Added**: Swiper for popular entries
- **Added**: Sentences in translating
- **Added**: Favorites service
- **Added**: Favorites types
- **Added**: Markdown library for change log
- **Added**: Service for elvira directive, modified navigator
- **Changed**: Routing for new components
- **Changed**: Names for components
- **Changed**: Entry types
- **Changed**: Loading component
- **Changed**: Home component and page
- **Changed**: In admin add-entry
- **Changed**: In admin add feed
- **Changed**: Login page
- **Changed**: Name library.module -> elvira.module
- **Changed**: Filters
- **Changed**: Services and types to global
- **Changed**: Favorites
- **Changed**: Endpoints and overall functions that are used for endpoints call
- **Changed**: Entry detail component
- **Changed**: Entry detail info dialog
- **Changed**: Header changed and buttons init
- **Changed**: Interpreters
- **Changed**: Project design
- **Changed**: Nearly everything
