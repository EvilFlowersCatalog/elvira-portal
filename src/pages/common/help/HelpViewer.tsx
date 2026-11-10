import HelpLayout, { TocSection } from './HelpLayout';
import { HelpH2, HelpH3, HelpList, HelpP } from './HelpTypography';

const toc: TocSection[] = [
  {
    heading: 'PDF Viewer',
    items: [
      { label: 'Otvorenie dokumentu', id: 'otvorenie' },
      { label: 'Ovládanie čítačky', id: 'ovladanie' },
      { label: 'Hľadanie v texte', id: 'hladanie' },
      { label: 'Zvýraznenia, záložky a kreslenie', id: 'anotacie' },
      { label: 'Práca s označeným textom', id: 'oznaceny-text' },
      { label: 'Citácia, tlač a zdieľanie', id: 'zdielanie' },
      { label: 'Riešenie problémov', id: 'problemy' },
    ],
  },
];

const HelpViewer = () => (
  <HelpLayout title="PDF Viewer" toc={toc}>
    <HelpH2 first>PDF Viewer</HelpH2>

    <HelpH3 id="otvorenie">Otvorenie dokumentu</HelpH3>
    <HelpP>
      Voľne dostupnú knihu otvoríte v PDF čítačke tlačidlom <strong>Čítať</strong> v detaile knihy. Ak podržíte Ctrl
      (na Macu Cmd) alebo kliknete stredným tlačidlom myši, kniha sa otvorí na novej karte.
    </HelpP>
    <HelpP>
      Chránené knihy, ktoré si treba vypožičať, sa v tejto čítačke neotvárajú. Čítate ich v aplikácii Thorium Reader,
      ako je popísané v časti Výpožičky a rezervácie.
    </HelpP>

    <HelpH3 id="ovladanie">Ovládanie čítačky</HelpH3>
    <HelpList
      items={[
        <><strong>Listovanie</strong>: tlačidlá pre ďalšiu a predchádzajúcu stranu, alebo zadajte číslo v poli Prejsť na stranu.</>,
        <><strong>Priblíženie a oddialenie</strong> textu.</>,
        <><strong>Náhľady strán</strong> a <strong>Obsah</strong> s kapitolami a obrázkami, cez ktoré rýchlo prejdete na požadované miesto.</>,
        <><strong>Režim celej obrazovky</strong> a prepínanie medzi <strong>svetlým a tmavým režimom</strong>.</>,
        <>Spodný panel nástrojov môžete schovať, aby ste mali na čítanie viac miesta.</>,
      ]}
    />

    <HelpH3 id="hladanie">Hľadanie v texte</HelpH3>
    <HelpP>Čítačka ponúka dva spôsoby hľadania v dokumente:</HelpP>
    <HelpList
      items={[
        <><strong>Hľadať presný výraz</strong>: nájde všetky výskyty zadaného textu. Medzi nimi sa presúvate šípkami.</>,
        <><strong>AI hľadanie</strong>: nájde miesta, ktoré sa týkajú vašej otázky, aj keď v nich nie sú presne tie isté slová.</>,
      ]}
    />

    <HelpH3 id="anotacie">Zvýraznenia, záložky a kreslenie</HelpH3>
    <HelpList
      items={[
        <><strong>Zvýrazniť</strong>: označte text a zvýraznite ho. Zvýraznenia nájdete v zozname Moje zvýraznenia.</>,
        <><strong>Záložky</strong>: aktuálnu stranu si označíte záložkou a neskôr sa na ňu jednoducho vrátite.</>,
        <><strong>Kreslenie</strong>: po zapnutí úprav môžete do strán kresliť perom, zvýrazňovačom, elipsou, obdĺžnikom alebo čiarou. Kresbu zmažete gumou. Kroky vrátite tlačidlami Späť a Znova.</>,
      ]}
    />
    <HelpP>
      Zvýraznenia, záložky aj kresby sa ukladajú k vášmu účtu. Uvidíte ich aj vtedy, keď knihu otvoríte na inom
      zariadení. Pri niektorých publikáciách môžu byť úpravy vypnuté.
    </HelpP>

    <HelpH3 id="oznaceny-text">Práca s označeným textom</HelpH3>
    <HelpP>Keď v knihe označíte text, zobrazí sa ponuka:</HelpP>
    <HelpList
      items={[
        <><strong>Kopírovať</strong> označený text,</>,
        <><strong>Vysvetliť</strong>: AI vysvetlí označenú pasáž jednoducho alebo na príkladoch,</>,
        <><strong>Podobné</strong>: nájde v katalógu súvisiace publikácie.</>,
      ]}
    />
    <HelpP>
      Pri obrázkoch, tabuľkách a rovniciach môžete tabuľku skopírovať ako CSV alebo Markdown. Panel{' '}
      <strong>Asistent</strong> otvorí rozhovor s AI o čítanej publikácii. Rozhovor sa uloží aj do vašej histórie
      konverzácií v AI Asistentovi.
    </HelpP>

    <HelpH3 id="zdielanie">Citácia, tlač a zdieľanie</HelpH3>
    <HelpP>
      V paneli nástrojov nájdete <strong>Citáciu</strong> publikácie, <strong>Info</strong> o dokumente a QR kód. Ak to
      publikácia povoľuje, ponúkne čítačka aj <strong>Tlačiť</strong>, <strong>Stiahnuť</strong> a{' '}
      <strong>Zdieľať</strong>. Pri zdieľaní vytvoríte odkaz s platnosťou 1, 7 alebo 30 dní. Ktoré z týchto možností
      sú dostupné, závisí od licencie konkrétnej publikácie.
    </HelpP>

    <HelpH3 id="problemy">Riešenie problémov</HelpH3>
    <HelpList
      items={[
        <><strong>Dokument sa nenačíta</strong> (Načítanie PDF dokumentu zlyhalo): obnovte stránku. Ak problém pretrváva, skúste iný prehliadač alebo vypnite rozšírenia, ktoré blokujú obsah.</>,
        <><strong>Presmerovanie na úvodnú stránku</strong> so správou Niečo sa pokazilo pri čítaní súboru: súbor publikácie sa nepodarilo otvoriť. Skúste to neskôr a ak chyba pretrváva, kontaktujte nás.</>,
        <><strong>Chýba tlačidlo Čítať</strong>: kniha je chránená a treba si ju vypožičať.</>,
        <><strong>Chýba tlač, sťahovanie alebo kreslenie</strong>: tieto funkcie sú pri danej publikácii vypnuté.</>,
      ]}
    />
  </HelpLayout>
);

export default HelpViewer;
