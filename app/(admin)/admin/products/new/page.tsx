import ProductEditor from "@/components/admin/editor/ProductEditor";

export const metadata = { title: "Nuovo prodotto — Admin" };

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Aggiungi nuovo prodotto</h1>
      <ProductEditor />
    </div>
  );
}
