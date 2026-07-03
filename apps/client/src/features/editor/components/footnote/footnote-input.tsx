import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { Box, Button, Group, Textarea, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { isEditorReady } from "@docmost/editor-ext";

type FootnoteInputProps = {
  editor: Editor | null;
  onClose: () => void;
};

/**
 * FootnoteInput — small popover form displayed by the bubble menu.
 *
 * Allows the user to type the note text, then applies the footnote mark to
 * the current selection.  Pressing Enter (without Shift) or Cmd+Enter submits.
 */
export function FootnoteInput({ editor, onClose }: FootnoteInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Autofocus
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleSubmit = () => {
    if (!editor || !isEditorReady(editor)) return;
    // Apply the footnote mark to whatever was selected before the bubble menu
    // stole focus. The editor keeps the selection while the BubbleMenu is open.
    editor.chain().focus().setFootnote(value.trim()).run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Box p="xs" style={{ minWidth: 260 }}>
      <Text size="xs" fw={500} mb={6} c="dimmed">
        {t("Footnote text")}
      </Text>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={t("Enter footnote…")}
        autosize
        minRows={2}
        maxRows={5}
        size="sm"
        onKeyDown={handleKeyDown}
        styles={{ input: { fontSize: "var(--mantine-font-size-sm)" } }}
      />
      <Group justify="flex-end" mt="xs" gap="xs">
        <Button size="xs" variant="default" onClick={onClose}>
          {t("Cancel")}
        </Button>
        <Button size="xs" onClick={handleSubmit} disabled={!value.trim()}>
          {t("Add")}
        </Button>
      </Group>
    </Box>
  );
}
