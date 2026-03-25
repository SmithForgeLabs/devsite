import MediaLibrary from "@/components/admin/media/MediaLibrary";

export const metadata = { title: "Media — Admin" };

export default function AdminMediaPage() {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <h1 className="text-xl font-semibold text-gray-800">Libreria media</h1>
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" style={{ minHeight: "600px" }}>
        <MediaLibrary />
      </div>
    </div>
  );
}
