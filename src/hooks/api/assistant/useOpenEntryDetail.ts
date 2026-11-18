import useEntryDialog from '../../useEntryDialog';

/**
 * Opens a publication's dialog over the current page, above the assistant drawer (the detail needs its
 * catalog: pass it when known).
 */
const useOpenEntryDetail = () => {
  const { open } = useEntryDialog();
  return (entryId: string, catalogId: string) => open(entryId, { catalogId, onTop: true });
};

export default useOpenEntryDetail;
