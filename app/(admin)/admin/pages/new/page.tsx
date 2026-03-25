import PageEditor from "@/components/admin/editor/PageEditor";

export const metadata = { title: "Nuova pagina — Admin" };

export default function NewPagePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Aggiungi nuova pagina</h1>
      <PageEditor />
    </div>
  );
}
