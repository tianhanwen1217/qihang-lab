import { Modal, Text, Title } from "@mantine/core";

export type RecruitmentImage = {
  src: string;
  title: string;
  description: string;
};

export default function ImageLightbox({ image, onClose }: { image: RecruitmentImage | null; onClose: () => void }) {
  return (
    <Modal
      opened={Boolean(image)}
      onClose={onClose}
      centered
      size="xl"
      padding="md"
      overlayProps={{ opacity: 0.88, blur: 7 }}
      closeOnClickOutside
      closeOnEscape
      title={image ? <Title order={3}>{image.title}</Title> : undefined}
      styles={{
        content: { color: "var(--qh-text)", border: "1px solid var(--qh-border)", background: "var(--qh-surface-raised)" },
        header: { color: "var(--qh-text)", background: "var(--qh-surface-raised)" },
        body: { background: "var(--qh-surface-raised)" },
        close: { width: 38, height: 38, color: "var(--qh-text)", background: "var(--qh-surface-soft)" },
      }}
    >
      {image && (
        <>
          <img
            src={image.src}
            alt={image.title}
            style={{ display: "block", width: "100%", maxHeight: "74vh", objectFit: "contain", borderRadius: 12, background: "#020711" }}
          />
          <Text mt="sm" size="sm" color="dimmed" sx={{ lineHeight: 1.7 }}>{image.description}</Text>
        </>
      )}
    </Modal>
  );
}
