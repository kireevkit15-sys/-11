import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { videos } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(videos).limit(100);
  return NextResponse.json({ data: rows });
}
