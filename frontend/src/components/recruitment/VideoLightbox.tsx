import { Modal, Text, Title } from "@mantine/core";

export type RecruitmentVideo = {
  title: string;
  description: string;
  src: string;
  poster: string;
  duration: string;
  orientation?: "portrait" | "landscape";
  posterFit?: "cover" | "contain";
};

type VideoLightboxProps = {
  video: RecruitmentVideo | null;
  onClose: () => void;
};

export default function VideoLightbox({ video, onClose }: VideoLightboxProps) {
  return (
    <Modal
      opened={Boolean(video)}
      onClose={onClose}
      centered
      size={video?.orientation === "portrait" ? "sm" : "xl"}
      padding="md"
      overlayProps={{ opacity: 0.82, blur: 6 }}
      styles={{
        content: {
          color: "var(--qh-text)",
          border: "1px solid var(--qh-border)",
          background: "var(--qh-surface-raised)",
        },
        close: {
          color: "var(--qh-text)",
          background: "var(--qh-surface-soft)",
        },
        header: {
          color: "var(--qh-text)",
          background: "var(--qh-surface-raised)",
        },
        body: { background: "var(--qh-surface-raised)" },
      }}
      title={video ? <Title order={3}>{video.title}</Title> : undefined}
    >
      {video && (
        <>
          <video
            key={video.src}
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={video.poster}
            style={{
              display: "block",
              width: "100%",
              maxHeight: "72vh",
              borderRadius: 12,
              background: "#000",
            }}
          >
            <source src={video.src} type="video/mp4" />
            当前浏览器不支持视频播放。
          </video>
          <Text mt="sm" size="sm" color="dimmed" sx={{ lineHeight: 1.7 }}>
            {video.description}
          </Text>
        </>
      )}
    </Modal>
  );
}
