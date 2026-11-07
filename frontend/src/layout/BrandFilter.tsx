export default function BrandFilter() {
  return (
    <svg className="brand-filter" aria-hidden="true">
      <defs>
        <filter id="brand-ink" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1.1 -1.04 0 0 0  0.17 -0.005 0 0 0  0.055 0.267 0 0 0  0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
