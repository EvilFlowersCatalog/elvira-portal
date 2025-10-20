import { ILanguage } from "../../../utils/interfaces/language";

const languages = [
    {
        "name": {
            "en": "Afar",
            "sk": "Afarčina"
        },
        "alpha2": "aa",
        "alpha3": "aar"
    },
    {
        "name": {
            "en": "Abkhazian",
            "sk": "Abcházština"
        },
        "alpha2": "ab",
        "alpha3": "abk"
    },
    {
        "name": {
            "en": "Afrikaans",
            "sk": "Afrikánčina"
        },
        "alpha2": "af",
        "alpha3": "afr"
    },
    {
        "name": {
            "en": "Akan",
            "sk": "Akančina"
        },
        "alpha2": "ak",
        "alpha3": "aka"
    },
    {
        "name": {
            "en": "Amharic",
            "sk": "Amharčina"
        },
        "alpha2": "am",
        "alpha3": "amh"
    },
    {
        "name": {
            "en": "Arabic",
            "sk": "Arabčina"
        },
        "alpha2": "ar",
        "alpha3": "ara"
    },
    {
        "name": {
            "en": "Aragonese",
            "sk": "Aragónčina"
        },
        "alpha2": "an",
        "alpha3": "arg"
    },
    {
        "name": {
            "en": "Assamese",
            "sk": "Ásámčina"
        },
        "alpha2": "as",
        "alpha3": "asm"
    },
    {
        "name": {
            "en": "Avaric",
            "sk": "Avarčina"
        },
        "alpha2": "av",
        "alpha3": "ava"
    },
    {
        "name": {
            "en": "Avestan",
            "sk": "Avestčina"
        },
        "alpha2": "ae",
        "alpha3": "ave"
    },
    {
        "name": {
            "en": "Aymara",
            "sk": "Ajmarčina"
        },
        "alpha2": "ay",
        "alpha3": "aym"
    },
    {
        "name": {
            "en": "Azerbaijani",
            "sk": "Azerbajdžančina"
        },
        "alpha2": "az",
        "alpha3": "aze"
    },
    {
        "name": {
            "en": "Bashkir",
            "sk": "Baškirčina"
        },
        "alpha2": "ba",
        "alpha3": "bak"
    },
    {
        "name": {
            "en": "Bambara",
            "sk": "Bambarčina"
        },
        "alpha2": "bm",
        "alpha3": "bam"
    },
    {
        "name": {
            "en": "Belarusian",
            "sk": "Bieloruština"
        },
        "alpha2": "be",
        "alpha3": "bel"
    },
    {
        "name": {
            "en": "Bengali",
            "sk": "Bengálčina"
        },
        "alpha2": "bn",
        "alpha3": "ben"
    },
    {
        "name": {
            "en": "Bislama",
            "sk": "Bislama"
        },
        "alpha2": "bi",
        "alpha3": "bis"
    },
    {
        "name": {
            "en": "Tibetan",
            "sk": "Tibetčina"
        },
        "alpha2": "bo",
        "alpha3": "bod"
    },
    {
        "name": {
            "en": "Bosnian",
            "sk": "Bosniačina"
        },
        "alpha2": "bs",
        "alpha3": "bos"
    },
    {
        "name": {
            "en": "Breton",
            "sk": "Bretónčina"
        },
        "alpha2": "br",
        "alpha3": "bre"
    },
    {
        "name": {
            "en": "Bulgarian",
            "sk": "Bulharčina"
        },
        "alpha2": "bg",
        "alpha3": "bul"
    },
    {
        "name": {
            "en": "Catalan",
            "sk": "Katalánčina"
        },
        "alpha2": "ca",
        "alpha3": "cat"
    },
    {
        "name": {
            "en": "Czech",
            "sk": "Čeština"
        },
        "alpha2": "cs",
        "alpha3": "ces"
    },
    {
        "name": {
            "en": "Chamorro",
            "sk": "Čamorčina"
        },
        "alpha2": "ch",
        "alpha3": "cha"
    },
    {
        "name": {
            "en": "Chechen",
            "sk": "Čečenčina"
        },
        "alpha2": "ce",
        "alpha3": "che"
    },
    {
        "name": {
            "en": "Church Slavic",
            "sk": "Cirkevnoslovančina"
        },
        "alpha2": "cu",
        "alpha3": "chu"
    },
    {
        "name": {
            "en": "Chuvash",
            "sk": "Čuvaština"
        },
        "alpha2": "cv",
        "alpha3": "chv"
    },
    {
        "name": {
            "en": "Cornish",
            "sk": "Kornčina"
        },
        "alpha2": "kw",
        "alpha3": "cor"
    },
    {
        "name": {
            "en": "Corsican",
            "sk": "Korzičtina"
        },
        "alpha2": "co",
        "alpha3": "cos"
    },
    {
        "name": {
            "en": "Cree",
            "sk": "Kríjčina"
        },
        "alpha2": "cr",
        "alpha3": "cre"
    },
    {
        "name": {
            "en": "Welsh",
            "sk": "Walesčina"
        },
        "alpha2": "cy",
        "alpha3": "cym"
    },
    {
        "name": {
            "en": "Danish",
            "sk": "Dánčina"
        },
        "alpha2": "da",
        "alpha3": "dan"
    },
    {
        "name": {
            "en": "German",
            "sk": "Nemčina"
        },
        "alpha2": "de",
        "alpha3": "deu"
    },
    {
        "name": {
            "en": "Dhivehi",
            "sk": "Divehi"
        },
        "alpha2": "dv",
        "alpha3": "div"
    },
    {
        "name": {
            "en": "Dzongkha",
            "sk": "Dzongkä"
        },
        "alpha2": "dz",
        "alpha3": "dzo"
    },
    {
        "name": {
            "en": "Modern Greek (1453-)",
            "sk": "Novogréčtina"
        },
        "alpha2": "el",
        "alpha3": "ell"
    },
    {
        "name": {
            "en": "English",
            "sk": "Angličtina"
        },
        "alpha2": "en",
        "alpha3": "eng"
    },
    {
        "name": {
            "en": "Esperanto",
            "sk": "Esperanto"
        },
        "alpha2": "eo",
        "alpha3": "epo"
    },
    {
        "name": {
            "en": "Estonian",
            "sk": "Estónčina"
        },
        "alpha2": "et",
        "alpha3": "est"
    },
    {
        "name": {
            "en": "Basque",
            "sk": "Baskičtina"
        },
        "alpha2": "eu",
        "alpha3": "eus"
    },
    {
        "name": {
            "en": "Ewe",
            "sk": "Ewe"
        },
        "alpha2": "ee",
        "alpha3": "ewe"
    },
    {
        "name": {
            "en": "Faroese",
            "sk": "Faerčina"
        },
        "alpha2": "fo",
        "alpha3": "fao"
    },
    {
        "name": {
            "en": "Persian",
            "sk": "Perzština"
        },
        "alpha2": "fa",
        "alpha3": "fas"
    },
    {
        "name": {
            "en": "Fijian",
            "sk": "Fidžijčina"
        },
        "alpha2": "fj",
        "alpha3": "fij"
    },
    {
        "name": {
            "en": "Finnish",
            "sk": "Fínčina"
        },
        "alpha2": "fi",
        "alpha3": "fin"
    },
    {
        "name": {
            "en": "French",
            "sk": "Francúzština"
        },
        "alpha2": "fr",
        "alpha3": "fra"
    },
    {
        "name": {
            "en": "Western Frisian",
            "sk": "Západná Frízština"
        },
        "alpha2": "fy",
        "alpha3": "fry"
    },
    {
        "name": {
            "en": "Fulah",
            "sk": "Fulbčina"
        },
        "alpha2": "ff",
        "alpha3": "ful"
    },
    {
        "name": {
            "en": "Scottish Gaelic",
            "sk": "Škótska Gaelčina"
        },
        "alpha2": "gd",
        "alpha3": "gla"
    },
    {
        "name": {
            "en": "Irish",
            "sk": "Írčina"
        },
        "alpha2": "ga",
        "alpha3": "gle"
    },
    {
        "name": {
            "en": "Galician",
            "sk": "Galícijčina"
        },
        "alpha2": "gl",
        "alpha3": "glg"
    },
    {
        "name": {
            "en": "Manx",
            "sk": "Mančina"
        },
        "alpha2": "gv",
        "alpha3": "glv"
    },
    {
        "name": {
            "en": "Guarani",
            "sk": "Guaraní"
        },
        "alpha2": "gn",
        "alpha3": "grn"
    },
    {
        "name": {
            "en": "Gujarati",
            "sk": "Gudžarátčina"
        },
        "alpha2": "gu",
        "alpha3": "guj"
    },
    {
        "name": {
            "en": "Haitian",
            "sk": "Haitčina"
        },
        "alpha2": "ht",
        "alpha3": "hat"
    },
    {
        "name": {
            "en": "Hausa",
            "sk": "Hausčina"
        },
        "alpha2": "ha",
        "alpha3": "hau"
    },
    {
        "name": {
            "en": "Serbo-Croatian",
            "sk": "Srbochorvátčina"
        },
        "alpha2": "sh",
        "alpha3": "hbs"
    },
    {
        "name": {
            "en": "Hebrew",
            "sk": "Hebrejčina"
        },
        "alpha2": "he",
        "alpha3": "heb"
    },
    {
        "name": {
            "en": "Herero",
            "sk": "Herero"
        },
        "alpha2": "hz",
        "alpha3": "her"
    },
    {
        "name": {
            "en": "Hindi",
            "sk": "Hindčina"
        },
        "alpha2": "hi",
        "alpha3": "hin"
    },
    {
        "name": {
            "en": "Hiri Motu",
            "sk": "Hiri Motu"
        },
        "alpha2": "ho",
        "alpha3": "hmo"
    },
    {
        "name": {
            "en": "Croatian",
            "sk": "Chorvátčina"
        },
        "alpha2": "hr",
        "alpha3": "hrv"
    },
    {
        "name": {
            "en": "Hungarian",
            "sk": "Maďarčina"
        },
        "alpha2": "hu",
        "alpha3": "hun"
    },
    {
        "name": {
            "en": "Armenian",
            "sk": "Arménčina"
        },
        "alpha2": "hy",
        "alpha3": "hye"
    },
    {
        "name": {
            "en": "Igbo",
            "sk": "Igbo"
        },
        "alpha2": "ig",
        "alpha3": "ibo"
    },
    {
        "name": {
            "en": "Ido",
            "sk": "Ido"
        },
        "alpha2": "io",
        "alpha3": "ido"
    },
    {
        "name": {
            "en": "Sichuan Yi",
            "sk": "Sichuanská Yi"
        },
        "alpha2": "ii",
        "alpha3": "iii"
    },
    {
        "name": {
            "en": "Inuktitut",
            "sk": "Inuktitut"
        },
        "alpha2": "iu",
        "alpha3": "iku"
    },
    {
        "name": {
            "en": "Interlingue",
            "sk": "Interlingue"
        },
        "alpha2": "ie",
        "alpha3": "ile"
    },
    {
        "name": {
            "en": "Interlingua (International Auxiliary Language Association)",
            "sk": "Interlingua"
        },
        "alpha2": "ia",
        "alpha3": "ina"
    },
    {
        "name": {
            "en": "Indonesian",
            "sk": "Indonézčina"
        },
        "alpha2": "id",
        "alpha3": "ind"
    },
    {
        "name": {
            "en": "Inupiaq",
            "sk": "Inupiak"
        },
        "alpha2": "ik",
        "alpha3": "ipk"
    },
    {
        "name": {
            "en": "Icelandic",
            "sk": "Islandčina"
        },
        "alpha2": "is",
        "alpha3": "isl"
    },
    {
        "name": {
            "en": "Italian",
            "sk": "Taliančina"
        },
        "alpha2": "it",
        "alpha3": "ita"
    },
    {
        "name": {
            "en": "Javanese",
            "sk": "Jávčina"
        },
        "alpha2": "jv",
        "alpha3": "jav"
    },
    {
        "name": {
            "en": "Japanese",
            "sk": "Japončina"
        },
        "alpha2": "ja",
        "alpha3": "jpn"
    },
    {
        "name": {
            "en": "Kalaallisut",
            "sk": "Grónčina"
        },
        "alpha2": "kl",
        "alpha3": "kal"
    },
    {
        "name": {
            "en": "Kannada",
            "sk": "Kannadčina"
        },
        "alpha2": "kn",
        "alpha3": "kan"
    },
    {
        "name": {
            "en": "Kashmiri",
            "sk": "Kašmírčina"
        },
        "alpha2": "ks",
        "alpha3": "kas"
    },
    {
        "name": {
            "en": "Georgian",
            "sk": "Gruzínčina"
        },
        "alpha2": "ka",
        "alpha3": "kat"
    },
    {
        "name": {
            "en": "Kanuri",
            "sk": "Kanuri"
        },
        "alpha2": "kr",
        "alpha3": "kau"
    },
    {
        "name": {
            "en": "Kazakh",
            "sk": "Kazaština"
        },
        "alpha2": "kk",
        "alpha3": "kaz"
    },
    {
        "name": {
            "en": "Khmer",
            "sk": "Kmérčina"
        },
        "alpha2": "km",
        "alpha3": "khm"
    },
    {
        "name": {
            "en": "Kikuyu",
            "sk": "Kikujčina"
        },
        "alpha2": "ki",
        "alpha3": "kik"
    },
    {
        "name": {
            "en": "Kinyarwanda",
            "sk": "Kinyarwanda"
        },
        "alpha2": "rw",
        "alpha3": "kin"
    },
    {
        "name": {
            "en": "Kirghiz",
            "sk": "Kirgizština"
        },
        "alpha2": "ky",
        "alpha3": "kir"
    },
    {
        "name": {
            "en": "Komi",
            "sk": "Komi"
        },
        "alpha2": "kv",
        "alpha3": "kom"
    },
    {
        "name": {
            "en": "Kongo",
            "sk": "Kongo"
        },
        "alpha2": "kg",
        "alpha3": "kon"
    },
    {
        "name": {
            "en": "Korean",
            "sk": "Kórejčina"
        },
        "alpha2": "ko",
        "alpha3": "kor"
    },
    {
        "name": {
            "en": "Kuanyama",
            "sk": "Kuanyama"
        },
        "alpha2": "kj",
        "alpha3": "kua"
    },
    {
        "name": {
            "en": "Kurdish",
            "sk": "Kurdčina"
        },
        "alpha2": "ku",
        "alpha3": "kur"
    },
    {
        "name": {
            "en": "Lao",
            "sk": "Laoština"
        },
        "alpha2": "lo",
        "alpha3": "lao"
    },
    {
        "name": {
            "en": "Latin",
            "sk": "Latinčina"
        },
        "alpha2": "la",
        "alpha3": "lat"
    },
    {
        "name": {
            "en": "Latvian",
            "sk": "Lotyština"
        },
        "alpha2": "lv",
        "alpha3": "lav"
    },
    {
        "name": {
            "en": "Limburgan",
            "sk": "Limburčina"
        },
        "alpha2": "li",
        "alpha3": "lim"
    },
    {
        "name": {
            "en": "Lingala",
            "sk": "Lingala"
        },
        "alpha2": "ln",
        "alpha3": "lin"
    },
    {
        "name": {
            "en": "Lithuanian",
            "sk": "Litovčina"
        },
        "alpha2": "lt",
        "alpha3": "lit"
    },
    {
        "name": {
            "en": "Luxembourgish",
            "sk": "Luxemburčina"
        },
        "alpha2": "lb",
        "alpha3": "ltz"
    },
    {
        "name": {
            "en": "Luba-Katanga",
            "sk": "Luba-Katanga"
        },
        "alpha2": "lu",
        "alpha3": "lub"
    },
    {
        "name": {
            "en": "Ganda",
            "sk": "Ganda"
        },
        "alpha2": "lg",
        "alpha3": "lug"
    },
    {
        "name": {
            "en": "Marshallese",
            "sk": "Marshallčina"
        },
        "alpha2": "mh",
        "alpha3": "mah"
    },
    {
        "name": {
            "en": "Malayalam",
            "sk": "Malajálamčina"
        },
        "alpha2": "ml",
        "alpha3": "mal"
    },
    {
        "name": {
            "en": "Marathi",
            "sk": "Maráthčina"
        },
        "alpha2": "mr",
        "alpha3": "mar"
    },
    {
        "name": {
            "en": "Macedonian",
            "sk": "Macedónčina"
        },
        "alpha2": "mk",
        "alpha3": "mkd"
    },
    {
        "name": {
            "en": "Malagasy",
            "sk": "Malgaština"
        },
        "alpha2": "mg",
        "alpha3": "mlg"
    },
    {
        "name": {
            "en": "Maltese",
            "sk": "Maltčina"
        },
        "alpha2": "mt",
        "alpha3": "mlt"
    },
    {
        "name": {
            "en": "Mongolian",
            "sk": "Mongolčina"
        },
        "alpha2": "mn",
        "alpha3": "mon"
    },
    {
        "name": {
            "en": "Maori",
            "sk": "Maorčina"
        },
        "alpha2": "mi",
        "alpha3": "mri"
    },
    {
        "name": {
            "en": "Malay (macrolanguage)",
            "sk": "Malajčina"
        },
        "alpha2": "ms",
        "alpha3": "msa"
    },
    {
        "name": {
            "en": "Burmese",
            "sk": "Barmčina"
        },
        "alpha2": "my",
        "alpha3": "mya"
    },
    {
        "name": {
            "en": "Nauru",
            "sk": "Naurčina"
        },
        "alpha2": "na",
        "alpha3": "nau"
    },
    {
        "name": {
            "en": "Navajo",
            "sk": "Navajo"
        },
        "alpha2": "nv",
        "alpha3": "nav"
    },
    {
        "name": {
            "en": "South Ndebele",
            "sk": "Južná Ndebelčina"
        },
        "alpha2": "nr",
        "alpha3": "nbl"
    },
    {
        "name": {
            "en": "North Ndebele",
            "sk": "Severná Ndebelčina"
        },
        "alpha2": "nd",
        "alpha3": "nde"
    },
    {
        "name": {
            "en": "Ndonga",
            "sk": "Ndonga"
        },
        "alpha2": "ng",
        "alpha3": "ndo"
    },
    {
        "name": {
            "en": "Nepali (macrolanguage)",
            "sk": "Nepálčina"
        },
        "alpha2": "ne",
        "alpha3": "nep"
    },
    {
        "name": {
            "en": "Dutch",
            "sk": "Holandčina"
        },
        "alpha2": "nl",
        "alpha3": "nld"
    },
    {
        "name": {
            "en": "Norwegian Nynorsk",
            "sk": "Nórska Nynorsk"
        },
        "alpha2": "nn",
        "alpha3": "nno"
    },
    {
        "name": {
            "en": "Norwegian Bokmål",
            "sk": "Nórska Bokmål"
        },
        "alpha2": "nb",
        "alpha3": "nob"
    },
    {
        "name": {
            "en": "Norwegian",
            "sk": "Nórčina"
        },
        "alpha2": "no",
        "alpha3": "nor"
    },
    {
        "name": {
            "en": "Nyanja",
            "sk": "Ňanja"
        },
        "alpha2": "ny",
        "alpha3": "nya"
    },
    {
        "name": {
            "en": "Occitan (post 1500)",
            "sk": "Okcitánčina"
        },
        "alpha2": "oc",
        "alpha3": "oci"
    },
    {
        "name": {
            "en": "Ojibwa",
            "sk": "Ojibwa"
        },
        "alpha2": "oj",
        "alpha3": "oji"
    },
    {
        "name": {
            "en": "Oriya (macrolanguage)",
            "sk": "Orijčina"
        },
        "alpha2": "or",
        "alpha3": "ori"
    },
    {
        "name": {
            "en": "Oromo",
            "sk": "Oromčina"
        },
        "alpha2": "om",
        "alpha3": "orm"
    },
    {
        "name": {
            "en": "Ossetian",
            "sk": "Osetčina"
        },
        "alpha2": "os",
        "alpha3": "oss"
    },
    {
        "name": {
            "en": "Panjabi",
            "sk": "Pandžábčina"
        },
        "alpha2": "pa",
        "alpha3": "pan"
    },
    {
        "name": {
            "en": "Pali",
            "sk": "Páli"
        },
        "alpha2": "pi",
        "alpha3": "pli"
    },
    {
        "name": {
            "en": "Polish",
            "sk": "Poľština"
        },
        "alpha2": "pl",
        "alpha3": "pol"
    },
    {
        "name": {
            "en": "Portuguese",
            "sk": "Portugalčina"
        },
        "alpha2": "pt",
        "alpha3": "por"
    },
    {
        "name": {
            "en": "Pushto",
            "sk": "Paštčina"
        },
        "alpha2": "ps",
        "alpha3": "pus"
    },
    {
        "name": {
            "en": "Quechua",
            "sk": "Kečuánčina"
        },
        "alpha2": "qu",
        "alpha3": "que"
    },
    {
        "name": {
            "en": "Romansh",
            "sk": "Rétorománčina"
        },
        "alpha2": "rm",
        "alpha3": "roh"
    },
    {
        "name": {
            "en": "Romanian",
            "sk": "Rumunčina"
        },
        "alpha2": "ro",
        "alpha3": "ron"
    },
    {
        "name": {
            "en": "Rundi",
            "sk": "Rundi"
        },
        "alpha2": "rn",
        "alpha3": "run"
    },
    {
        "name": {
            "en": "Russian",
            "sk": "Ruština"
        },
        "alpha2": "ru",
        "alpha3": "rus"
    },
    {
        "name": {
            "en": "Sango",
            "sk": "Sango"
        },
        "alpha2": "sg",
        "alpha3": "sag"
    },
    {
        "name": {
            "en": "Sanskrit",
            "sk": "Sanskrit"
        },
        "alpha2": "sa",
        "alpha3": "san"
    },
    {
        "name": {
            "en": "Sinhala",
            "sk": "Sinhalčina"
        },
        "alpha2": "si",
        "alpha3": "sin"
    },
    {
        "name": {
            "en": "Slovak",
            "sk": "Slovenčina"
        },
        "alpha2": "sk",
        "alpha3": "slk"
    },
    {
        "name": {
            "en": "Slovenian",
            "sk": "Slovinčina"
        },
        "alpha2": "sl",
        "alpha3": "slv"
    },
    {
        "name": {
            "en": "Northern Sami",
            "sk": "Severná Sámčina"
        },
        "alpha2": "se",
        "alpha3": "sme"
    },
    {
        "name": {
            "en": "Samoan",
            "sk": "Samojčina"
        },
        "alpha2": "sm",
        "alpha3": "smo"
    },
    {
        "name": {
            "en": "Shona",
            "sk": "Šončina"
        },
        "alpha2": "sn",
        "alpha3": "sna"
    },
    {
        "name": {
            "en": "Sindhi",
            "sk": "Sindhčina"
        },
        "alpha2": "sd",
        "alpha3": "snd"
    },
    {
        "name": {
            "en": "Somali",
            "sk": "Somálčina"
        },
        "alpha2": "so",
        "alpha3": "som"
    },
    {
        "name": {
            "en": "Southern Sotho",
            "sk": "Južná Sotština"
        },
        "alpha2": "st",
        "alpha3": "sot"
    },
    {
        "name": {
            "en": "Spanish",
            "sk": "Španielčina"
        },
        "alpha2": "es",
        "alpha3": "spa"
    },
    {
        "name": {
            "en": "Albanian",
            "sk": "Albánčina"
        },
        "alpha2": "sq",
        "alpha3": "sqi"
    },
    {
        "name": {
            "en": "Sardinian",
            "sk": "Sardínčina"
        },
        "alpha2": "sc",
        "alpha3": "srd"
    },
    {
        "name": {
            "en": "Serbian",
            "sk": "Srbčina"
        },
        "alpha2": "sr",
        "alpha3": "srp"
    },
    {
        "name": {
            "en": "Swati",
            "sk": "Swati"
        },
        "alpha2": "ss",
        "alpha3": "ssw"
    },
    {
        "name": {
            "en": "Sundanese",
            "sk": "Sundčina"
        },
        "alpha2": "su",
        "alpha3": "sun"
    },
    {
        "name": {
            "en": "Swahili (macrolanguage)",
            "sk": "Swahilčina"
        },
        "alpha2": "sw",
        "alpha3": "swa"
    },
    {
        "name": {
            "en": "Swedish",
            "sk": "Švédčina"
        },
        "alpha2": "sv",
        "alpha3": "swe"
    },
    {
        "name": {
            "en": "Tahitian",
            "sk": "Tahitčina"
        },
        "alpha2": "ty",
        "alpha3": "tah"
    },
    {
        "name": {
            "en": "Tamil",
            "sk": "Tamilčina"
        },
        "alpha2": "ta",
        "alpha3": "tam"
    },
    {
        "name": {
            "en": "Tatar",
            "sk": "Tatárčina"
        },
        "alpha2": "tt",
        "alpha3": "tat"
    },
    {
        "name": {
            "en": "Telugu",
            "sk": "Telugčina"
        },
        "alpha2": "te",
        "alpha3": "tel"
    },
    {
        "name": {
            "en": "Tajik",
            "sk": "Tadžičtina"
        },
        "alpha2": "tg",
        "alpha3": "tgk"
    },
    {
        "name": {
            "en": "Tagalog",
            "sk": "Tagalog"
        },
        "alpha2": "tl",
        "alpha3": "tgl"
    },
    {
        "name": {
            "en": "Thai",
            "sk": "Thajčina"
        },
        "alpha2": "th",
        "alpha3": "tha"
    },
    {
        "name": {
            "en": "Tigrinya",
            "sk": "Tigrinčina"
        },
        "alpha2": "ti",
        "alpha3": "tir"
    },
    {
        "name": {
            "en": "Tonga (Tonga Islands)",
            "sk": "Tongčina"
        },
        "alpha2": "to",
        "alpha3": "ton"
    },
    {
        "name": {
            "en": "Tswana",
            "sk": "Tswančina"
        },
        "alpha2": "tn",
        "alpha3": "tsn"
    },
    {
        "name": {
            "en": "Tsonga",
            "sk": "Tsongčina"
        },
        "alpha2": "ts",
        "alpha3": "tso"
    },
    {
        "name": {
            "en": "Turkmen",
            "sk": "Turkménčina"
        },
        "alpha2": "tk",
        "alpha3": "tuk"
    },
    {
        "name": {
            "en": "Turkish",
            "sk": "Turečtina"
        },
        "alpha2": "tr",
        "alpha3": "tur"
    },
    {
        "name": {
            "en": "Twi",
            "sk": "Twi"
        },
        "alpha2": "tw",
        "alpha3": "twi"
    },
    {
        "name": {
            "en": "Uighur",
            "sk": "Ujgurčina"
        },
        "alpha2": "ug",
        "alpha3": "uig"
    },
    {
        "name": {
            "en": "Ukrainian",
            "sk": "Ukrajinčina"
        },
        "alpha2": "uk",
        "alpha3": "ukr"
    },
    {
        "name": {
            "en": "Urdu",
            "sk": "Urdčina"
        },
        "alpha2": "ur",
        "alpha3": "urd"
    },
    {
        "name": {
            "en": "Uzbek",
            "sk": "Uzbečtina"
        },
        "alpha2": "uz",
        "alpha3": "uzb"
    },
    {
        "name": {
            "en": "Venda",
            "sk": "Venda"
        },
        "alpha2": "ve",
        "alpha3": "ven"
    },
    {
        "name": {
            "en": "Vietnamese",
            "sk": "Vietnamčina"
        },
        "alpha2": "vi",
        "alpha3": "vie"
    },
    {
        "name": {
            "en": "Volapük",
            "sk": "Volapük"
        },
        "alpha2": "vo",
        "alpha3": "vol"
    },
    {
        "name": {
            "en": "Walloon",
            "sk": "Valónčina"
        },
        "alpha2": "wa",
        "alpha3": "wln"
    },
    {
        "name": {
            "en": "Wolof",
            "sk": "Wolofčina"
        },
        "alpha2": "wo",
        "alpha3": "wol"
    },
    {
        "name": {
            "en": "Xhosa",
            "sk": "Xhoština"
        },
        "alpha2": "xh",
        "alpha3": "xho"
    },
    {
        "name": {
            "en": "Yiddish",
            "sk": "Jidiš"
        },
        "alpha2": "yi",
        "alpha3": "yid"
    },
    {
        "name": {
            "en": "Yoruba",
            "sk": "Jorubčina"
        },
        "alpha2": "yo",
        "alpha3": "yor"
    },
    {
        "name": {
            "en": "Zhuang",
            "sk": "Čuangčina"
        },
        "alpha2": "za",
        "alpha3": "zha"
    },
    {
        "name": {
            "en": "Chinese",
            "sk": "Čínština"
        },
        "alpha2": "zh",
        "alpha3": "zho"
    },
    {
        "name": {
            "en": "Zulu",
            "sk": "Zulčina"
        },
        "alpha2": "zu",
        "alpha3": "zul"
    }
]

export type AcceptedLanguage = 'en' | 'sk';

export function getLanguage(alpha: string) {
    return languages.find(lang => lang.alpha2 === alpha || lang.alpha3 === alpha);
}

export function getLanguages(locale: AcceptedLanguage): ILanguage[] {
    return languages.map(lang => ({
        id: lang.alpha2 || lang.alpha3,
        name: lang.name[locale] || lang.name.en,
        alpha2: lang.alpha2,
        alpha3: lang.alpha3
    })).sort((a, b) => a.name.localeCompare(b.name));
}