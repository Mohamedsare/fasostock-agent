import { notFound } from "next/navigation";
import { ConversationDetail } from "@/components/conversations/conversation-detail";
import { getConversationById, getMessages, getNotes } from "@/lib/data";
import { contactLabel } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getConversationById(id);
  return { title: c ? contactLabel(c.contact.name, c.contact.phone) : "Conversation" };
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation) notFound();

  const [messages, notes] = await Promise.all([getMessages(id), getNotes(id)]);

  return <ConversationDetail conversation={conversation} messages={messages} notes={notes} />;
}
