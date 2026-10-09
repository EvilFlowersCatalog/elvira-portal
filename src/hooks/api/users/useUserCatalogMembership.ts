import { CatalogAccessMode } from '../../../utils/interfaces/catalog';
import { useGetCatalogDetail, useUpdateCatalog } from '../catalogs/useAdminCatalogs';

/**
 * Change one user's access to one catalog. Membership lives on the catalog
 * (PUT replaces the whole member list), so this reads the current list, changes
 * the single user and writes it back — every other member is left untouched.
 */
const useUserCatalogMembership = () => {
  const getDetail = useGetCatalogDetail();
  const updateCatalog = useUpdateCatalog();

  /** `mode: null` removes the user from the catalog. */
  return async (userId: string, catalogId: string, mode: CatalogAccessMode | null): Promise<void> => {
    const catalog = await getDetail(catalogId);
    const users = (catalog.user_catalogs ?? [])
      .filter((uc) => uc.user.id !== userId)
      .map((uc) => ({ user_id: uc.user.id, mode: uc.mode }));
    if (mode) users.push({ user_id: userId, mode });
    await updateCatalog(catalogId, {
      title: catalog.title,
      url_name: catalog.url_name,
      is_public: catalog.is_public,
      users,
    });
  };
};

export default useUserCatalogMembership;
