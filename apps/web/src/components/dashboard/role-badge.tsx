import { roleLabel, type Role } from "@/lib/roles";

const VARIANT: Record<
  Role,
  { label: string; className: string }
> = {
  owner: {
    label: roleLabel("owner"),
    className:
      "border-violet-500/50 bg-violet-500/10 text-violet-900 dark:text-violet-100"
  },
  admin: {
    label: roleLabel("admin"),
    className:
      "border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100"
  },
  client: {
    label: roleLabel("client"),
    className:
      "border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
  }
};

export function RoleBadge({ role }: { role: Role }) {
  const v = VARIANT[role];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${v.className}`}
      title="From Clerk publicMetadata.role"
    >
      {v.label}
    </span>
  );
}
