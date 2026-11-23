import { useState } from "react";
import { ActionIcon, Button, Center, CopyButton, Group, Image, Loader, Modal, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy, IconDownload, IconPrinter } from "@tabler/icons-react";

import { usePointQrQuery } from "@/shared/api/points.queries";
import type { Point, QrFormat } from "@/shared/api/types";
import { ADMIN_ROUTES } from "@/shared/config/routes";
import { downloadUrl } from "@/shared/lib/download";
import { pointLabel } from "@/shared/lib/point-label";
import { renderQr } from "@/shared/lib/qr";

const ICON_SIZE = 16;
const QR_PREVIEW_SIZE = 240;

interface PointQrModalProps {
  point: Point | null;
  onClose: () => void;
}

export default function PointQrModal({ point, onClose }: PointQrModalProps) {
  const qrQuery = usePointQrQuery(point);
  const [downloadingFormat, setDownloadingFormat] = useState<QrFormat | null>(null);

  const handleDownload = async (format: QrFormat) => {
    if (!point) return;
    setDownloadingFormat(format);
    try {
      downloadUrl(await renderQr(point.survey_url, format), `qr-${point.store}-${point.register_number}.${format}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handlePrint = () => {
    if (!point) return;
    window.open(ADMIN_ROUTES.printPoint(point.id), "_blank", "noopener");
  };

  return (
    <Modal opened={point !== null} onClose={onClose} title={point ? pointLabel(point) : ""} centered>
      {point && (
        <Stack>
          <Center mih={QR_PREVIEW_SIZE}>
            {qrQuery.data ? <Image src={qrQuery.data} w={QR_PREVIEW_SIZE} h={QR_PREVIEW_SIZE} alt="QR-код опроса" /> : <Loader />}
          </Center>
          {!point.is_active && (
            <Text size="sm" c="red" ta="center">
              Касса выключена: по этому QR опрос не откроется
            </Text>
          )}
          <TextInput
            label="Ссылка на опрос"
            value={point.survey_url}
            readOnly
            rightSection={
              <CopyButton value={point.survey_url}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Скопировано" : "Скопировать"}>
                    <ActionIcon variant="subtle" color={copied ? "teal" : "gray"} onClick={copy}>
                      {copied ? <IconCheck size={ICON_SIZE} /> : <IconCopy size={ICON_SIZE} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            }
          />
          <Group grow>
            <Button
              variant="default"
              leftSection={<IconDownload size={ICON_SIZE} />}
              loading={downloadingFormat === "svg"}
              onClick={() => void handleDownload("svg")}
            >
              SVG
            </Button>
            <Button
              variant="default"
              leftSection={<IconDownload size={ICON_SIZE} />}
              loading={downloadingFormat === "png"}
              onClick={() => void handleDownload("png")}
            >
              PNG
            </Button>
            <Button leftSection={<IconPrinter size={ICON_SIZE} />} onClick={handlePrint}>
              Печать
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
