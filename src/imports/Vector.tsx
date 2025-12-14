import svgPaths from "./svg-eu28ikjdrs";

export default function Vector() {
  return (
    <div className="relative size-full" data-name="Vector">
      <div className="absolute inset-[-4.55%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <path d={svgPaths.p2d1e6400} id="Vector" stroke="var(--stroke-0, #62748E)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}