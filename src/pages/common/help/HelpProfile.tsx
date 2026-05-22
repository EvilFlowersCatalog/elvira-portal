import HelpLoremArticle from './HelpLoremArticle';

const HelpProfile = () => (
  <HelpLoremArticle
    title="Profil"
    heading="Profil"
    sections={[
      { id: 'ucet', label: 'Správa účtu' },
      { id: 'nastavenia', label: 'Nastavenia a preferencie' },
      { id: 'notifikacie', label: 'Notifikácie' },
      { id: 'bezpecnost', label: 'Bezpečnosť a prihlásenie' },
    ]}
  />
);

export default HelpProfile;
