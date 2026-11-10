import HelpLayout, { TocSection } from './HelpLayout';
import { HelpH2, HelpH3, HelpList, HelpP } from './HelpTypography';

const toc: TocSection[] = [
  {
    heading: 'Profil',
    items: [
      { label: 'Prihlásenie', id: 'prihlasenie' },
      { label: 'Osobné údaje', id: 'ucet' },
      { label: 'Prístupová fráza', id: 'pristupova-fraza' },
      { label: 'Notifikácie', id: 'notifikacie' },
      { label: 'Jazyk a vzhľad', id: 'nastavenia' },
    ],
  },
];

const HelpProfile = () => (
  <HelpLayout title="Profil" toc={toc}>
    <HelpH2 first>Profil</HelpH2>

    <HelpH3 id="prihlasenie">Prihlásenie</HelpH3>
    <HelpP>
      Do Elviry sa prihlásite menom a heslom svojho univerzitného (AIS) konta. Samostatná registrácia nie je potrebná.
      Ak zaškrtnete <strong>Zostať prihlásený</strong>, nebudete sa musieť prihlasovať pri každej návšteve. Na
      zdieľanom alebo verejnom počítači túto voľbu nepoužívajte.
    </HelpP>
    <HelpP>
      Odhlásite sa cez ponuku vášho profilu v menu, položkou <strong>Odhlásiť sa</strong>.
    </HelpP>

    <HelpH3 id="ucet">Osobné údaje</HelpH3>
    <HelpP>
      Na stránke Profil vidíte svoj e-mail, typ účtu, dátum, odkedy ste členom, a čas posledného prihlásenia. Tieto
      údaje sa preberajú z univerzitného systému a v Elvire ich nemôžete meniť. Na profile je aj počet{' '}
      <strong>uložených</strong> a <strong>požičaných kníh</strong>. Kliknutím prejdete na svoju poličku alebo do
      výpožičiek.
    </HelpP>

    <HelpH3 id="pristupova-fraza">Prístupová fráza</HelpH3>
    <HelpP>
      Prístupová fráza je heslo, ktorým sa odomykajú požičané chránené knihy v aplikácii Thorium Reader. Nastavíte ju v
      profile v časti <strong>Prístupová fráza</strong>. Musí mať aspoň 4 znaky. Môžete pridať aj{' '}
      <strong>nápovedu</strong>, ktorá vám pomôže si na frázu spomenúť. Thorium Reader vám ju pri otváraní knihy
      zobrazí.
    </HelpP>
    <HelpP>
      Frázu si dobre zapamätajte. Nedá sa obnoviť a bez nej už stiahnuté knihy neotvoríte. Viac nájdete v časti
      Výpožičky a rezervácie.
    </HelpP>

    <HelpH3 id="notifikacie">Notifikácie</HelpH3>
    <HelpP>
      Elvira vám posiela e-maily napríklad vtedy, keď na vás príde rad pri rezervácii. V časti{' '}
      <strong>Notifikácie</strong> si určíte, na ktoré adresy majú chodiť:
    </HelpP>
    <HelpList
      items={[
        'môžete pridať ďalšiu e-mailovú adresu alebo nejakú odstrániť,',
        <>jednu adresu zvolíte ako hlavnú tlačidlom <strong>Nastaviť ako hlavnú</strong>.</>,
      ]}
    />
    <HelpP>
      Univerzitná e-mailová adresa z AIS sa pri každom prihlásení pridá znova, aj keď ste ju predtým odstránili.
    </HelpP>

    <HelpH3 id="nastavenia">Jazyk a vzhľad</HelpH3>
    <HelpP>
      Jazyk rozhrania (slovenčina alebo angličtina) a <strong>tmavý alebo svetlý režim</strong> prepnete v bočnom menu
      v časti <strong>Nastavenia</strong>.
    </HelpP>
  </HelpLayout>
);

export default HelpProfile;
