import { FiSearch } from 'react-icons/fi';
import { RiAiGenerate } from 'react-icons/ri';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

const tocLoans = [
  { label: 'Ako si požičať knihu', id: 'pozicanie' },
  { label: 'Formát a čítačka', id: 'format' },
  { label: 'Prístupová fráza', id: 'pristupova-fraza' },
  { label: 'Doba výpožičky a predĺženie', id: 'doba-vypozicky' },
  { label: 'Vrátenie knihy', id: 'vratenie' },
];

const tocReservations = [
  { label: 'Ako si rezervovať knihu', id: 'rezervacia' },
  { label: 'Ako funguje poradie čakajúcich', id: 'poradie' },
  { label: 'Notifikácie a výpožička', id: 'notifikacie' },
  { label: 'Zrušenie rezervácie', id: 'zrusenie' },
  { label: 'Počet súbežných výpožičiek a rezervácií', id: 'pocet-vypoziciek' },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const HelpLoans = () => {
  const { specialNavigation } = useAppContext();

  return (
    <div className="h-screen overflow-auto">
      <Breadcrumb />

      {/* Hero header */}
      <div className="relative bg-primaryLight overflow-hidden flex flex-col items-center justify-end pb-6 pt-10" style={{ minHeight: 160 }}>
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-primary opacity-10 blur-3xl pointer-events-none" />
        <h1 className="relative text-3xl font-extrabold text-secondary text-center mb-6 leading-tight">
          Výpožičky a rezervácie
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

      <div className="px-6 py-8 max-w-5xl mx-auto flex gap-6 items-start">
        {/* Main article */}
        <div className="flex-1 bg-white rounded-lg p-6 min-w-0">
          {/* Výpožičky */}
          <h2 className="text-xl font-bold text-secondary mb-4">Výpožičky</h2>

          <h3 id="pozicanie" className="text-base font-semibold text-secondary mb-2">Ako si požičať knihu</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Knihu si môžete požičať priamo z knižnice. Na stránke knihy kliknite na tlačidlo <strong>Požičať</strong> — ak sú dostupné voľné kópie, zobrazí sa vám dialóg na potvrdenie výpožičky. V ňom si zvolíte dobu výpožičky (1 alebo 2 týždne) a požičanie potvrdíte.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Po potvrdení vám systém vygeneruje odkaz na stiahnutie súboru. Odkaz aj kľúč na odomknutie nájdete vo svojom profile v sekcii Výpožičky.
          </p>

          <h3 id="format" className="text-base font-semibold text-secondary mb-2">Formát a čítačka</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Knihy sú dostupné vo formáte PDF. Na ich otvorenie odporúčame aplikáciu <a href="https://thorium.edrlab.org/en/" target="_blank" rel="noopener noreferrer" className="underline">Thorium Reader</a>, ktorá je bezplatná a dostupná pre Windows, macOS aj Linux. Pri prvom otvorení súboru vás čítačka požiada o zadanie prístupovej frázy na odomknutie.
          </p>

          <h3 id="pristupova-fraza" className="text-base font-semibold text-secondary mb-2">Prístupová fráza</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Prístupová fráza je heslo, ktorým sú chránené všetky stiahnuté súbory. Nastavíte si ho pri prvej výpožičke — platí pre všetky vaše budúce výpožičky, nie je teda potrebné ho meniť pri každej knihe.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Kľúč si dôkladne uložte. Nie je možné ho obnoviť. Ak ho zabudnete, už stiahnuté súbory nebude možné otvoriť. Nová výpožička tej istej knihy tento problém nevyrieši — súbory sú vždy chránené vaším aktuálnym kľúčom nastaveným v čase stiahnutia.
          </p>

          <h3 id="doba-vypozicky" className="text-base font-semibold text-secondary mb-2">Doba výpožičky a predĺženie</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Knihu si môžete požičať na <strong>1</strong> alebo <strong>2 týždne</strong>. Po uplynutí doby výpožičky sa prístup k súboru automaticky ukončí — nie sú účtované žiadne pokuty ani poplatky.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Výpožičku môžete predĺžiť najviac 2-krát, vždy o pôvodne zvolenú dobu. Predĺženie nie je možné, ak na knihu čakajú iní používatelia — v takom prípade je potrebné knihu vrátiť včas, aby sa dostala k ďalšiemu čitateľovi.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Predĺženie odporúčame urobiť s dostatočným predstihom. Ak sa blíži koniec výpožičky a predĺženie nie je dostupné, systém vás na to upozorní.
          </p>

          <h3 id="vratenie" className="text-base font-semibold text-secondary mb-2">Vrátenie knihy</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            Kniha sa vráti automaticky po uplynutí doby výpožičky. Ak ju chcete vrátiť skôr, môžete tak urobiť kedykoľvek cez sekciu Výpožičky v menu. Skoré vrátenie uvoľní kópiu pre ďalších čitateľov. Váš stiahnutý súbor tým nebude zmazaný, no pri ďalšom otvorení v čítačke už nebude prístupný.
          </p>

          {/* Rezervácie */}
          <h2 className="text-xl font-bold text-secondary mb-4">Rezervácie</h2>

          <h3 id="rezervacia" className="text-base font-semibold text-secondary mb-2">Ako si rezervovať knihu</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Ak sú všetky kópie knihy práve požičané, nemôžete si ju okamžite vypožičať. V takom prípade si môžete zarezervovať miesto v čakacej listine. Akonáhle príde rad na vás, dostanete notifikáciu a budete môcť knihu vypožičať.
          </p>

          <h3 id="poradie" className="text-base font-semibold text-secondary mb-2">Ako funguje poradie čakajúcich</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Používatelia sú v čakacej listine zoradení podľa toho, kedy si rezerváciu vytvorili. Na stránke knihy vidíte váš aktuálny počet čakajúcich pred vami aj odhadovaný dátum dostupnosti.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Odhadovaný dátum je orientačný — závisí od toho, kedy aktuálni čitatelia knihy vrátia, či si predĺžia výpožičku, alebo či niektorý z čakajúcich pred vami rezerváciu zruší.
          </p>

          <h3 id="notifikacie" className="text-base font-semibold text-secondary mb-2">Notifikácie a výpožička</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Keď sa uvoľní kópia a príde rad na vás, dostanete e-mailovú notifikáciu. Od jej doručenia máte <strong>3 dni</strong> na to, aby ste si knihu vypožičali. Ak v tejto lehote nereagujete, vaša rezervácia vyprší a kópia prejde na ďalšieho čakajúceho. O miesto v čakacej listine tým prídete — v prípade záujmu sa budete musieť zaradiť znova na koniec.
          </p>

          <h3 id="zrusenie" className="text-base font-semibold text-secondary mb-2">Zrušenie rezervácie</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Rezerváciu môžete zrušiť kedykoľvek bez poplatku cez sekciu Výpožičky v menu. Po zrušení sa vaše miesto v čakacej listine neuloží — ďalší čakajúci postúpi na vaše miesto.
          </p>

          <h3 id="pocet-vypoziciek" className="text-base font-semibold text-secondary mb-2">Počet súbežných výpožičiek a rezervácií</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Každý používateľ môže mať súčasne požičané najviac <strong>3 knihy</strong>. Počet aktívnych rezervácií nie je obmedzený, no po dosiahnutí limitu výpožičiek bude potrebné niektorú z kníh vrátiť skôr, než bude možné prevziať novú rezerváciu.
          </p>
        </div>

        {/* Sticky TOC */}
        <div className="w-56 shrink-0 sticky top-0">
          <div className="rounded-lg p-4">
            <p className="text-xs font-bold text-secondary mb-3">Výpožičky</p>
            <ul className="space-y-1.5 mb-6">
              {tocLoans.map((item) => (
                <li key={item.id} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="mt-1 shrink-0">•</span>
                  <button
                    className="text-left hover:text-primary transition-colors cursor-pointer"
                    onClick={() => scrollTo(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs font-bold text-secondary mb-3">Rezervácie</p>
            <ul className="space-y-1.5">
              {tocReservations.map((item) => (
                <li key={item.id} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="mt-1 shrink-0">•</span>
                  <button
                    className="text-left hover:text-primary transition-colors cursor-pointer"
                    onClick={() => scrollTo(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpLoans;
