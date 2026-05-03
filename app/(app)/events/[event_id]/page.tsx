import { notFound } from "next/navigation";
import { getEventDetails } from "@/lib/queries/events";
import EventDetailClient from "./EventDetailClient";

interface Props {
  params: Promise<{ event_id: string }>;
}

export default async function EventDetailsPage({ params }: Props) {
  const { event_id } = await params;
  const eventId = Number(event_id);
  if (isNaN(eventId)) notFound();

  const event = await getEventDetails(eventId);
  if (!event) notFound();

  return <EventDetailClient event={event} />;
}
