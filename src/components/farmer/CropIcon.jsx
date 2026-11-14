const green = "#08794A",
  leaf = "#9AD8BF",
  gold = "#D79A35";
const stem = (
  <path
    d="M32 55V15"
    fill="none"
    stroke={green}
    strokeWidth="2.2"
    strokeLinecap="round"
  />
);
const leaves = (
  <g fill={leaf} stroke={green} strokeWidth="1.4">
    <path d="M31 46C16 46 12 34 14 30c12 0 17 8 17 16Z" />
    <path d="M33 39c13-1 18-12 16-16-11 2-16 8-16 16Z" />
  </g>
);
function Artwork({ id }) {
  switch (id) {
    case "wheat":
      return (
        <>
          {stem}
          <g fill="#E8C47C" stroke="#9B712B" strokeWidth="1.1">
            {[17, 25, 33, 41].map((y) => (
              <g key={y}>
                <ellipse
                  cx="27"
                  cy={y}
                  rx="4"
                  ry="6"
                  transform={`rotate(-35 27 ${y})`}
                />
                <ellipse
                  cx="37"
                  cy={y}
                  rx="4"
                  ry="6"
                  transform={`rotate(35 37 ${y})`}
                />
              </g>
            ))}
            <path d="M32 6v9M21 9l5 7M43 9l-5 7" fill="none" />
          </g>
        </>
      );
    case "maize":
      return (
        <>
          <path d="M32 58V29" stroke={green} strokeWidth="2" />
          <rect
            x="23"
            y="8"
            width="18"
            height="37"
            rx="9"
            fill="#E8C47C"
            stroke="#A17C32"
            strokeWidth="1.5"
          />
          <path
            d="M29 11v27M35 11v27M24 18h16M23 24h18M23 30h18"
            stroke="#B38C42"
            strokeWidth="1"
          />
          <g fill={leaf} stroke={green} strokeWidth="1.5">
            <path d="M32 49C16 44 13 29 15 22c15 5 18 14 17 27Z" />
            <path d="M32 49c16-7 19-23 17-29-12 6-17 17-17 29Z" />
          </g>
        </>
      );
    case "berseem":
      return (
        <>
          {stem}
          <g fill={leaf} stroke={green} strokeWidth="1.4">
            <path d="M32 34C11 40 8 22 19 20c7-2 12 6 13 14Z" />
            <path d="M32 34c21 6 24-12 13-14-7-2-12 6-13 14Z" />
            <path d="M32 33c-16-10-11-25-2-23 11-5 18 13 2 23Z" />
          </g>
          <g fill="#E9F8F0" stroke={green}>
            <circle cx="32" cy="43" r="7" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle
                key={i}
                cx={32 + Math.cos(i) * 4}
                cy={43 + Math.sin(i) * 4}
                r="2.5"
              />
            ))}
          </g>
        </>
      );
    case "sugar_beet":
      return (
        <>
          <g fill={leaf} stroke={green} strokeWidth="1.4">
            <path d="M32 31C9 26 10 9 16 9c13 2 17 13 16 22Z" />
            <path d="M32 31C28 10 36 3 41 6c7 10 2 19-9 25Z" />
            <path d="M33 30C44 9 55 16 52 23c-5 8-12 10-19 7Z" />
          </g>
          <path
            d="M19 37c0-14 26-14 26 0 0 10-9 12-13 21-3-9-13-12-13-21Z"
            fill="#E4CAB4"
            stroke="#8E674D"
            strokeWidth="1.5"
          />
          <path
            d="m31 58 3 3M25 36l5 1m9 3-5 1"
            stroke="#8E674D"
            strokeWidth="1.2"
          />
        </>
      );
    case "sorghum":
      return (
        <>
          {stem}
          {leaves}
          <g fill="#B37B4C" stroke="#805A39" strokeWidth=".8">
            {[0, 1, 2, 3, 4].flatMap((row) =>
              Array.from({ length: row + 1 }, (_, i) => (
                <circle
                  key={`${row}-${i}`}
                  cx={32 + (i - row / 2) * 5}
                  cy={9 + row * 5}
                  r="3.3"
                />
              )),
            )}
          </g>
        </>
      );
    case "sesame":
      return (
        <>
          {stem}
          {leaves}
          <g fill="#E5D7B5" stroke="#947D4C" strokeWidth="1.2">
            {[15, 25, 35].map((y) => (
              <g key={y}>
                <ellipse
                  cx="26"
                  cy={y}
                  rx="4"
                  ry="7"
                  transform={`rotate(-25 26 ${y})`}
                />
                <path d={`M26 ${y - 4}v8`} />
                <ellipse
                  cx="38"
                  cy={y + 2}
                  rx="4"
                  ry="7"
                  transform={`rotate(25 38 ${y + 2})`}
                />
              </g>
            ))}
          </g>
        </>
      );
    case "faba_bean":
      return (
        <>
          {stem}
          {leaves}
          <path
            d="M30 12C11 12 11 45 23 47c12 1 18-26 12-33Z"
            fill={leaf}
            stroke={green}
            strokeWidth="1.6"
          />
          <g fill="#E9F8F0" stroke={green} strokeWidth="1">
            {[22, 31, 40].map((y, i) => (
              <ellipse key={y} cx={26 - i} cy={y} rx="4" ry="4.7" />
            ))}
          </g>
        </>
      );
    case "soybean":
      return (
        <>
          {stem}
          {leaves}
          <path
            d="M33 13c-15-5-23 3-23 13 1 13 24 15 28 3 3-7 2-12-5-16Z"
            fill="#D4DB9C"
            stroke={green}
            strokeWidth="1.5"
          />
          <g fill="#F5E5B8" stroke="#7F8F53" strokeWidth="1">
            {[18, 27, 35].map((x, i) => (
              <circle key={x} cx={x} cy={24 + (i % 2) * 3} r="4.2" />
            ))}
          </g>
        </>
      );
    case "cowpea_nili":
      return (
        <>
          {stem}
          {leaves}
          <g fill={leaf} stroke={green} strokeWidth="1.5">
            <path d="M30 12C8 13 9 39 15 54c5-18 0-33 15-42Z" />
            <path d="M33 13c22 0 25 20 16 39 0-16-2-32-16-39Z" />
          </g>
          <path d="M18 26v17M46 25l2 15" stroke={green} strokeWidth="1" />
        </>
      );
    default:
      return (
        <>
          {stem}
          {leaves}
        </>
      );
  }
}
export default function CropIcon({ id, size = 24 }) {
  return (
    <svg
      className={`crop-illustration crop-${id}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <Artwork id={id} />
    </svg>
  );
}
