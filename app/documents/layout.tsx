// app/documents/layout.tsx
import getAllUsers from "@/app/actions/getAllUsers";
import getDeletedUsers from "@/app/actions/getDeletedUsers";
import getCurrentUser from "@/app/actions/getCurrentUser";
import ApplicationShell from "../components/navigation/ApplicationShell";
import UserList from "./components/UserList";


export const dynamic = 'force-dynamic';
/**
 * ===========================================
 * DOCUMENT ACCESS LAYOUT HELPERS
 * ===========================================
 */

/**
 * User type definition for role-based filtering
 * Using any to match Prisma User type while maintaining type safety for filtering
 */
type UserAccount = any;

/**
 * Determines which users should be visible based on role permissions
 *
 * Business logic:
 * - Employees: Can only see their own profile
 * - Other roles (Manager, CEO, etc.): Can see all users
 *
 * @param activeUser - The currently authenticated user
 * @param registeredUsers - All registered users in the system
 * @returns Filtered list of users based on role permissions
 *
 * @example
 * ```typescript
 * const visibleUsers = determineUserVisibility(currentUser, allUsers);
 * // Employee sees only themselves
 * // Manager/CEO sees everyone
 * ```
 */
const determineUserVisibility = (
  activeUser: UserAccount | null,
  registeredUsers: UserAccount[]
): UserAccount[] => {
  // Employee role restriction: only show their own profile
  if (activeUser?.role === 'Employee') {
    return registeredUsers.filter((account) => account.id === activeUser.id);
  }

  // All other roles: show full user list
  return registeredUsers;
};

/**
 * Loads all document access data required for the layout
 *
 * Fetches:
 * - All registered users
 * - Deactivated (deleted) user accounts for CEO access
 *
 * @returns Object containing registered users and deactivated accounts
 *
 * @example
 * ```typescript
 * const { registeredUsers, deactivatedAccounts } = await loadDocumentUsers();
 * ```
 */
const loadDocumentUsers = async () => {
  const registeredUsers = await getAllUsers();
  const deactivatedAccounts = await getDeletedUsers(); // CEO only feature

  return {
    registeredUsers,
    deactivatedAccounts,
  };
};

/**
 * Document Access Layout Component
 *
 * This layout provides the container for document management pages.
 * It handles:
 * - Loading all users and deleted users
 * - Filtering visible users based on role (Employee sees only self)
 * - Rendering the user list sidebar for document access
 * - Providing the application shell
 *
 * Role-based visibility:
 * - Employee: Can only view/access their own documents
 * - Manager/CEO: Can view/access all users' documents
 *
 * @param props - Component props
 * @param props.children - Child page content to render
 *
 * @example
 * ```tsx
 * // This layout wraps all pages under /documents route
 * // app/documents/[documentsId]/page.tsx will render as children
 * ```
 */
export default async function DocumentAccessLayout({
  children: documentContent,
}: {
  children: React.ReactNode;
}) {
  // Step 1: Retrieve authenticated user
  const activeUser = await getCurrentUser();

  // Step 2: Load all document users data
  const { registeredUsers, deactivatedAccounts } = await loadDocumentUsers();

  // Step 3: Determine visible users based on role
  const accessibleUserList = determineUserVisibility(activeUser, registeredUsers);

  // Step 4: Render layout with filtered user list and document content
  // Note: activeUser could be null, but UserList component handles this
  return (
    <ApplicationShell>
      <section className="h-full">
        <UserList
          items={accessibleUserList}
          deletedItems={deactivatedAccounts}
          currentUser={activeUser as any}
        />
        {documentContent}
      </section>
    </ApplicationShell>
  );
}
