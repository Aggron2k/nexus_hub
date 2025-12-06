import getAllUsers from '../actions/getAllUsers';
import getDeletedUsers from '../actions/getDeletedUsers';
import getCurrentUser from '../actions/getCurrentUser';
import { redirect } from 'next/navigation';
import ApplicationShell from '../components/navigation/ApplicationShell';
import UserList from './components/UserList';


export const dynamic = 'force-dynamic';
/**
 * ===========================================
 * USER MANAGEMENT LAYOUT HELPERS
 * ===========================================
 */

/**
 * Validates user authentication and redirects if not authenticated
 *
 * @param authenticatedUser - The currently authenticated user or null
 * @returns void (redirects to login if not authenticated)
 *
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * validateUserAccess(user); // Redirects if null
 * ```
 */
const validateUserAccess = (authenticatedUser: any): void => {
  if (!authenticatedUser) {
    redirect('/login');
  }
};

/**
 * Loads all user management data required for the layout
 *
 * Fetches:
 * - Active user directory
 * - Archived (deleted) user accounts for CEO access
 *
 * @returns Object containing user directory and archived accounts
 *
 * @example
 * ```typescript
 * const { userDirectory, archivedAccounts } = await loadUserManagementData();
 * ```
 */
const loadUserManagementData = async () => {
  const userDirectory = await getAllUsers();
  const archivedAccounts = await getDeletedUsers(); // CEO only feature

  return {
    userDirectory,
    archivedAccounts,
  };
};

/**
 * User Management Layout Component
 *
 * This layout provides the container for user management pages.
 * It handles:
 * - User authentication verification
 * - Loading active and archived user lists
 * - Rendering the user list sidebar
 * - Providing the application shell
 *
 * Only authenticated users can access this layout. Non-authenticated
 * users are redirected to the login page.
 *
 * @param props - Component props
 * @param props.children - Child page content to render
 *
 * @example
 * ```tsx
 * // This layout wraps all pages under /users route
 * // app/users/[userId]/page.tsx will render as children
 * ```
 */
export default async function UserManagementLayout({
  children: pageContent,
}: {
  children: React.ReactNode;
}) {
  // Step 1: Retrieve authenticated user
  const authenticatedUser = await getCurrentUser();

  // Step 2: Validate access (redirects if not authenticated)
  validateUserAccess(authenticatedUser);

  // Step 3: Load user management data
  const { userDirectory, archivedAccounts } = await loadUserManagementData();

  // Step 4: Render layout with user list and page content
  // Note: authenticatedUser is guaranteed to be non-null after validateUserAccess
  return (
    <ApplicationShell>
      <section className="h-full">
        <UserList
          items={userDirectory}
          deletedItems={archivedAccounts}
          currentUser={authenticatedUser!}
        />
        {pageContent}
      </section>
    </ApplicationShell>
  );
}
