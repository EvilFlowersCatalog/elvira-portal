import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch, FiUser, FiFileText, FiBook } from 'react-icons/fi';
import { HiOutlineMail } from 'react-icons/hi';
import { RiAiGenerate } from 'react-icons/ri';
import { BsDiscord } from 'react-icons/bs';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { LoansIcon, LibraryIcon } from '../../components/header/navbar/NavbarIcons';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

interface TopicCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
}

const faqItems = [
  { q: 'Koľko kníh si môžem naraz vypožičať?', a: 'Každý používateľ môže mať súčasne požičané najviac 3 knihy.' },
  { q: 'Ako si môžem predĺžiť výpožičku?', a: 'Výpožičku môžete predĺžiť najviac 2-krát, vždy o pôvodne zvolenú dobu, cez sekciu Výpožičky v menu.' },
  { q: 'Môžem si rezervovať knihu, ktorá nie je dostupná?', a: 'Áno, ak sú všetky kópie požičané, môžete sa zaradiť do čakacej listiny. Keď príde rad na vás, dostanete e-mailovú notifikáciu.' },
  { q: 'Ako fungujú fyzické výpožičky?', a: 'Fyzické výpožičky nie sú momentálne podporované. Elvira poskytuje digitálne výpožičky vo formáte PDF.' },
  { q: 'Kde nájdem knižnicu?', a: 'Knižnica STU sa nachádza v priestoroch Slovenskej technickej univerzity. Presné informácie nájdete na webstránke STU.' },
  { q: 'Koľko stojí zápis do knižnice?', a: 'Informácie o poplatkoch za zápis do knižnice nájdete na webstránke knižnice STU.' },
  { q: 'Ako funguje AI Asistent? Potrebujem svoj vlastný API kľúč?', a: 'AI Asistent využíva jazykový model na pomoc s vyhľadávaním a štúdiom. API kľúč si môžete nastaviť v sekcii AI Používatelia v administrácii.' },
  { q: 'Prečo Elvira nikdy nefunguje?', a: 'Ak narazíte na problémy, skúste obnoviť stránku alebo nás kontaktujte na elvira-mail@stuba.sk.' },
];

const Help = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { specialNavigation } = useAppContext();

  const topicCards: TopicCard[] = [
    {
      title: 'Knihy',
      description: 'Informácie o knihách a licenciách v našom katalógu.',
      icon: <LibraryIcon size={30} />,
    },
    {
      title: 'Vyhľadávanie v katalógu',
      description: 'Všetko o keyword a sémantickom vyhľadávaní v katalógu kníh.',
      icon: <FiSearch size={30} />,
    },
    {
      title: 'Výpožičky a rezervácie',
      description: 'Všetko o výpožičkách a rezerváciách kníh.',
      icon: <LoansIcon size={30} />,
      path: NAVIGATION_PATHS.helpLoans,
    },
    {
      title: 'PDF Viewer',
      description: 'Informácie o používaní PDF čítačky a riešenie problémov.',
      icon: <FiFileText size={30} />,
    },
    {
      title: 'AI Asistent',
      description: 'Využite AI Asistenta pri vyhľadávaní, učení, prehľadávaní kníh...',
      icon: <RiAiGenerate size={30} />,
    },
    {
      title: 'Profil',
      description: 'Spravujte svoj účet, nastavenia a notifikácie.',
      icon: <FiUser size={30} />,
    },
  ];

  return (
    <div className="h-screen overflow-auto">
      <Breadcrumb />

      {/* Hero header */}
      <div className="relative bg-primaryLight overflow-hidden flex flex-col items-center justify-end pb-6 pt-10" style={{ minHeight: 200 }}>
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
        <h1 className="relative text-3xl font-extrabold text-secondary text-center mb-6 leading-tight">
          Dokumentácia a často kladené otázky
        </h1>
        <div className="relative w-full max-w-2xl mx-auto px-4">
          <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-2 gap-3">
            <FiSearch size={18} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 font-light"
              placeholder="Hľadať v dokumentácii..."
            />
            <button
              className="flex items-center gap-1.5 bg-primaryLight text-primary text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"
              onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.aiChatHistory)}
            >
              <RiAiGenerate size={14} />
              AI Asistent
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Topic cards row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {topicCards.slice(0, 3).map((card) => (
            <button
              key={card.title}
              className={`bg-white rounded-xl shadow p-5 flex flex-col text-left transition-shadow hover:shadow-md ${card.path ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={card.path ? (e) => specialNavigation(e, card.path!) : undefined}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-base text-secondary">{card.title}</span>
                <span className="text-secondary opacity-70">{card.icon}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>

        {/* Topic cards row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {topicCards.slice(3).map((card) => (
            <button
              key={card.title}
              className={`bg-white rounded-xl shadow p-5 flex flex-col text-left transition-shadow hover:shadow-md ${card.path ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={card.path ? (e) => specialNavigation(e, card.path!) : undefined}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-base text-secondary">{card.title}</span>
                <span className="text-secondary opacity-70">{card.icon}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-3xl font-bold text-secondary text-center mb-6">FAQ</h2>
        <div className="flex flex-col gap-3 mb-12">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-sm text-secondary">{item.q}</span>
                <span className="ml-3 shrink-0 w-6 h-6 flex items-center justify-center bg-lightGray rounded-full">
                  {openFaq === i ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-primaryLight rounded-xl shadow-sm p-8 text-center">
          <h3 className="text-xl font-bold text-secondary mb-2">Kontakt</h3>
          <p className="text-sm text-gray-600 mb-6">
            V prípade problémov alebo otázok nás môžete kontaktovať tu:
          </p>
          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <HiOutlineMail size={20} className="text-secondary" />
              elvira-mail@stuba.sk
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FiBook size={20} className="text-secondary" />
              ais-mail@is.stuba.sk
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <BsDiscord size={20} className="text-secondary" />
              elviradiscord
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
