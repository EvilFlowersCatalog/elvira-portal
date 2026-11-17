import { Navigate, Outlet } from 'react-router-dom';
import { FeatureKey, useFeature, useFeaturesSettled } from '../../features/features';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import PageLoading from '../../components/page/PageLoading';

/**
 * Routes of a switched-off feature answer like a page that does not exist — but only once the catalog has
 * answered this page load, so a deep link to a feature the setting turns on is not bounced by the build default.
 */
const RequireFeature = ({ feature }: { feature: FeatureKey }) => {
  const on = useFeature(feature);
  const settled = useFeaturesSettled();
  if (on) return <Outlet />;
  if (!settled) return <PageLoading />;
  return <Navigate to={NAVIGATION_PATHS.notFound} replace />;
};

export default RequireFeature;
