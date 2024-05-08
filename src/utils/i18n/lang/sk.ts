export const sk = {
  translation: {
    // NOTIFICATIONS
    notifications: {
      myShelf: {
        add: {
          success: 'Kniha bola úspešne pridaná do vašej poličky.',
          error: 'Kniha sa nepodarila pridať do vašej poličky.',
        },
        remove: {
          success: 'Kniha bola úspešne odstránená z vašej poličky.',
          error: 'Knihu sa nepodarilo odstrániť z vašej poličky.',
        },
      },
      entry: {
        add: {
          success: 'Záznam bol úspešne pridaný.',
          error: 'Záznam sa nepodarilo pridať.',
        },
        edit: {
          success: 'Záznam bol úspešne upravený.',
          error: 'Záznam sa nepodarilo upraviť.',
        },
        remove: {
          success: 'Záznam bol úspešne odstránený.',
          error: 'Záznam sa nepodarilo odstrániť.',
        },
      },
      feed: {
        add: {
          success: 'Skupina bola úspešne pridaný.',
          error: 'Skupinu sa nepodarilo pridať.',
        },
        edit: {
          success: 'Skupina bola úspešne upravený.',
          error: 'Skupinu sa nepodarilo upraviť.',
        },
        remove: {
          success: 'Skupina bola úspešne odstránený.',
          error: 'Skupinu sa nepodarilo odstrániť.',
        },
      },
      login: {
        success: 'Boli ste úspešne prihlásený.',
        error: 'Nesprávne prihlasovacie údaje.',
      },
      dataFromIdentifiers: {
        success: 'Informácie z identifikátora boli úspešne získané.',
        error: 'Nepodarilo sa získať informácie z identifikátora.',
      },
      logout: 'Boli ste odhlásený.',
      fileFailed: 'Niečo sa pokazilo pri čítaní súboru.',
    },

    // LOGIN PAGE
    login: {
      requiredMessage: {
        username: 'Políčko prihlasovacie meno musí byť vyplnené.',
        password: 'Políčko heslo musí byť vyplnené.',
      },
      digitalLibrary: 'Digitálna Knižnica',
      username: 'Prihlasovacie meno',
      password: 'Heslo',
      loginBtn: 'Prihlásiť sa',
    },

    // ADMINISTRATION PAGE
    administration: {
      homePage: {
        entries: 'Publikácie',
        feeds: 'Skupiny',
      },
    },

    general: {
      scrollUp: 'Posunúť Nahor',
    },

    // NOT FOUND PAGE
    notFound: {
      oops: 'Uups',
      '404': '404 - STRANA NEBOLA NÁJDENÁ',
      infoPart1: 'Strana, ktorú hľadáte, mohla byť odstránená,',
      infoPart2: 'premenovaná alebo je dočasne nedostupná.',
      goBack: 'SPÄŤ NA DOMOVSKÚ STRANU',
    },

    // NAVBAR MENU
    navbarMenu: {
      portal: 'Portál',
      personal: 'Osobné',
      settings: 'Nastavenia',
      home: 'Domov',
      about: 'O Projekte',
      library: 'Knižnica',
      myShelf: 'Polička',
      loan: 'Výpožičky',
      feeds: 'Skupiny',
      administration: 'Administrácia',
      darkMode: 'Tmavý Režim',
      lightMode: 'Svetlý Režim',
      logout: 'Odhlásiť sa',
    },

    // PAGE
    page: {
      notFound: 'Nič nebolo nájdené',
      shelfEmpty: 'Vaša polička je prázdna',
      error: 'Nastala chyba pri načítavaní dát',
      scrollUp: 'Posunúť nahor',
      removeFilters: 'Odstrániť filtre',
    },

    // HOME PAGE
    home: {
      popular: 'Populárne',
      lastAdded: 'Naposledy Pridané',
      search: 'Hľadať v Elvíre',
    },

    // SEARCH BAR COMPONENT
    searchBar: {
      advancedSearch: 'Pokročilé Vyhľadávanie',
      title: 'Názov',
      author: 'Autorové Meno',
      category: 'Kategória',
      year: 'Rok',
      from: 'Od',
      to: 'Do',
      feeds: 'Skupiny',
      search: 'Hľadať',
    },

    // ENTRY COMPONENT
    entry: {
      detail: {
        close: 'Zavrieť',
        add: '+ Pridať do poličky',
        remove: '- Odstrániť z poličky',
        pages: 'Strany',
        views: 'Zobrazenia',
        lang: 'Jazyk',
        feeds: 'Skupiny',
        summary: 'Zhrnutie',
        read: 'Čítať',
      },
      wizard: {
        requiredMessages: {
          title: 'Názov je povinný. Pred pokračovaním je potrebné ho vyplniť.',
          authorName:
            'Pole s menom autora je povinné. Pred pokračovaním je potrebné ho vyplniť.',
          authorSurname:
            'Pole s priezviskom autora je povinné. Pred pokračovaním je potrebné ho vyplniť.',
          image: 'Obrázok je povinný. Pred pokračovaním musíte vložiť obrázok.',
          pdf: 'PDF súbor je povinný. Pred pokračovaním musíte vložiť PDF súbor.',
        },
        next: 'Ďaľší',
        upload: 'Uložiť',
        edit: 'Upraviť',
        previous: 'Predošlý',

        identifiers: 'Identifikátory',
        additionalData: 'Dodatočné dáta',
        title: 'Názov',
        year: 'Rok',
        publisher: 'Vydavateľ',
        summary: 'Zhrnutie',
        AuthorsAndFeeds: 'Autori & Skupiny',
        author: 'Autor',
        authorName: 'Autorové meno',
        authorSurname: 'Autorové priezvisko',
        coName: 'Spolu-Autorové meno',
        coSurname: 'Spolu-Autorové priezvisko',
        feeds: 'Skupiny',
        citation: 'Citácia',
        imageAndFile: 'Obrázok & PDF',
        image: 'Obrázok',
        imageHint: 'Presuňte sem váš obrázok alebo kliknite na prehľadávanie',
        pdfHint: 'Presuňte sem váš PDF súbor alebo kliknite na prehľadávanie',
      },
    },

    input: {
      required: 'Povinné*',
      notRequired: 'Nepovinné',
    },

    dropzone: {
      errorMessage: {
        image: 'Obrázok bol väčší ako maximálna veľkosť (5 MB).',
        pdf: 'Niečo sa pokazilo počas načítavania súboru.',
      },
    },

    modal: {
      feedMenu: {
        label: 'Aplikovať',
        title: 'Skupiny',
        empty: 'Skupiny sú prázdne',
      },
      applyInfo: {
        label: 'Aplikovať',
        title: 'Informácie',
        dialog: 'Želáte si aplikovať získané informácie z identifikátora?',
      },
      confirmation: {
        label: 'Vymazať',
        title: 'Potvdenie o vymazaní',
        dialog: 'Ste si istý, že chcete odstrániť {{x}}?',
      },
      feedForm: {
        edit: 'Upraviť',
        editFeed: 'Upraviť Skupinu',
        add: 'Pridať',
        addFeed: 'Pridať Skupinu',
        title: 'Názov',
        content: 'Kontent',
        kind: 'Druh',
        parent: 'Rodič',
        none: 'Žiaden',
        acquistion: 'Publikačná skupina (obsahuje publikácie)',
        navigation: 'Navigačná skupina (obsahuje ďaľšie skupiny)',
        requiredMessages: {
          title: 'Názov je povinný. Pred pokračovaním je potrebné ho vyplniť.',
          content:
            'Kontent je povinný. Pred pokračovaním je potrebné ho vyplniť.',
        },
      },
    },

    // TOOLS
    tools: {
      search: 'Hľadať',
      advancedSearch: 'Pokročilé Vyhľadávanie',
      orderBy: {
        createdAtAsc: 'Dátum pridania ↑',
        createdAtDesc: 'Dátum pridania ↓',
        titleAsc: 'Názov ↑',
        titleDesc: 'Názov ↓',
      },
    },
  },
};
