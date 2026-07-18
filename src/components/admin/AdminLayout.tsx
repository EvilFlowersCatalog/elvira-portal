import { Outlet } from 'react-router-dom';
import Breadcrumb from '../buttons/Breadcrumb';
import AdminNav from './AdminNav';

/**
 * Persistent admin shell: breadcrumb + section sub-navigation + scrollable
 * content outlet. Gives operators a single, consistent orientation model so
 * they can always tell where they are and move laterally between sections.
 */
export default function AdminLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Breadcrumb />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <AdminNav />
        <div id="admin-content" className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
