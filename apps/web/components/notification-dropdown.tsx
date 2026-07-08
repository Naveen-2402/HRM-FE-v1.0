import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Bell, Check, Loader2 } from "lucide-react";
import { useGetNotificationsApiV1NotificationsGet, useMarkNotificationReadApiV1NotificationsNotificationIdReadPut, useGetPubsubTokenApiV1NotificationsTokenGet } from "@repo/orval-config/src/api/notification/notifications/notifications";
import { useParams, useRouter } from "next/navigation";

export function NotificationDropdown() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;

  // Mock current user body parameter expected by the generated hooks
  const currentUserObj = {
    user_id: user?.sub || "test_user",
    email: user?.email || "test@example.com",
    roles: [],
    tenant_id: user?.tenant_id || "7c2cc9ed-34e8-4665-9878-ebf107f9c882",
    first_name: user?.given_name,
    last_name: user?.family_name,
    organization: {}
  };

  const { data: notifications, isLoading, refetch } = useGetNotificationsApiV1NotificationsGet(
    { status: "UNREAD", limit: 10, offset: 0 },
    { query: { enabled: isOpen } } as any
  );

  const { data: pubsubToken } = useGetPubsubTokenApiV1NotificationsTokenGet();

  useEffect(() => {
    if (!pubsubToken?.url) return;

    const ws = new WebSocket(pubsubToken.url);
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Real-time notification received:", message);
        // Refetch notifications if we get a new one
        refetch();
        // Here you can also use a toast library like sonner or react-hot-toast to show a popup
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [pubsubToken?.url, refetch]);

  const { mutate: markRead } = useMarkNotificationReadApiV1NotificationsNotificationIdReadPut({
    mutation: {
      onSuccess: () => refetch()
    }
  });

  const handleMarkRead = (id: string) => {
    markRead({ notificationId: id });
  };

  const handleNotificationClick = (notif: any) => {
    // 1. Mark as read
    if (notif.status === "UNREAD") {
      handleMarkRead(notif.id);
    }
    
    // 2. Redirect based on action_url or reference_entity
    let destinationUrl = "";
    if (notif.action_url) {
      let resolvedUrl = notif.action_url;
      const approvalMatch = resolvedUrl.match(/^\/dashboard\/approvals\/([a-fA-D0-9-]+)$/i);
      if (approvalMatch) {
        resolvedUrl = `/dashboard/approvals?id=${approvalMatch[1]}`;
      }
      
      if (resolvedUrl.startsWith("/") && tenant) {
        destinationUrl = `/${tenant}${resolvedUrl}`;
      } else {
        destinationUrl = resolvedUrl;
      }
    } else if (notif.reference_entity_type && notif.reference_entity_id && tenant) {
      if (notif.reference_entity_type === "approval_request") {
        destinationUrl = `/${tenant}/dashboard/approvals?id=${notif.reference_entity_id}`;
      } else if (notif.reference_entity_type === "job") {
        destinationUrl = `/${tenant}/dashboard/jobs/${notif.reference_entity_id}`;
      } else if (notif.reference_entity_type === "interview") {
        destinationUrl = `/${tenant}/dashboard/interviews/${notif.reference_entity_id}`;
      }
    }

    if (destinationUrl) {
      router.push(destinationUrl);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#notification-dropdown-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  const unreadCount = notifications?.length || 0;

  return (
    <div className="relative" id="notification-dropdown-container">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-all group mr-1 focus:outline-none cursor-pointer"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-card" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/50 bg-popover shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden flex flex-col max-h-[24rem]">
          <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border/50 shrink-0">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notif: any) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className="group p-3 rounded-xl hover:bg-muted/60 transition-colors flex items-start gap-3 cursor-pointer"
                  >
                    <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {notif.title && <p className="text-sm font-semibold truncate">{notif.title}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-semibold">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-lg transition-all text-muted-foreground hover:text-primary"
                      title="Mark as read"
                    >
                      <Check className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Bell className="size-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
