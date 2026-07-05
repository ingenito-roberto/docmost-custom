import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateUser } from "@/features/user/services/user-service.ts";
import { MantineSize, Switch, Text } from "@mantine/core";
import { useAtom } from "jotai/index";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveSettingsRow, ResponsiveSettingsContent, ResponsiveSettingsControl } from "@/components/ui/responsive-settings-row";

export default function StickyHeadingsPref() {
  const { t } = useTranslation();

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Text size="md">{t("Sticky headings")}</Text>
        <Text size="sm" c="dimmed">
          {t("Keep headings sticky at the top of the page while scrolling.")}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <StickyHeadingsToggle />
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}

interface StickyHeadingsToggleProps {
  size?: MantineSize;
  label?: string;
}

export function StickyHeadingsToggle({ size, label }: StickyHeadingsToggleProps) {
  const { t } = useTranslation();
  const [user, setUser] = useAtom(userAtom);
  // Default to true if not explicitly set to false
  const [checked, setChecked] = useState(
    user.settings?.preferences?.stickyHeadings !== false
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    setChecked(value);
    try {
      const updatedUser = await updateUser({ stickyHeadings: value } as any);
      setUser(updatedUser);
    } catch {
      setChecked(!value);
    }
  };

  return (
    <Switch
      size={size}
      label={label}
      labelPosition="left"
      checked={checked}
      onChange={handleChange}
      aria-label={t("Toggle sticky headings")}
    />
  );
}
