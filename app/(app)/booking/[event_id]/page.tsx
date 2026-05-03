import { notFound, redirect } from "next/navigation";
import { getEventById } from "@/lib/queries/events";
import BookingClient from "./BookingClient";

interface Props {
  params: Promise<{ event_id: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { event_id } = await params;
  const eventId = Number(event_id);
  if (isNaN(eventId)) notFound();

  const event = await getEventById(eventId);
  if (!event) notFound();

  return <BookingClient event={event} />;
}
