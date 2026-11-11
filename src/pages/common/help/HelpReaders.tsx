import HelpLayout, { TocSection } from './HelpLayout';
import { HelpCode, HelpFigure, HelpH2, HelpH3, HelpList, HelpNote, HelpP, HelpSteps } from './HelpTypography';
import useCurrentCatalog from '../../../hooks/api/catalogs/useCurrentCatalog';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';

const THORIUM_URL = 'https://thorium.edrlab.org/';
const CALIBRE_URL = 'https://calibre-ebook.com/download';
const PLUGIN_RELEASE_URL = 'https://github.com/EvilFlowersCatalog/calibre-evilflowers/releases/latest';

const IMG = '/assets/static/help';

const toc: TocSection[] = [
  {
    heading: 'Čítačky',
    items: [
      { label: 'Ktorú aplikáciu použiť', id: 'prehlad' },
    ],
  },
  {
    heading: 'Readium LCP a Thorium',
    items: [
      { label: 'Čo je Readium LCP', id: 'lcp' },
      { label: 'Inštalácia Thorium Reader', id: 'thorium-instalacia' },
      { label: 'Otvorenie výpožičky', id: 'thorium-vypozicka' },
      { label: 'Vrátenie a koniec výpožičky', id: 'thorium-vratenie' },
    ],
  },
  {
    heading: 'OPDS katalóg',
    items: [
      { label: 'Čo je OPDS', id: 'opds' },
      { label: 'Adresy katalógu', id: 'opds-adresy' },
      { label: 'Pridanie do Thorium', id: 'opds-thorium' },
      { label: 'Iné OPDS čítačky', id: 'opds-ine' },
    ],
  },
  {
    heading: 'Calibre',
    items: [
      { label: 'Doplnok EvilFlowers pre Calibre', id: 'calibre' },
      { label: 'Inštalácia doplnku', id: 'calibre-instalacia' },
      { label: 'Prihlásenie a nastavenia', id: 'calibre-nastavenia' },
      { label: 'Prehliadanie katalógu', id: 'calibre-katalog' },
      { label: 'Synchronizácia', id: 'calibre-sync' },
      { label: 'Zvýraznenia z čítačky', id: 'calibre-zvyraznenia' },
    ],
  },
  {
    heading: 'Pomoc',
    items: [{ label: 'Riešenie problémov', id: 'problemy' }],
  },
];

const HelpReaders = () => {
  const { specialNavigation } = useAppContext();
  const { data: catalog } = useCurrentCatalog();

  const baseUrl = (import.meta.env.ELVIRA_BASE_URL ?? '').replace(/\/+$/, '');
  // Signed out, the catalog detail is not readable: show a placeholder the reader replaces.
  const catalogName = catalog?.url_name ?? '<katalóg>';
  const opds2 = `${baseUrl}/opds/v2/${catalogName}/`;
  const opds1 = `${baseUrl}/opds/v1.2/${catalogName}`;

  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
      {label}
    </a>
  );
  const internal = (path: string, label: string) => (
    <button className="underline hover:text-primary" onClick={(e) => specialNavigation(e, path)}>
      {label}
    </button>
  );

  return (
    <HelpLayout title="Čítačky, OPDS a Calibre" toc={toc}>
      {/* Prehľad */}
      <HelpH2 first>Čítačky</HelpH2>

      <HelpH3 id="prehlad">Ktorú aplikáciu použiť</HelpH3>
      <HelpP>Publikácie z Elviry môžete čítať a spravovať v rôznych aplikáciách. Výber závisí od toho, o akú knihu ide:</HelpP>
      <HelpList
        items={[
          <><strong>Voľne dostupné knihy</strong> čítate priamo v portáli v PDF čítačke (tlačidlo Čítať). Nič nemusíte inštalovať. Viac v časti {internal(NAVIGATION_PATHS.helpViewer, 'PDF Viewer')}.</>,
          <><strong>Chránené knihy (výpožičky)</strong> sú zabezpečené technológiou Readium LCP. Otvoríte ich v aplikácii <strong>Thorium Reader</strong> alebo v inej čítačke s podporou LCP.</>,
          <><strong>OPDS katalóg</strong> vám umožní prehliadať a vyhľadávať v knižnici priamo z čítačky, bez otvárania portálu.</>,
          <><strong>Calibre</strong> s doplnkom EvilFlowers je vhodný na správu vlastnej knižnice: stiahne si voľne dostupné knihy aj s metadátami a obálkami a prenesie vaše zvýraznenia.</>,
        ]}
      />

      {/* Readium LCP */}
      <HelpH2>Readium LCP a Thorium</HelpH2>

      <HelpH3 id="lcp">Čo je Readium LCP</HelpH3>
      <HelpP>
        Readium LCP (Licensed Content Protection) je otvorený štandard ochrany elektronických kníh, ktorý spravuje
        organizácia EDRLab. Pri výpožičke nedostanete samotnú knihu, ale malý <strong>licenčný súbor</strong> s príponou{' '}
        <HelpCode>.lcpl</HelpCode>. Čítačka si podľa neho knihu stiahne a odomkne ju vašou{' '}
        <strong>prístupovou frázou</strong>. Licencia platí do konca výpožičky, potom sa kniha v čítačke zamkne.
      </HelpP>
      <HelpNote>
        Prístupovú frázu si nastavíte v {internal(NAVIGATION_PATHS.profile, 'Profile')} ešte pred prvou výpožičkou.
        Platí pre všetky vaše výpožičky. Nedá sa obnoviť, preto si ju dobre uložte. Podrobnosti nájdete v časti{' '}
        {internal(NAVIGATION_PATHS.helpLoans, 'Výpožičky a rezervácie')}.
      </HelpNote>

      <HelpH3 id="thorium-instalacia">Inštalácia Thorium Reader</HelpH3>
      <HelpP>
        Thorium Reader je bezplatná čítačka od EDRLab pre Windows, macOS a Linux. Podporuje Readium LCP aj OPDS katalógy.
      </HelpP>
      <HelpSteps
        items={[
          <>Stiahnite si inštalačný balík zo stránky {link(THORIUM_URL, 'thorium.edrlab.org')} pre váš operačný systém.</>,
          <>Nainštalujte a raz spustite aplikáciu. Pri prvom spustení sa zaregistruje ako aplikácia pre odkazy <HelpCode>thorium://</HelpCode> a súbory <HelpCode>.lcpl</HelpCode>. Vďaka tomu vie portál otvoriť výpožičku priamo v nej.</>,
        ]}
      />

      <HelpH3 id="thorium-vypozicka">Otvorenie výpožičky</HelpH3>
      <HelpSteps
        items={[
          <>Požičajte si knihu tlačidlom <strong>Požičať</strong> v jej detaile.</>,
          <>Hneď po potvrdení môžete zvoliť <strong>Otvoriť v Thorium</strong>. Neskôr nájdete výpožičku v sekcii {internal(NAVIGATION_PATHS.loans, 'Výpožičky')}, kde kliknite na <strong>Stiahnuť</strong>.</>,
          <>Portál sa pokúsi otvoriť Thorium. Ak sa nič nestane, kliknite v oznámení na <strong>Neotvorilo sa v Thorium? Stiahnuť súbor priamo</strong>. Stiahnutý súbor <HelpCode>.lcpl</HelpCode> potom pretiahnite do okna Thorium, alebo ho v Thorium otvorte cez import.</>,
          <>Thorium si stiahne knihu a vypýta si <strong>prístupovú frázu</strong>. Zadajte frázu nastavenú v profile. Pri ďalšom otvorení tej istej knihy na tom istom zariadení ju už zadávať nemusíte.</>,
        ]}
      />
      <HelpP>
        Výpožička sa aktivuje až vtedy, keď ju otvoríte v čítačke. Kým ju neotvoríte, portál ju zobrazuje ako pripravenú.
      </HelpP>

      <HelpH3 id="thorium-vratenie">Vrátenie a koniec výpožičky</HelpH3>
      <HelpP>
        Po uplynutí doby výpožičky Thorium knihu sám zamkne. Nič nemusíte mazať ani vracať. Ak chcete knihu vrátiť
        skôr, urobte to v sekcii {internal(NAVIGATION_PATHS.loans, 'Výpožičky')}. Thorium sa o vrátení dozvie pri
        najbližšom otvorení knihy. Predĺženie výpožičky v portáli sa do Thorium prenesie rovnako, pri ďalšom otvorení
        knihy.
      </HelpP>

      {/* OPDS */}
      <HelpH2>OPDS katalóg</HelpH2>

      <HelpH3 id="opds">Čo je OPDS</HelpH3>
      <HelpP>
        OPDS (Open Publication Distribution System) je otvorený formát, ktorým knižnice sprístupňujú svoj katalóg
        čítačkám. Po pridaní katalógu Elviry do čítačky v nej môžete prehliadať zbierky, novinky a najčítanejšie
        tituly, vyhľadávať a otvárať voľne dostupné knihy. Uvidíte tam aj svoju poličku. Elvira poskytuje katalóg v
        dvoch verziách: <strong>OPDS 2.0</strong> (novší, odporúčaný pre Thorium) a <strong>OPDS 1.2</strong> (pre
        staršie čítačky).
      </HelpP>

      <HelpH3 id="opds-adresy">Adresy katalógu</HelpH3>
      <HelpList
        items={[
          <>OPDS 2.0: <HelpCode>{opds2}</HelpCode></>,
          <>OPDS 1.2: <HelpCode>{opds1}</HelpCode></>,
        ]}
      />
      {!catalog && (
        <HelpNote>
          Po prihlásení sa na tomto mieste zobrazia presné adresy pre váš katalóg. Údaj <HelpCode>{'<katalóg>'}</HelpCode>{' '}
          nahraďte skratkou katalógu.
        </HelpNote>
      )}
      <HelpP>
        Katalóg je prístupný len prihláseným čitateľom. Čítačka si pri prvom otvorení vypýta prihlasovacie údaje. Zadajte
        to isté <strong>používateľské meno a heslo</strong> ako pri prihlásení do portálu.
      </HelpP>
      <HelpP>
        K jednotlivým častiam katalógu sa dostanete aj priamo, keď za adresu OPDS 1.2 pridáte <HelpCode>/new</HelpCode>{' '}
        (novinky), <HelpCode>/popular</HelpCode> (najčítanejšie) alebo <HelpCode>/shelf</HelpCode> (vaša polička).
      </HelpP>

      <HelpH3 id="opds-thorium">Pridanie do Thorium</HelpH3>
      <HelpSteps
        items={[
          <>V Thorium otvorte časť <strong>Catalogs</strong> (Katalógy).</>,
          <>Zvoľte pridanie nového OPDS katalógu. Ako názov zadajte napríklad <HelpCode>Elvira</HelpCode> a ako adresu <HelpCode>{opds2}</HelpCode>.</>,
          <>Otvorte pridaný katalóg a prihláste sa svojím menom a heslom do portálu.</>,
          <>Chránenú knihu si môžete požičať priamo z katalógu. Výpožička sa započíta do limitu rovnako ako výpožička z portálu a uvidíte ju aj v sekcii {internal(NAVIGATION_PATHS.loans, 'Výpožičky')}.</>,
        ]}
      />

      <HelpH3 id="opds-ine">Iné OPDS čítačky</HelpH3>
      <HelpP>
        Katalóg funguje v každej čítačke, ktorá podporuje OPDS s prihlásením menom a heslom (HTTP Basic). Ak čítačka
        nevie OPDS 2.0, použite adresu OPDS 1.2. Chránené výpožičky však otvorí len čítačka s podporou Readium LCP.
        V ostatných čítačkách budú dostupné iba voľne dostupné knihy.
      </HelpP>

      {/* Calibre */}
      <HelpH2>Calibre</HelpH2>

      <HelpH3 id="calibre">Doplnok EvilFlowers pre Calibre</HelpH3>
      <HelpP>
        {link(CALIBRE_URL, 'Calibre')} je bezplatný správca elektronických kníh. Doplnok <strong>EvilFlowers for
        Calibre</strong> ho prepojí s katalógom Elviry. Môžete v ňom prehliadať katalóg, sťahovať knihy aj s metadátami a
        obálkami, spravovať svoju poličku a preniesť si zvýraznenia z PDF čítačky. Doplnok vyžaduje Calibre 7 alebo
        novší.
      </HelpP>
      <HelpNote>
        Chránené (LCP) výpožičky Calibre neotvorí. Na tie použite Thorium. Doplnok pracuje s knihami, ktoré si môžete
        stiahnuť voľne.
      </HelpNote>

      <HelpH3 id="calibre-instalacia">Inštalácia doplnku</HelpH3>
      <HelpSteps
        items={[
          <>Stiahnite si súbor <HelpCode>evilflowers-&lt;verzia&gt;.zip</HelpCode> z {link(PLUGIN_RELEASE_URL, 'poslednej verzie doplnku na GitHube')}. Súbor nerozbaľujte.</>,
          <>V Calibre otvorte <strong>Preferences → Plugins</strong> (Nastavenia → Doplnky) a zvoľte <strong>Load plugin from file</strong>. Vyberte stiahnutý ZIP súbor a inštaláciu potvrďte.</>,
          <>Calibre sa opýta, kam pridať tlačidlo <strong>EvilFlowers</strong>. Zvoľte hlavný panel nástrojov a Calibre reštartujte.</>,
        ]}
      />

      <HelpH3 id="calibre-nastavenia">Prihlásenie a nastavenia</HelpH3>
      <HelpSteps
        items={[
          <>V ponuke tlačidla EvilFlowers zvoľte <strong>Settings…</strong>.</>,
          <>Do poľa <strong>Server</strong> zadajte <HelpCode>{baseUrl}</HelpCode>.</>,
          <>Kliknite na <strong>Sign in…</strong> a prihláste sa svojím menom a heslom do portálu. Doplnok heslo použije len raz, na vytvorenie kľúča pre tento počítač. Samotné heslo si neukladá.</>,
          <>V poli <strong>Catalog</strong> vyberte katalóg{catalog ? <> <strong>{catalog.title}</strong></> : null}.</>,
          <>V poli <strong>Direction</strong> odporúčame zvoliť <strong>Download only</strong>. Doplnok potom knihy z katalógu len sťahuje a nikdy sa nepokúsi nahrať do katalógu knihy z vašej knižnice v Calibre.</>,
        ]}
      />
      <HelpFigure
        src={`${IMG}/calibre-settings-light.png`}
        darkSrc={`${IMG}/calibre-settings-dark.png`}
        alt="Nastavenia doplnku EvilFlowers v Calibre"
        caption="Nastavenia doplnku po prihlásení: server, katalóg a smer synchronizácie."
      />
      <HelpP>
        Tlačidlom <strong>Sign out</strong> sa odhlásite. Doplnok pritom zruší aj svoj kľúč na serveri. Tlačidlom{' '}
        <strong>Switch account</strong> sa prihlásite iným účtom.
      </HelpP>

      <HelpH3 id="calibre-katalog">Prehliadanie katalógu</HelpH3>
      <HelpP>
        Voľba <strong>Browse catalog…</strong> otvorí okno s katalógom. Môžete v ňom vyhľadávať podľa názvu, autora alebo
        kategórie a filtrovať podľa jazyka a kategórie. Označené knihy si stiahnete tlačidlom{' '}
        <strong>Download to library</strong>. Štítky <em>In your library</em> a <em>On your shelf</em> ukazujú, čo už
        máte v Calibre a čo na svojej poličke v Elvire. Tlačidlami <strong>Add to shelf</strong> a{' '}
        <strong>Remove from shelf</strong> upravujete svoju poličku.
      </HelpP>
      <HelpFigure
        src={`${IMG}/calibre-browse-light.png`}
        darkSrc={`${IMG}/calibre-browse-dark.png`}
        alt="Okno Browse catalog v doplnku EvilFlowers"
        caption="Prehliadanie katalógu s vyhľadávaním, filtrami a štítkami knižnice a poličky. Na obrázku sú testovacie dáta."
      />

      <HelpH3 id="calibre-sync">Synchronizácia</HelpH3>
      <HelpP>
        Kliknutím na tlačidlo EvilFlowers doplnok porovná knižnicu v Calibre s katalógom. Ku každej knihe ukáže, čo s ňou
        urobí. Štítky nad zoznamom filtrujú knihy podľa stavu. Akciu pri ľubovoľnej knihe môžete zmeniť. Synchronizáciu
        spustíte tlačidlom <strong>Synchronize</strong>.
      </HelpP>
      <HelpList
        items={[
          <>Doplnok nikdy nič nemaže, ani v Calibre, ani v katalógu.</>,
          <>Prenášajú sa názov, autori, jazyk, kategórie, anotácia, vydavateľ, dátum vydania, identifikátory (ISBN, DOI), obálka a súbory EPUB, PDF a MOBI. Séria, hodnotenie a vlastné stĺpce zostávajú len v Calibre.</>,
          <>Ak zapnete <strong>Only download books on my shelf</strong>, doplnok ponúkne na stiahnutie len knihy z vašej poličky v Elvire. Hodí sa to pri veľkých katalógoch.</>,
        ]}
      />
      <HelpFigure
        src={`${IMG}/calibre-sync-light.png`}
        darkSrc={`${IMG}/calibre-sync-dark.png`}
        alt="Okno synchronizácie v doplnku EvilFlowers"
        caption="Okno synchronizácie: každá kniha s plánovanou akciou a porovnanie verzií, ak sa kniha zmenila na oboch stranách."
      />

      <HelpH3 id="calibre-zvyraznenia">Zvýraznenia z čítačky</HelpH3>
      <HelpP>
        Označte knihu v Calibre a v ponuke EvilFlowers zvoľte <strong>Highlights for selected book…</strong>. Zobrazia sa
        pasáže, ktoré ste si zvýraznili v PDF čítačke portálu, aj s číslami strán. Môžete ich skopírovať alebo uložiť do
        vlastného textového stĺpca v Calibre. Prenos je jednosmerný: zmeny v Calibre sa do portálu nevracajú.
      </HelpP>
      <HelpFigure
        src={`${IMG}/calibre-highlights-light.png`}
        darkSrc={`${IMG}/calibre-highlights-dark.png`}
        alt="Okno so zvýrazneniami z čítačky EvilFlowers v Calibre"
        caption="Zvýraznenia z PDF čítačky portálu, zoskupené a s číslami strán."
      />

      {/* Problémy */}
      <HelpH2>Riešenie problémov</HelpH2>

      <HelpH3 id="problemy">Časté problémy</HelpH3>
      <HelpList
        items={[
          <><strong>Tlačidlo Otvoriť v Thorium nič neurobí</strong>: Thorium nie je nainštalovaný alebo ešte nebol ani raz spustený. Použite odkaz na priame stiahnutie súboru a súbor otvorte v Thorium ručne.</>,
          <><strong>Thorium neprijme prístupovú frázu</strong>: zadajte frázu, ktorá bola nastavená v profile v čase stiahnutia výpožičky. Ak ste ju odvtedy zmenili, platí pôvodná.</>,
          <><strong>Portál pri stiahnutí výpožičky žiada nastaviť heslo</strong>: ešte nemáte nastavenú prístupovú frázu. Nastavte si ju v {internal(NAVIGATION_PATHS.profile, 'Profile')}.</>,
          <><strong>Kniha v Thorium je zamknutá</strong>: výpožička skončila alebo ste ju vrátili. Ak je kópia voľná, požičajte si knihu znova.</>,
          <><strong>OPDS katalóg hlási neplatné prihlásenie</strong>: skontrolujte meno a heslo prihlásením do portálu. V adrese katalógu musí byť presná skratka katalógu.</>,
          <><strong>Calibre nenájde server</strong>: do poľa Server zadajte len adresu <HelpCode>{baseUrl}</HelpCode>, bez cesty <HelpCode>/api/v1</HelpCode> na konci.</>,
        ]}
      />
    </HelpLayout>
  );
};

export default HelpReaders;
