import { Rating } from "@mui/material";

export const en = {
  translation: {
    // NOTIFICATIONS
    notifications: {
      myShelf: {
        add: {
          success: 'The book has been successfully added to your shelf.',
          error: 'The book failed to by added to your shelf.',
        },
        remove: {
          success: 'The book has been successfully removed from your shelf.',
          error: 'The book failed to by removed from your shelf.',
        },
      },
      entry: {
        add: {
          success: 'Entry was successfully added.',
          error: 'Entry failed to be added.',
        },
        edit: {
          success: 'Entry was successfully edited.',
          error: 'Entry failed to by edited.',
        },
        remove: {
          success: 'Entry was successfully removed.',
          error: 'Entry failed to by removed.',
        },
      },
      acquisition: {
        add: {
          success: "Acquisition '{{x}}' was successfully added.",
          error: "Acquisition '{{x}}' failed to be added.",
        },
        edit: {
          success: "Acquisition '{{x}}' was successfully edited.",
          error: "Acquisition '{{x}}' failed to by edited.",
        },
        remove: {
          success: "Acquisition '{{x}}' was successfully removed.",
          error: "Acquisition '{{x}}' failed to by removed.",
        },
      },
      feed: {
        add: {
          success: 'Feed was successfully added.',
          error: 'Feed failed to be added.',
        },
        edit: {
          success: 'Feed was successfully edited.',
          error: 'Feed failed to by edited.',
        },
        remove: {
          success: 'Feed was successfully removed.',
          error: 'Feed failed to by removed.',
        },
      },
      category: {
        add: {
          success: 'Category was successfully added.',
          error: 'Category failed to be added.',
        },
        edit: {
          success: 'Category was successfully edited.',
          error: 'Category failed to by edited.',
        },
        remove: {
          success: 'Category was successfully removed.',
          error: 'Category failed to by removed.',
        },
      },
      editPage: {
        layer: {
          save: {
            success: 'Layer was successfully saved.',
            error: 'Layer failed to be saved.',
          },
          edit: {
            success: 'Layer was successfully edited.',
            error: 'Layer failed to be edited.',
          },
          delete: {
            success: 'Layer was successfully deleted.',
            error: 'Layer failed to be deleted.',
          },
        },
        group: {
          add: {
            success: 'Group was successfully added.',
            error: 'Group failed to be added.',
          },
          edit: {
            success: 'Group was successfully edited.',
            error: 'Group failed to be edited.',
          },
          remove: {
            success: 'Group was successfully removed.',
            error: 'Group failed to be removed.',
          },
        },
      },
      login: {
        success: 'You have been successfully logged in.',
        error: 'Wrong credentials.',
      },
      dataFromIdentifiers: {
        success: 'Information from the identifier was successfully retrieved.',
        error: 'Could not get information from the identifier.',
      },
      logout: 'You have been logged out.',
      fileFailed: 'Something went wrong while reading the file.',
      citation: {
        noCite: 'Citation is not available.',
        copySuccess: 'Citation has been copied to the clipboard.',
        copyError: 'Failed to copy the citation.',
      },
      shareSuccess: 'Address successfully copied.',
    },

    // LOGIN PAGE
    login: {
      requiredMessage: {
        username: 'The field username must be filled.',
        password: 'The field password must be filled.',
      },
      digitalLibrary: 'Digital Library',
      username: 'Username',
      password: 'Password',
      loginBtn: 'Login',
      license: 'By logging in, I agree to the license terms',
      licenseTitle: 'License terms',
    },

    // ADMINISTRATION PAGE
    administration: {
      homePage: {
        entries: 'Entries',
        feeds: 'Feeds',
        categories: 'Categories',
      },
    },

    general: {
      scrollUp: 'Scroll Up',
    },

    // NOT FOUND PAGE
    notFound: {
      oops: 'Oops',
      '404': '404 - PAGE NOT FOUND',
      infoPart1: 'The page you are looking for might have been removed',
      infoPart2: 'had its name changed or is temporarily unavailable.',
      goBack: 'GO TO HOMEPAGE',
    },

    // NAVBAR MENU
    navbarMenu: {
      portal: 'Main Menu',
      personal: 'Personal',
      settings: 'Settings',
      catalog: 'Catalog',
      about: 'About',
      home: 'Home',
      library: 'Library',
      myShelf: 'Shelf',
      loan: 'Loans',
      loanHistory: 'Loans Histroy',
      feeds: 'Feeds',
      administration: 'Administration',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      user: 'Student',
      superUser: 'Admin',
    },

    // PAGE
    page: {
      notFound: 'Nothing was found',
      shelfEmpty: 'Your shelf is empty',
      error: 'An error occurred while loading data',
      scrollUp: 'Scroll up',
      removeFilters: 'Remove filters',
    },

    // HOME PAGE
    home: {
      popular: 'Popular',
      lastAdded: 'Last Added',
      search: 'Search in Elvira',
    },

    // SEARCH BAR COMPONENT
    searchBar: {
      advancedSearch: 'Advanced Search',
      title: 'Title of entry',
      author: "Author's Name",
      category: 'Category',
      feeds: 'Feed',
      search: 'Search',
      yearFrom: 'Year from',
      yearTo: 'Year to',
    },

    // ENTRY COMPONENT
    entry: {
      detail: {
        close: 'Close',
        add: 'Add',
        remove: 'Remove',
        pages: 'Pages',
        rating: 'Rating',
        views: 'Views',
        lang: 'Language',
        feeds: 'Feeds',
        categories: 'Categories',
        publisher: 'Publisher',
        publishDate: 'Date of publication',
        summary: 'Summary',
        read: 'Read',
        cite: 'Cite',
        share: 'Share',
        relation: 'Relation',
        noAuthor: 'Unknown author',
        title: 'Book Detail',
        readMore: 'Read More',
        readLess: 'Read Less',
        tabs: {
          contents: 'Contents',
          reviews: 'Reviews',
          related: 'Related',
        }
      },
      wizard: {
        requiredMessages: {
          title:
            'Title field is required. It must be filled out before proceeding.',
          lang: 'Language field is required. It must be filled out before proceeding.',
          authorName:
            "Author's name field is required. It must be filled out before proceeding.",
          authorSurname:
            "Author's surname field is required. It must be filled out before proceeding.",
          coName:
            "Contributor's name field is required. It must be filled out before proceeding.",
          coSurname:
            "Contributor's surname field is required. It must be filled out before proceeding.",
          image:
            'Image file is required. You must insert an image before proceeding.',
          pdf: 'PDF file is required. You must insert an PDF before proceeding.',
        },
        next: 'Next',
        new: 'Create new',
        upload: 'Upload',
        edit: 'Edit',
        previous: 'Previous',
        identifiers: 'Identifiers',
        additionalData: 'Additional Data',
        titleNamespace: 'Title of the entry',
        title: 'Title',
        year: 'Date of publication',
        lang: 'Language',
        copies: 'Number of copies',
        publisher: 'Publisher',
        summary: 'Summary',
        AuthorsAndFeeds: 'Authors & Feeds',
        author: 'Author',
        authors: 'Authors',
        authorName: 'Name',
        authorSurname: 'Surname',
        configuration: 'Configuration',
        categories: 'Categories',
        category: 'Category',
        feeds: 'Feeds',
        feed: 'Feed',
        citation: 'Citation',
        files: 'Files',
        imageAndFile: 'Image & PDF',
        image: 'Image',
        imageHint: 'Drag your image here or click here to browse',
        pdfHint: 'Drag your PDF files here',
        download: 'Download',
        share: 'Share',
        print: 'Print',
        annotations: 'Annotations',
      },
    },

    dropzone: {
      errorMessage: {
        image: 'Image was bigger than max size (5 MB).',
        pdf: 'Something went wrong while getting the file.',
      },
    },

    modal: {
      close: 'Close',
      feedMenu: {
        label: 'Apply',
        title: 'Feeds',
        empty: 'Feeds are empty',
        selected: 'Selected',
        options: 'Options',
      },
      categoryMenu: {
        label: 'Apply',
        title: 'Categories',
        empty: 'Categories are empty',
        selected: 'Selected',
        options: 'Options',
      },
      confirmation: {
        label: 'Delete',
        title: 'Confirmation for delete',
        dialog: 'Are you sure you want to delete "{{x}}" {{y}}?',
        entry: 'entry',
        feed: 'feed',
        category: 'category',
      },
      feedForm: {
        edit: 'edit',
        editFeed: 'Edit Feed',
        add: 'Add',
        addFeed: 'Add Feed',
        title: 'Title',
        content: 'Content',
        kind: 'Kind',
        parent: 'Parent',
        none: 'None',
        acquistion: 'Acquisition feed (contains publications)',
        navigation: 'Navigation feed (contains additional feeds)',
        requiredMessages: {
          title:
            'Title field is required. It must be filled out before proceeding.',
          content:
            'Content field is required. It must be filled out before proceeding.',
        },
      },
      categoryForm: {
        edit: 'Edit',
        editCategory: 'Edit Category',
        add: 'Add',
        addCategory: 'Add Category',
        term: 'Term',
        label: 'Label',
        scheme: 'Scheme',
        requiredMessages: {
          term: 'Term field is required. It must be filled out before proceeding.',
        },
      },
    },

    // TOOLS
    tools: {
      search: 'Search',
      advancedSearch: 'Advanced Search',
      orderBy: {
        createdAtAsc: 'Created at ↑',
        createdAtDesc: 'Created at ↓',
        titleAsc: 'Title ↑',
        titleDesc: 'Title ↓',
        popularityAsc: 'Popularity ↑',
        popularityDesc: 'Popularity ↓',
      },
    },

    // ABOUT PAGE
    about: {
      title: 'Digital academic library',
      subTitle: 'Open and easy to use tools for document distribution',
      readMore: 'Read more',
      banner: {
        title: 'Take advantage of the Elvira AI assistant',
        description: 'Ask for recommendations, search for information, or generate book summaries',
        action: 'Try the assistant'
      },
      read: {
        title: 'Read',
        descriptionPart1:
          'We have created an open-source PDF reader on top of pdf.js called ',
        descriptionPart2:
          ' for easy document browsing with basic tools for taking notes, exporting citations and document sharing.',
      },
      organize: {
        title: 'Organize',
        description:
          'You can easily organize your document be creating multiple catalogs with RBAC which is configurable using web interface or REST API.',
      },
      distribute: {
        title: 'Distribute',
        description:
          'Our projects are designed to be interopable and support many different communication protocols such as OPDS, REST API, OAI and Z39.50 (currently in progress). We support also multiple storage backends for easy deployment.',
      },
    },

    // COOKIES
    cookies: {
      information:
        'This website uses cookies to enhance your experience. We use cookies to remember your layout preferences, selected theme and language to provide a better experience.',
      accept: 'I understand',
    },
  },
};
