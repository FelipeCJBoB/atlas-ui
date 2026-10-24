// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import StackedNotifications from '../../componentes/notification-list/StackedNotifications';

export default function StackedNotificationsDemo() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center px-4">
      <StackedNotifications badgeCount={3} />
    </div>
  );
}
