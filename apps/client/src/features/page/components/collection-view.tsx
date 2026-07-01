import { useGetSidebarPagesQuery } from "@/features/page/queries/page-query.ts";
import { Link, useParams } from "react-router-dom";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils.ts";
import { Box, Text, Group, Skeleton, List, ActionIcon } from "@mantine/core";
import { IconFileDescription, IconFolder, IconTable, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { IPage } from "@/features/page/types/page.types.ts";
import { useState } from "react";
import { TitleEditor } from "@/features/editor/title-editor";
import React from "react";

const MemoizedTitleEditor = React.memo(TitleEditor);

function CollectionListNode({ pageId, spaceId, depth = 1 }: { pageId: string, spaceId: string, depth?: number }) {
  const { spaceSlug } = useParams();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  
  const { data, isLoading } = useGetSidebarPagesQuery({
    spaceId: spaceId,
    pageId: pageId,
  });

  const children = data?.pages.flatMap((p: any) => p.items) || [];

  if (isLoading) {
    return (
      <Box pl={depth === 1 ? 0 : 20} mt="sm">
        <Skeleton height={24} width="60%" radius="sm" />
      </Box>
    );
  }

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
      {children.map((child: any) => (
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
              {child.icon ? (
                <Text size="sm">{child.icon}</Text>
              ) : child.isBase ? (
                <IconTable size={16} />
              ) : child.type === 'collection' ? (
                <IconFolder size={16} />
              ) : (
                <IconFileDescription size={16} />
              )}
            </Box>
            
            <Text
              component={Link}
              to={buildPageUrl(spaceSlug, child.slugId, child.title)}
              fw={500}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {getPageTitle(child.title, child.isBase, t)}
            </Text>
          </Group>
          
          {child.hasChildren && depth < 3 && expanded && (
            <CollectionListNode pageId={child.id} spaceId={spaceId} depth={depth + 1} />
          )}
        </List.Item>
      ))}
    </List>
  );
}

export function CollectionView({ page, canEdit }: { page: IPage, canEdit: boolean }) {
  const { t } = useTranslation();

  return (
    <Box p="xl" style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
      <style>{`
        .collection-title-wrapper .ProseMirror {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
      `}</style>
      <div className="collection-title-wrapper" style={{ marginBottom: "2rem" }}>
        <MemoizedTitleEditor
          pageId={page.id}
          slugId={page.slugId}
          title={page.title}
          spaceSlug={page.space?.slug ?? ""}
          editable={canEdit}
          isBase={page.isBase}
        />
      </div>

      <Box style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: '1rem' }}>
        <Text fw={600} size="lg" mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>{t("Table of Contents")}</Text>
        <CollectionListNode pageId={page.id} spaceId={page.spaceId} />
      </Box>
    </Box>
  );
}
