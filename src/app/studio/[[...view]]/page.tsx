import { Suspense } from "react";
import { notFound } from "next/navigation";
import Studio from "@/components/studio";
export default async function Page({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const { view = [] } = await params;
  if (
    view.length > 1 ||
    ![
      "",
      "create",
      "projects",
      "media",
      "ideas",
      "publishing",
      "brand",
      "settings",
    ].includes(view[0] || "")
  )
    notFound();
  return (
    <Suspense fallback={<p>Opening the studio…</p>}>
      <Studio />
    </Suspense>
  );
}
