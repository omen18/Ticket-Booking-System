import { NextResponse } from "next/server";
import { getEvents, getEventFacets } from "@/lib/queries/events";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const search = url.searchParams.get("search") ?? undefined;
  const categoryParam = url.searchParams.get("category_id");
  const city = url.searchParams.get("city") ?? undefined;
  const dateFrom = url.searchParams.get("date_from") ?? undefined;
  const dateTo = url.searchParams.get("date_to") ?? undefined;
  const upcoming = url.searchParams.get("upcoming") === "1";
  const includeFacets = url.searchParams.get("facets") === "1";

  const events = await getEvents({
    search,
    category_id: categoryParam ? Number(categoryParam) : undefined,
    city,
    date_from: dateFrom,
    date_to: dateTo,
    upcoming_only: upcoming,
  });

  if (!includeFacets) {
    return NextResponse.json({ data: events });
  }

  const facets = await getEventFacets();
  return NextResponse.json({ data: events, facets });
}
