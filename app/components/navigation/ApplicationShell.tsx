import MainNavigationSidebar from "./MainNavigationSidebar";
import MobileNavigationDrawer from "./MobileNavigationDrawer";
import getCurrentUser from "@/app/actions/getCurrentUser";

/**
 * ApplicationShell Props Interface
 */
interface ApplicationLayoutProps {
    /** Child components to render in the main content area */
    children: React.ReactNode;
}

/**
 * ApplicationShell Component
 *
 * The main layout wrapper for the application that provides:
 * - Desktop navigation sidebar (MainNavigationSidebar)
 * - Mobile navigation drawer (MobileNavigationDrawer)
 * - Main content area with proper spacing
 *
 * This component fetches the current user and passes it to both
 * navigation components for profile display and authentication state.
 *
 * @example
 * ```tsx
 * <ApplicationShell>
 *   <YourPageContent />
 * </ApplicationShell>
 * ```
 */
async function ApplicationShell({ children }: ApplicationLayoutProps) {
    const authenticatedUser = await getCurrentUser();

    return (
        <div className="h-full">
            {/* Desktop Navigation Sidebar */}
            <MainNavigationSidebar currentUser={authenticatedUser!} />

            {/* Mobile Navigation Drawer */}
            <MobileNavigationDrawer currentUser={authenticatedUser!} />

            {/* Main Content Area */}
            <main className="lg:pl-20 h-full">
                {children}
            </main>
        </div>
    );
}

export default ApplicationShell;
