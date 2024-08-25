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
          success: 'Skupina bola úspešne pridaná.',
          error: 'Skupinu sa nepodarilo pridať.',
        },
        edit: {
          success: 'Skupina bola úspešne upravená.',
          error: 'Skupinu sa nepodarilo upraviť.',
        },
        remove: {
          success: 'Skupina bola úspešne odstránená.',
          error: 'Skupinu sa nepodarilo odstrániť.',
        },
      },
      category: {
        add: {
          success: 'Kategória bola úspešne pridaná.',
          error: 'Kategóriu sa nepodarilo pridať.',
        },
        edit: {
          success: 'Kategória bola úspešne upravená.',
          error: 'Kategóriu sa nepodarilo upraviť.',
        },
        remove: {
          success: 'Kategória bola úspešne odstránená.',
          error: 'Kategóriu sa nepodarilo odstrániť.',
        },
      },
      editPage: {
        layer: {
          save: {
            success: 'Vrstva bola úspešne uložená.',
            error: 'Vrstvu sa nepodarilo uložiť.',
          },
          edit: {
            success: 'Vrstva bola úspešne upravená.',
            error: 'Vrstvu sa nepodarilo upraviť.',
          },
          delete: {
            success: 'Vrstva bola úspešne vymazaná.',
            error: 'Vrstvu sa nepodarilo vymazať.',
          },
        },
        group: {
          add: {
            success: 'Skupina vrstiev bola úspešne pridaná.',
            error: 'Skupinu vrstiev sa nepodarilo pridať.',
          },
          edit: {
            success: 'Skupina vrstiev vola úspešne upravená.',
            error: 'Skupinu vrstiev sa nepodarilo upraviť.',
          },
          remove: {
            success: 'Skupina vrstiev bola úspešne odstránená.',
            error: 'Skupinu vrstiev sa nepodarilo odstrániť.',
          },
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
        categories: 'Kategórie',
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
          lang: 'Jazyk je povinný. Pred pokračovaním je potrebné ho vyplniť.',
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
        titleNamespace: 'Názov pre publikáciu',
        title: 'Názov',
        year: 'Dátum publikovania',
        lang: 'Jazyk',
        copies: 'Počet exemplárov',
        publisher: 'Vydavateľ',
        summary: 'Zhrnutie',
        AuthorsAndFeeds: 'Autori a Skupiny',
        author: 'Autor',
        authors: 'Autori',
        authorName: 'Autorové meno',
        authorSurname: 'Autorové priezvisko',
        coName: 'Spolu-Autorové meno',
        coSurname: 'Spolu-Autorové priezvisko',
        configuration: 'Konfigurácia',
        categories: 'Kategórie',
        feeds: 'Skupiny',
        citation: 'Citácia',
        files: 'Súbory',
        imageAndFile: 'Obrázok a PDF',
        image: 'Obrázok',
        imageHint: 'Presuňte sem váš obrázok alebo kliknite na prehľadávanie',
        pdfHint: 'Presuňte sem váš PDF súbor alebo kliknite na prehľadávanie',
        download: 'Stiahnutie',
        share: 'Zdielanie',
        print: 'Tlač',
        annotations: 'Anotácie',
      },
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
        selected: 'Vybrané',
        options: 'Možnosti',
      },
      categoryMenu: {
        label: 'Aplikovať',
        title: 'Kategórie',
        empty: 'Kategóre sú prázdne',
        selected: 'Vybrané',
        options: 'Možnosti',
      },
      applyInfo: {
        label: 'Aplikovať',
        title: 'Informácie',
        dialog:
          'Želáte si aplikovať získané informácie z vášho {{x}} identifikátora: {{y}}?',
      },
      confirmation: {
        label: 'Vymazať',
        title: 'Potvdenie o vymazaní',
        dialog: 'Ste si istý, že chcete odstrániť "{{x}}" {{y}}?',
        entry: 'publikáciu',
        feed: 'skupinu',
        category: 'kategóriu',
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
      categoryForm: {
        edit: 'Upraviť',
        editCategory: 'Upraviť Kategóriu',
        add: 'Pridať',
        addCategory: 'Pridať Kategóriu',
        term: 'Názov',
        label: 'Popis',
        scheme: 'Schéma',
        requiredMessages: {
          term: 'Termín je povinný. Pred pokračovaním je potrebné ho vyplniť.',
        },
      },
    },

    // TOOLS
    tools: {
      search: 'Hľadať',
      advancedSearch: 'Pokročilé Vyhľadávanie',
      orderBy: {
        createdAtAsc: 'Dátum publikovania ↑',
        createdAtDesc: 'Dátum publikovania ↓',
        titleAsc: 'Názov ↑',
        titleDesc: 'Názov ↓',
      },
    },

    // ABOUT PAGE
    about: {
      title: 'Digitálna akademická knižnica',
      subTitle:
        'Otvorené a jednoducho použiteľné nástroje pre distribúciu dokumentov',
      readMore: 'Čítať viac',
      read: {
        title: 'Čítanie',
        descriptionPart1: 'Vytvorili sme open-source čítačku PDF s názvom ',
        descriptionPart2:
          ' pre jednoduché prezeranie dokumentov so základnými nástrojmi na vytváranie poznámok, exportovanie citácií a zdieľanie dokumentov.',
      },
      organize: {
        title: 'Organizovanie',
        description:
          'Svoje dokumenty môžete jednoducho organizovať vytvorením viacerých katalógov s RBAC, ktorý je konfigurovateľný pomocou webového rozhrania alebo REST API.',
      },
      distribute: {
        title: 'Distribuovanie',
        description:
          'Naše projekty sú navrhnuté tak, aby boli interoperabilné a podporovali mnoho rôznych komunikačných protokolov, ako sú OPDS, REST API, OAI a Z39.50 (momentálne v pokroku). Podporujeme tiež viaceré úložiská pre jednoduchú implementáciu.',
      },
    },

    // COOKIES
    cookies: {
      information:
        'Táto webová stránka používa cookies na zlepšenie vášho zážitku. Používame cookies na zapamätanie si vašich preferencií rozloženia, vybraného režimu alebo jazyka, aby sme vám poskytli lepší zážitok.',
      accept: 'Rozumiem',
    },
  },
};
