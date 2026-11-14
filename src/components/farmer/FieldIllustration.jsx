const soil = (
  <>
    <path d="M8 43h84v14H8Z" fill="#E9DDCB" />
    <path d="M8 43h84M8 51h84" stroke="#9A8060" strokeWidth="1.5" />
    <path d="m18 48 6 1m16 5 8-1m22-6 7 2" stroke="#B19A7B" />
  </>
);
const plant = (
  <g stroke="#08794A" strokeWidth="1.6" strokeLinecap="round">
    <path d="M50 43V25" />
    <path
      d="M50 34c-10 0-13-6-12-10 8 0 12 4 12 10Zm0 3c10 0 13-6 12-10-8 0-12 4-12 10Z"
      fill="#9AD8BF"
    />
  </g>
);
export default function FieldIllustration({ kind, size = 96 }) {
  let art;
  if (["flood", "modified_surface", "sprinkler", "drip"].includes(kind))
    art = (
      <>
        {soil}
        {plant}
        {kind === "flood" ? (
          <>
            <path
              d="M8 38q7-5 14 0t14 0t14 0t14 0t14 0t14 0v5H8Z"
              fill="#B9DAEA"
              stroke="#3289CE"
            />
          </>
        ) : kind === "modified_surface" ? (
          <>
            <path
              d="M10 37h20v6H10Zm30 0h20v6H40Zm30 0h20v6H70Z"
              fill="#B9DAEA"
            />
            <path
              d="M10 38h20m10 0h20m10 0h20"
              stroke="#3289CE"
              strokeWidth="2"
            />
          </>
        ) : kind === "sprinkler" ? (
          <>
            <path d="M21 43V26m-5 0h10" stroke="#4C6257" strokeWidth="2" />
            <path
              d="M20 24C21 5 72 5 81 30M20 25C25 12 55 11 61 23M20 25C13 13 6 18 6 27"
              stroke="#3289CE"
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
          </>
        ) : (
          <>
            <path d="M8 36h35m15 0h34" stroke="#4C6257" strokeWidth="3" />
            <path d="M46 35v5m12-5v5" stroke="#3289CE" strokeWidth="2" />
            <path d="m46 45-3 4 3 3 3-3Zm12 0-3 4 3 3 3-3Z" fill="#3289CE" />
          </>
        )}
      </>
    );
  else if (kind === "old_clay" || kind === "new_sandy")
    art = (
      <>
        {soil}
        {plant}
        <path
          d="M8 47h84v10H8Z"
          fill={kind === "old_clay" ? "#BAA48B" : "#E6D3A9"}
        />
        {kind === "new_sandy" ? (
          <g fill="#A68B5D">
            {[15, 27, 40, 57, 69, 83].map((x, i) => (
              <circle key={x} cx={x} cy={50 + (i % 2) * 4} r="1.5" />
            ))}
          </g>
        ) : (
          <path
            d="m15 49 10 3 8-3 13 4 12-3 12 3 15-2"
            stroke="#826D56"
            fill="none"
          />
        )}
      </>
    );
  else if (["none", "moderate", "high"].includes(kind))
    art = (
      <>
        {soil}
        {plant}
        <g fill="#F7F9F8" stroke="#9A8060" strokeWidth="1">
          {Array.from(
            { length: { none: 0, moderate: 3, high: 7 }[kind] },
            (_, i) => (
              <path key={i} d={`m${12 + i * 11} 38 4-6 4 6-4 3Z`} />
            ),
          )}
        </g>
        {kind === "none" && (
          <path d="m16 32 5 5 10-12" stroke="#08794A" strokeWidth="2" />
        )}
      </>
    );
  else if (kind === "livestock")
    art = (
      <g
        fill="#F3FBF6"
        stroke="#4C6257"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M21 24h40l10 9v13H29l-8-8Zm5 21v12m32-12v12M20 28l-7-9v20m48-15 7-9 12 5 8 13-10 8-10-8Z" />
        <path d="m69 18-4-8m11 9 5-9" />
        <path d="M35 24v12l9 5 5-17Z" fill="#9AD8BF" />
        <circle cx="79" cy="28" r="1" fill="#4C6257" />
      </g>
    );
  else if (kind === "cover")
    art = (
      <>
        {soil}
        {[24, 50, 76].map((x) => (
          <g key={x} transform={`translate(${x - 50} 0)`}>
            {plant}
          </g>
        ))}
      </>
    );
  else if (kind === "area")
    art = (
      <>
        <path
          d="m12 19 57-9 20 29-56 15Z"
          fill="#E9F8F0"
          stroke="#08794A"
          strokeWidth="1.8"
        />
        <path
          d="m24 23 53-8M29 32l52-8M34 42l50-8"
          stroke="#9AD8BF"
          strokeWidth="2"
        />
        <path d="M12 55h70m-70-4v8m70-8v8" stroke="#4C6257" strokeWidth="1.5" />
      </>
    );
  else if (kind === "lab")
    art = (
      <>
        <path
          d="M35 10h30m-23 0v17L28 49q-3 8 7 8h30q10 0 7-8L58 27V10"
          stroke="#4C6257"
          strokeWidth="1.8"
        />
        <path d="m35 40-5 10q-2 4 5 4h30q7 0 5-4l-5-10Z" fill="#9AD8BF" />
        <circle cx="48" cy="44" r="3" fill="#E9F8F0" />
        <circle cx="58" cy="49" r="2" fill="#E9F8F0" />
      </>
    );
  else
    art = (
      <>
        {soil}
        {plant}
      </>
    );
  return (
    <svg
      className="field-illustration"
      width={size}
      height={size * 0.64}
      viewBox="0 0 100 64"
      fill="none"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}
