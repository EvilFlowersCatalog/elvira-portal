import HelpLayout, { TocSection } from './HelpLayout';
import { HelpH2, HelpH3, HelpList, HelpP } from './HelpTypography';

const toc: TocSection[] = [
  {
    heading: 'AI Asistent',
    items: [
      { label: 'Čo je AI Asistent', id: 'co-je' },
      { label: 'Kde ho nájdete', id: 'kde' },
      { label: 'Ako AI Asistenta používať', id: 'pouzitie' },
      { label: 'Rozhovor o konkrétnej knihe', id: 'o-knihe' },
      { label: 'História konverzácií', id: 'historia' },
      { label: 'Potrebujem API kľúč?', id: 'api-kluc' },
      { label: 'Limity a obmedzenia', id: 'limity' },
    ],
  },
];

const HelpAi = () => (
  <HelpLayout title="AI Asistent" toc={toc}>
    <HelpH2 first>AI Asistent</HelpH2>

    <HelpH3 id="co-je">Čo je AI Asistent</HelpH3>
    <HelpP>
      AI Asistent je pomocník založený na jazykovom modeli, ktorý pozná katalóg Elviry. Pomôže vám nájsť knihy,
      odpovie na otázky o ich obsahu a odporučí vám literatúru k téme. Pri práci prehľadáva katalóg aj texty
      publikácií. Počas toho vidíte, čo práve robí, napríklad <em>Hľadám v katalógu…</em> alebo{' '}
      <em>Čítam publikáciu…</em>.
    </HelpP>

    <HelpH3 id="kde">Kde ho nájdete</HelpH3>
    <HelpList
      items={[
        <>V bočnom menu pod položkou <strong>AI Asistent</strong>,</>,
        <>tlačidlom <strong>Spýtať sa AI</strong> vedľa vyhľadávania a v detaile knihy,</>,
        <>v paneli <strong>Asistent</strong> v PDF čítačke.</>,
      ]}
    />

    <HelpH3 id="pouzitie">Ako AI Asistenta používať</HelpH3>
    <HelpP>Otázku napíšte bežnou vetou, rovnako ako by ste sa pýtali knihovníka. Napríklad:</HelpP>
    <HelpList
      items={[
        '„Nájdi knihu o matematike.“',
        '„Ako sa naučím programovať?“',
        '„Odporuč mi úvod do počítačových sietí v slovenčine.“',
      ]}
    />
    <HelpP>
      Ak odpoveď odkazuje na konkrétne miesto v knihe, kliknutím na odkaz sa kniha otvorí v čítačke na danej strane.
      Doplňujúcimi otázkami môžete odpoveď spresniť.
    </HelpP>

    <HelpH3 id="o-knihe">Rozhovor o konkrétnej knihe</HelpH3>
    <HelpP>
      Ak rozhovor otvoríte z detailu knihy alebo z čítačky, asistent vie, o ktorej knihe hovoríte. Nad rozhovorom sa
      zobrazí názov knihy a tlačidlo na jej otvorenie. V čítačke môžete asistentovi poslať aj označený text, obrázok
      alebo tabuľku a požiadať o vysvetlenie.
    </HelpP>

    <HelpH3 id="historia">História konverzácií</HelpH3>
    <HelpP>
      Všetky rozhovory sa ukladajú do <strong>Histórie konverzácií</strong>, takže sa k nim môžete vrátiť. Tlačidlom{' '}
      <strong>Nová konverzácia</strong> začnete nový rozhovor. Konverzáciu môžete aj vymazať, ale vymazanie je
      nevratné.
    </HelpP>

    <HelpH3 id="api-kluc">Potrebujem API kľúč?</HelpH3>
    <HelpP>
      Nie. AI Asistenta poskytuje Elvira všetkým prihláseným používateľom. Nemusíte nič nastavovať ani zadávať vlastný
      API kľúč.
    </HelpP>

    <HelpH3 id="limity">Limity a obmedzenia</HelpH3>
    <HelpList
      items={[
        <>Používanie asistenta má <strong>denný limit</strong>. Keď ho dosiahnete, Elvira vám oznámi, o koľko času ho môžete použiť znova.</>,
        'Na používanie asistenta musíte byť prihlásený.',
        'AI funkcie sú v beta verzii. Odpovede môžu byť neúplné alebo nepresné. Dôležité informácie si vždy overte priamo v publikácii.',
        'Asistent pracuje s publikáciami z katalógu Elviry. O knihách mimo katalógu vám presné informácie nedá.',
      ]}
    />
  </HelpLayout>
);

export default HelpAi;
