import HelpLoremArticle from './HelpLoremArticle';

const HelpBooks = () => (
  <HelpLoremArticle
    title="Knihy"
    heading="Knihy"
    sections={[
      { id: 'katalog', label: 'Knihy v katalógu' },
      { id: 'detail', label: 'Stránka knihy a metadáta' },
      { id: 'licencie', label: 'Licencie a dostupnosť' },
      { id: 'formaty', label: 'Podporované formáty' },
    ]}
  />
);

export default HelpBooks;
