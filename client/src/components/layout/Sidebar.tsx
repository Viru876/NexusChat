import WorkspaceSidebar from './WorkspaceSidebar';
import ChannelSidebar from './ChannelSidebar';

interface SidebarProps {
  onOpenSearch: () => void;
}

/**
 * Composed navigation sidebar combining the narrow workspace rail and the
 * channel/DM list. Used by AppLayout; also exported for reuse in mobile shells.
 */
export default function Sidebar({ onOpenSearch }: SidebarProps) {
  return (
    <div className="flex h-full">
      <WorkspaceSidebar />
      <ChannelSidebar onOpenSearch={onOpenSearch} />
    </div>
  );
}
