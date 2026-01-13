import { ReactNode } from 'react';

/**
 * Empty State Component
 * Displays when no data is available
 */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon */}
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <svg
          className="w-16 h-16 text-muted-foreground mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * No Conversations Empty State
 */
export function NoConversations({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
      {/* Enhanced Icon */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-foreground mb-3">No conversations yet</h3>

      {/* Description */}
      <p className="text-base text-muted-foreground mb-8 max-w-md">
        When customers start chatting, their conversations will appear here.
      </p>

      {/* Action Button */}
      {onCreate && (
        <button
          onClick={onCreate}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20 font-medium"
        >
          Start a conversation
        </button>
      )}
    </div>
  );
}

/**
 * No Contacts Empty State
 */
export function NoContacts({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      title="No contacts yet"
      description="Add contacts manually or import them from a CSV file to get started."
      action={onCreate ? { label: 'Add contact', onClick: onCreate } : undefined}
    />
  );
}

/**
 * No Campaigns Empty State
 */
export function NoCampaigns({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      }
      title="No campaigns yet"
      description="Create broadcast campaigns to send messages to multiple contacts at once."
      action={onCreate ? { label: 'Create campaign', onClick: onCreate } : undefined}
    />
  );
}

/**
 * No Search Results Empty State
 */
export function NoSearchResults({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={`No results found for "${query}". Try a different search term.`}
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

/**
 * No Data Empty State (Generic)
 */
export function NoData({ message = 'No data available' }: { message?: string }) {
  return (
    <EmptyState
      title={message}
      description="There is nothing to display at the moment."
    />
  );
}

/**
 * Error State (Not Found)
 */
export function NotFound({ message = 'Not found', onGoBack }: { message?: string; onGoBack?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title={message}
      description="The resource you're looking for doesn't exist or has been removed."
      action={onGoBack ? { label: 'Go back', onClick: onGoBack } : undefined}
    />
  );
}

