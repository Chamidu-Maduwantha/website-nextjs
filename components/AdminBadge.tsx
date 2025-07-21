import { useSession } from 'next-auth/react';

export default function AdminBadge() {
  const { data: session } = useSession();

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M9.38 1.264a.5.5 0 01.243 0l8 4.5a.5.5 0 01-.003.935L13.5 8.93v2.073a.5.5 0 01-.226.417l-6 4a.5.5 0 01-.548 0l-6-4A.5.5 0 01.5 11.003V8.93L.382 6.699a.5.5 0 01-.003-.935l8-4.5zM1.5 7.928L7 10.572v2.856l5-3.333V7.928l4.5-2.644L9.5 2.216 1.5 7.928z" clipRule="evenodd" />
      </svg>
      ADMIN
    </span>
  );
}
