import { use } from 'react';
import { EditorShell } from '@/builder/editor/editor-shell';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BuilderEditorPage({ params }: PageProps) {
  const { id } = use(params);

  if (id === 'new') {
    return <EditorShell pageId="new" />;
  }

  return <EditorShell pageId={id} />;
}
