import PostEditor from "@/components/admin/editor/PostEditor";

export const metadata = { title: "Nuovo post — Admin" };

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Aggiungi nuovo post</h1>
      <PostEditor />
    </div>
  );
}
