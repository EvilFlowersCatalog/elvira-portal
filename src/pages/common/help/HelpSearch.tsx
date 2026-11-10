import HelpLayout, { TocSection } from './HelpLayout';
import { HelpH2, HelpH3, HelpList, HelpP } from './HelpTypography';

const toc: TocSection[] = [
  {
    heading: 'Vyhľadávanie',
    items: [
      { label: 'Ako vyhľadávanie funguje', id: 'ako-funguje' },
      { label: 'Návrhy počas písania', id: 'navrhy' },
      { label: 'Prečo sa kniha zobrazila', id: 'zhoda' },
      { label: 'Filtre', id: 'filtre' },
      { label: 'Zoradenie výsledkov', id: 'zoradenie' },
      { label: 'Tipy pre lepšie výsledky', id: 'tipy' },
    ],
  },
];

const HelpSearch = () => (
  <HelpLayout title="Vyhľadávanie v katalógu" toc={toc}>
    <HelpH2 first>Vyhľadávanie</HelpH2>

    <HelpH3 id="ako-funguje">Ako vyhľadávanie funguje</HelpH3>
    <HelpP>
      Hľadať môžete z poľa <strong>Hľadať v Elvíre</strong> na úvodnej stránke alebo z poľa <strong>Hľadať</strong>{' '}
      v Knižnici. Elvira hľadá dvoma spôsobmi naraz:
    </HelpP>
    <HelpList
      items={[
        <><strong>Podľa kľúčových slov</strong>: knihy, ktoré obsahujú zadané slová v názve, mene autora, kategórii, vydavateľovi alebo v texte publikácie.</>,
        <><strong>Podľa významu (sémanticky)</strong>: knihy, ktoré sa týkajú rovnakej témy, aj keď v nich vaše slová doslova nie sú. Funguje to aj s otázkou, napríklad <em>rozdiel medzi IPv4 a IPv6</em>.</>,
      ]}
    />
    <HelpP>
      Výsledky oboch spôsobov sa spoja do jedného zoznamu. Spôsob vyhľadávania nemusíte vyberať.
    </HelpP>
    <HelpP>
      Ak zadáte slovo s preklepom, Elvira ponúkne opravu: <strong>Mysleli ste …?</strong> Kliknutím na návrh sa
      vyhľadávanie spustí znova. Ak sa presná zhoda nenájde, zobrazia sa aspoň súvisiace výsledky a Elvira vás na to
      upozorní.
    </HelpP>

    <HelpH3 id="navrhy">Návrhy počas písania</HelpH3>
    <HelpP>
      Počas písania sa pod poľom zobrazujú návrhy rozdelené na <strong>Knihy</strong>, <strong>Autorov</strong>,{' '}
      <strong>Skupiny</strong> a <strong>Kategórie</strong>. Na návrh môžete kliknúť a prejdete priamo na knihu alebo
      filter. Ak chcete vidieť všetky výsledky, vyberte <strong>Zobraziť všetky výsledky</strong> alebo stlačte Enter.
    </HelpP>

    <HelpH3 id="zhoda">Prečo sa kniha zobrazila</HelpH3>
    <HelpP>
      Pri výsledkoch je štítok <strong>Zhoda v</strong>, ktorý ukazuje, kde sa váš dopyt našiel: autor, kategória,
      text, vydavateľ alebo <strong>súvisiace</strong>. Súvisiace znamená, že kniha sa našla podľa významu. Zhodu v
      názve knihy spoznáte podľa zvýrazneného textu.
    </HelpP>

    <HelpH3 id="filtre">Filtre</HelpH3>
    <HelpP>
      Panel <strong>Pokročilé vyhľadávanie</strong> zúži výsledky. Pri každej možnosti je v zátvorke počet kníh.
      Možnosti, ktoré by nevrátili žiadnu knihu, sa nezobrazujú.
    </HelpP>
    <HelpList
      items={[
        <><strong>Dostupnosť</strong>: dostupné, nedostupné, požičané alebo rezervované knihy.</>,
        <><strong>Rok vydania</strong>: rozsah od – do.</>,
        <><strong>Jazyk</strong></>,
        <><strong>Kategórie</strong></>,
        <><strong>Zbierky</strong>: majú vlastné pole na hľadanie.</>,
      ]}
    />
    <HelpP>
      Podľa autora vyfiltrujete knihy tak, že kliknete na jeho meno. Ak v jednom filtri vyberiete viac možností,
      zobrazia sa knihy, ktoré spĺňajú aspoň jednu z nich. Rôzne filtre sa kombinujú, takže kniha musí spĺňať všetky.
      Aktívne filtre sa zobrazujú nad výsledkami. Jednotlivo ich zrušíte krížikom, všetky naraz tlačidlom{' '}
      <strong>Zrušiť filtre</strong>.
    </HelpP>

    <HelpH3 id="zoradenie">Zoradenie výsledkov</HelpH3>
    <HelpP>
      Pri vyhľadávaní sú výsledky predvolene zoradené od <strong>najrelevantnejších</strong>. Bez vyhľadávania sa
      zobrazujú od <strong>najnovších</strong>. Výsledky môžete zoradiť aj od najstarších, abecedne (A-Z, Z-A) alebo
      podľa popularity.
    </HelpP>

    <HelpH3 id="tipy">Tipy pre lepšie výsledky</HelpH3>
    <HelpList
      items={[
        'Ak nepoznáte presný názov, popíšte tému vlastnými slovami, napríklad „knihy o umelej inteligencii“.',
        'Keď je výsledkov priveľa, zúžte ich filtrom podľa kategórie, jazyka alebo roku vydania.',
        'Keď je výsledkov málo, skúste kratší alebo všeobecnejší dopyt a zrušte filtre.',
        <>Ak neviete, ako začať, tlačidlo <strong>Spýtať sa AI</strong> vedľa vyhľadávania otvorí AI Asistenta, ktorý vám pomôže knihu nájsť.</>,
      ]}
    />
  </HelpLayout>
);

export default HelpSearch;
