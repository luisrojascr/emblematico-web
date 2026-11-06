import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageEditor } from "@/components/panel/PageEditor";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { defaultContent, parsePageContent } from "@/lib/templates/registry";

function noticeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Editor({
  id,
  searchParams,
}: {
  id: string;
  searchParams: PageProps<"/panel/[businessId]">["searchParams"];
}) {
  const page = await loadPanelPage(id);
  if (!page) notFound();
  const parsed = parsePageContent(page.templateKey, page.draft);
  const content = parsed ?? defaultContent(page.templateKey);
  const query = await searchParams;

  return (
    <PanelHeading id={page.id} name={page.name} slug={page.slug}>
      <PageEditor
        key={page.updatedAt}
        page={page}
        content={content}
        invalidDraft={!parsed}
        notice={noticeOf(query.aviso)}
      />
    </PanelHeading>
  );
}

export default function PanelBusinessPage({
  params,
  searchParams,
}: PageProps<"/panel/[businessId]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <EditorLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditorLoader({
  params,
  searchParams,
}: PageProps<"/panel/[businessId]">) {
  const { businessId } = await params;
  return <Editor id={businessId} searchParams={searchParams} />;
}
