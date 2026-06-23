import { redirect } from 'next/navigation';

export default function UserRolesRedirectPage() {
  // Role management is now consolidated in the Users page
  redirect('/protected/admin/users');
}
