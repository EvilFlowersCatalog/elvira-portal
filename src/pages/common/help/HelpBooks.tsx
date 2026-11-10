import HelpLayout, { TocSection } from './HelpLayout';
import { HelpH2, HelpH3, HelpList, HelpP } from './HelpTypography';

const toc: TocSection[] = [
  {
    heading: 'Knihy',
    items: [
      { label: 'Knihy v katalógu', id: 'katalog' },
      { label: 'Detail knihy', id: 'detail' },
      { label: 'Uloženie, citácia a zdieľanie', id: 'akcie' },
      { label: 'Voľne dostupné a chránené knihy', id: 'licencie' },
      { label: 'Stav dostupnosti', id: 'dostupnost' },
      { label: 'Podporované formáty', id: 'formaty' },
    ],
  },
];

const HelpBooks = () => (
  <HelpLayout title="Knihy" toc={toc}>
    <HelpH2 first>Knihy</HelpH2>

    <HelpH3 id="katalog">Knihy v katalógu</HelpH3>
    <HelpP>
      Katalóg Elviry obsahuje elektronické publikácie knižnice STU. Knihy sú zaradené do <strong>kategórií</strong> a{' '}
      <strong>zbierok</strong>. Zoznam kníh nájdete v sekcii Knižnica. Na prezeranie katalógu musíte byť prihlásený
      svojím univerzitným (AIS) kontom.
    </HelpP>

    <HelpH3 id="detail">Detail knihy</HelpH3>
    <HelpP>Kliknutím na knihu otvoríte jej detail. Nájdete v ňom:</HelpP>
    <HelpList
      items={[
        'obálku, názov, autorov a zbierky, do ktorých kniha patrí,',
        'počet strán a počet čitateľov,',
        <>anotáciu (dlhší text rozbalíte tlačidlom <strong>Čítať Viac</strong>),</>,
        'vydavateľa, rok vydania a jazyk,',
        'kategórie knihy.',
      ]}
    />
    <HelpP>
      Na meno autora, zbierku alebo kategóriu sa dá kliknúť. Zobrazia sa vám všetky knihy, ktoré s ňou súvisia.
    </HelpP>

    <HelpH3 id="akcie">Uloženie, citácia a zdieľanie</HelpH3>
    <HelpList
      items={[
        <><strong>Uložiť</strong> pridá knihu na vašu poličku. Tlačidlo <strong>Odstrániť</strong> ju z poličky odoberie.</>,
        <><strong>Citovať</strong> skopíruje citáciu knihy do schránky. Tlačidlo sa zobrazí len vtedy, ak má kniha citáciu k dispozícii.</>,
        <><strong>Zdieľať</strong> skopíruje odkaz na knihu do schránky.</>,
        <><strong>Spýtať sa AI</strong> otvorí AI Asistenta, s ktorým sa môžete rozprávať o tejto knihe.</>,
      ]}
    />

    <HelpH3 id="licencie">Voľne dostupné a chránené knihy</HelpH3>
    <HelpP>V katalógu sú dva druhy kníh:</HelpP>
    <HelpList
      items={[
        <><strong>Voľne dostupné knihy</strong> majú tlačidlo <strong>Čítať</strong>. Otvoria sa priamo v prehliadači, v PDF čítačke Elviry. Nemusíte si ich požičiavať.</>,
        <><strong>Chránené knihy</strong> majú obmedzený počet licencií (kópií). Treba si ich vypožičať tlačidlom <strong>Vypožičať</strong>. Ak sú všetky kópie požičané, môžete sa tlačidlom <strong>Rezervovať</strong> zaradiť do poradia. Požičanú knihu čítate v aplikácii Thorium Reader.</>,
      ]}
    />
    <HelpP>Postup výpožičky a rezervácie je podrobne popísaný v časti Výpožičky a rezervácie.</HelpP>

    <HelpH3 id="dostupnost">Stav dostupnosti</HelpH3>
    <HelpP>Pri chránených knihách vidíte v detaile počet požičaných a všetkých kópií, a tiež štítok so stavom:</HelpP>
    <HelpList
      items={[
        <><strong>Dostupné</strong>: voľná kópia je k dispozícii a knihu si môžete hneď požičať.</>,
        <><strong>Požičané</strong>: knihu máte požičanú vy. Štítok ukazuje, do kedy.</>,
        <><strong>Rezervované</strong>: máte rezerváciu. Štítok ukazuje vaše poradie.</>,
        <><strong>Nedostupné</strong>: všetky kópie sú požičané. Štítok ukazuje odhad, kedy sa niektorá uvoľní.</>,
      ]}
    />

    <HelpH3 id="formaty">Podporované formáty</HelpH3>
    <HelpP>
      Všetky publikácie v Elvire sú vo formáte <strong>PDF</strong>. Voľne dostupné knihy otvoríte v PDF čítačke priamo
      v prehliadači. Požičané chránené knihy stiahnete ako súbor, ktorý otvoríte v aplikácii Thorium Reader.
    </HelpP>
  </HelpLayout>
);

export default HelpBooks;
