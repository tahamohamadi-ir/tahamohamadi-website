import Link from 'next/link';

export default function BuilderIndexPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Page Builder (v2)</h1>
        <Link 
          href="/admin/builder/new" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Create New Page
        </Link>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center text-gray-500">
        Builder list view will go here. For now, click &quot;Create New Page&quot; to test the editor.
      </div>
    </div>
  );
}
