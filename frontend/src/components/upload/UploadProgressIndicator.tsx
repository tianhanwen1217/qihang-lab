import { RingProgress } from "@mantine/core";
import { TbAlertTriangle, TbCircleCheck, TbClock } from "react-icons/tb";
const UploadProgressIndicator = ({ progress }: { progress: number }) => {
  if (progress > 0 && progress < 100) {
    return (
      <RingProgress
        sections={[{ value: progress, color: "qihang" }]}
        thickness={3}
        size={25}
      />
    );
  } else if (progress >= 100) {
    return <TbCircleCheck color="green" size={22} />;
  } else if (progress < 0) {
    return <TbAlertTriangle color="#fa5252" size={22} title="上传失败" />;
  }
  return <TbClock color="#868e96" size={20} title="等待上传" />;
};

export default UploadProgressIndicator;
