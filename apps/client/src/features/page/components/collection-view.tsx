import { useGetSidebarPagesQuery } from "@/features/page/queries/page-query.ts";
import { Link, useParams } from "react-router-dom";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils.ts";
import { Card, SimpleGrid, Text, Group, Box, Title, Skeleton, Center } from "@mantine/core";
import { IconFileDescription, IconFolder, IconTable } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { IPage } from "@/features/page/types/page.types.ts";

export function CollectionView({ page }: { page: IPage }) {
  const { spaceSlug } = useParams();
  const { t } = useTranslation();
  
  const { data, isLoading } = useGetSidebarPagesQuery({
    spaceId: page.spaceId,
    pageId: page.id,
  });

  const children = data?.pages.flatMap((p: any) => p.items) || [];

  return (
    <Box p="xl" style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
      <Title order={1} mb="xl" style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>
        {getPageTitle(page.title, page.isBase, t)}
      </Title>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
        </SimpleGrid>
      ) : children.length === 0 ? (
        <Center p="xl" style={{ border: '1px dashed var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
          <Text c="dimmed">{t("This collection is empty.")}</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {children.map((child: any) => (
            <Card
              key={child.id}
              component={Link}
              to={buildPageUrl(spaceSlug, child.slugId, child.title)}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                textDecoration: 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
              }}
            >
              <Group wrap="nowrap" gap="sm">
                <Box style={{ flexShrink: 0 }}>
                  {child.icon ? (
                    <Text size="xl">{child.icon}</Text>
                  ) : child.isBase ? (
                    <IconTable size={24} color="var(--mantine-color-gray-6)" />
                  ) : child.type === 'collection' ? (
                    <IconFolder size={24} color="var(--mantine-color-gray-6)" />
                  ) : (
                    <IconFileDescription size={24} color="var(--mantine-color-gray-6)" />
                  )}
                </Box>
                <Text fw={500} size="md" truncate>
                  {getPageTitle(child.title, child.isBase, t)}
                </Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
