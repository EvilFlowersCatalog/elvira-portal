import HelpLoremArticle from './HelpLoremArticle';

const HelpAi = () => (
  <HelpLoremArticle
    title="AI Asistent"
    heading="AI Asistent"
    sections={[
      { id: 'co-je', label: 'Čo je AI Asistent' },
      { id: 'pouzitie', label: 'Ako AI Asistenta používať' },
      { id: 'api-kluc', label: 'Nastavenie API kľúča' },
      { id: 'limity', label: 'Limity a obmedzenia' },
    ]}
  />
);

export default HelpAi;
