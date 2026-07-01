import { Alert, Group, Text } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface LockedPageBannerProps {
  /** True when the page itself has isLocked=true */
  directLock: boolean;
  /** Set to the ancestor page id when the lock is inherited */
  lockedByAncestorId?: string;
  /** Human-readable title of the locking ancestor (optional, for display) */
  lockedByAncestorTitle?: string;
}

/**
 * Displayed above the editor when a page is effectively locked.
 * Shows whether the lock is direct or inherited from an ancestor.
 */
export function LockedPageBanner({
  directLock,
  lockedByAncestorId,
  lockedByAncestorTitle,
}: LockedPageBannerProps) {
  const { t } = useTranslation();

  const message = directLock
    ? t("This page is locked and cannot be edited.")
    : lockedByAncestorTitle
      ? t(
          'This page is read-only because the parent "{{title}}" is locked.',
          { title: lockedByAncestorTitle },
        )
      : t("This page is read-only because a parent page is locked.");

  return (
    <Alert
      icon={<IconLock size={16} />}
      color="orange"
      variant="light"
      radius="sm"
      style={{ marginBottom: "var(--mantine-spacing-md)" }}
      aria-live="polite"
    >
      <Group gap="xs" wrap="nowrap">
        <Text size="sm">{message}</Text>
      </Group>
    </Alert>
  );
}
