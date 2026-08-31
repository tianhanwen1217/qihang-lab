const BrandMark = ({ size = 36 }: { size?: number }) => {
  return (
    <span
      style={{
        display: "block",
        flex: "0 0 auto",
        position: "relative",
        width: size,
        height: size,
        borderRadius: Math.max(7, Math.round(size * 0.22)),
        transition: "box-shadow 0.3s ease, filter 0.3s ease",
      }}
    >
      <img
        aria-hidden="true"
        src="/img/qihang-logo.jpg"
        alt=""
        width={size}
        height={size}
        style={{
          display: "block",
          objectFit: "cover",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: Math.max(7, Math.round(size * 0.22)),
          background: "#ffffff",
          boxShadow: "0 0 12px rgba(41, 200, 255, 0.08)",
          transition: "box-shadow 0.3s ease",
        }}
      />
      {/* Hover 时通过父级 .qihang-logo-img 的 animation 触发辉光 */}
    </span>
  );
};

export default BrandMark;
