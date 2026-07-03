import { FC, useEffect, useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { Box, Button, Group, Textarea, Text, Paper, Tooltip, ActionIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconTrash } from "@tabler/icons-react";

type FootnoteMenuProps = {
  editor: Editor;
};

export const FootnoteMenu: FC<FootnoteMenuProps> = ({ editor }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [footnoteId, setFootnoteId] = useState<string | null>(null);
  
  // Track the active footnote's attributes to populate the textarea
  useEffect(() => {
    const updateState = () => {
      if (editor.isActive("footnote")) {
        const attrs = editor.getAttributes("footnote");
        if (attrs.footnoteId !== footnoteId) {
          setFootnoteId(attrs.footnoteId);
          setValue(attrs.note || "");
        }
      } else {
        setFootnoteId(null);
      }
    };
    
    editor.on("selectionUpdate", updateState);
    editor.on("update", updateState);
    
    return () => {
      editor.off("selectionUpdate", updateState);
      editor.off("update", updateState);
    };
  }, [editor, footnoteId]);

  if (!footnoteId) return null;

  const handleUpdate = () => {
    if (!footnoteId) return;
    editor.chain().focus().updateFootnote(footnoteId, value.trim()).run();
    // Move cursor to the end of the mark so the menu hides?
    // Actually just applying the mark is fine, the user can click away.
  };

  const handleDelete = () => {
    if (!footnoteId) return;
    editor.chain().focus().unsetFootnote(footnoteId).run();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      handleUpdate();
    }
    if (e.key === "Escape") {
      // Just unfocus the editor or textarea
      editor.commands.focus();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isEditable && editor.isActive("footnote")}
      options={{
        placement: "bottom",
        offset: 8,
      }}
      style={{ zIndex: 198, position: "relative" }}
    >
      <Paper p="xs" shadow="md" radius={6} withBorder style={{ minWidth: 280 }}>
        <Group justify="space-between" mb={6}>
          <Text size="xs" fw={500} c="dimmed">
            {t("Edit footnote")}
          </Text>
          <Tooltip label={t("Remove")} withArrow>
            <ActionIcon size="xs" color="red" variant="subtle" onClick={handleDelete}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
        
        <Textarea
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder={t("Footnote text…")}
          autosize
          minRows={2}
          maxRows={5}
          size="sm"
          onKeyDown={handleKeyDown}
          styles={{ input: { fontSize: "var(--mantine-font-size-sm)" } }}
        />
        
        <Group justify="flex-end" mt="xs">
          <Button size="xs" onClick={handleUpdate} disabled={!value.trim()}>
            {t("Update")}
          </Button>
        </Group>
      </Paper>
    </BubbleMenu>
  );
};
