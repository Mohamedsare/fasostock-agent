import { PageHeader } from "@/components/dashboard/page-header";
import { ConversationList } from "@/components/conversations/conversation-list";
import { getConversations } from "@/lib/data";

export const metadata = { title: "Conversations" };

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description={`${conversations.length} conversation${conversations.length > 1 ? "s" : ""} WhatsApp.`}
      />
      <ConversationList conversations={conversations} />
    </div>
  );
}
