import { Link, useParams } from "react-router-dom";
import { buildSharedPageUrl } from "@/features/page/page.utils.ts";
import { Box, Text, Group, List, ActionIcon } from "@mantine/core";
import { IconFileDescription, IconFolder, IconTable, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { IPage } from "@/features/page/types/page.types.ts";
import { useState } from "react";
import React from "react";
import { useAtomValue } from "jotai";
import { sharedTreeDataAtom } from "@/features/share/atoms/shared-page-atom.ts";
import { SharedPageTreeNode } from "@/features/share/utils.ts";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";

function findNodeBySlugId(nodes: SharedPageTreeNode[] | null, slugId: string): SharedPageTreeNode | null {
  if (!nodes) return null;
  for (const node of nodes) {
    if (node.slugId === slugId) return node;
    const found = findNodeBySlugId(node.children, slugId);
    if (found) return found;
  }
  return null;
}

function SharedCollectionListNode({ node, shareId, depth = 1 }: { node: SharedPageTreeNode, shareId: string, depth?: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  
  const children = node.children || [];

  if (children.length === 0) {
    return depth > 1 ? null : <Text c="dimmed" size="sm" mt="sm">{t("This collection is empty.")}</Text>;
  }

  return (
    <List
      spacing="xs"
      size="sm"
      center
      icon={null}
      mt={depth === 1 ? 'md' : 'xs'}
      listStyleType="none"
      pl={depth === 1 ? 0 : 24}
    >
      {children.map((child: SharedPageTreeNode) => (
        <List.Item key={child.id}>
          <Group wrap="nowrap" gap={4}>
            {child.hasChildren && depth < 3 ? (
              <ActionIcon variant="subtle" size="xs" onClick={() => setExpanded(!expanded)}>
                {expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </ActionIcon>
            ) : (
              <Box w={18} /> // spacer
            )}
            
            <Box style={{ display: 'flex', alignItems: 'center', color: 'var(--mantine-color-gray-6)' }}>
              <EmojiPicker
                onEmojiSelect={() => {}}
                icon={
                  child.icon ? (
                    child.icon
                  ) : child.hasChildren ? (
                    <IconFolder size="16" />
                  ) : (
                    <IconFileDescription size="16" />
                  )
                }
                readOnly={true}
                removeEmojiAction={() => {}}
                actionIconProps={{ tabIndex: -1, size: 'xs' }}
              />
            </Box>
            
            <Text
              component={Link}
              to={buildSharedPageUrl({ shareId, pageSlugId: child.slugId, pageTitle: child.name })}
              fw={500}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {child.name || t("untitled")}
            </Text>
          </Group>
          
          {child.hasChildren && depth < 3 && expanded && (
            <SharedCollectionListNode node={child} shareId={shareId} depth={depth + 1} />
          )}
        </List.Item>
      ))}
    </List>
  );
}

export function SharedCollectionView({ page }: { page: IPage }) {
  const { t } = useTranslation();
  const sharedTreeData = useAtomValue(sharedTreeDataAtom);
  const { shareId } = useParams();
  
  const currentNode = findNodeBySlugId(sharedTreeData, page.slugId);

  return (
    <Box p="xl" style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
      <div className="collection-title-wrapper" style={{ marginBottom: "2rem" }}>
        <Text fw={700} style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
          {page.title || t("untitled")}
        </Text>
      </div>

      <Box style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: '1rem' }}>
        <Text fw={600} size="lg" mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>{t("Table of Contents")}</Text>
        {currentNode ? (
          <SharedCollectionListNode node={currentNode} shareId={shareId as string} />
        ) : (
          <Text c="dimmed" size="sm" mt="sm">{t("This collection is empty.")}</Text>
        )}
      </Box>
    </Box>
  );
}
