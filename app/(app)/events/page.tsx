import { getEvents } from "@/lib/queries/events";
import EventsPageClient from "./EventsPageClient";

export default async function EventsPage() {
  const events = await getEvents();
  return <EventsPageClient events={events} />;
}
