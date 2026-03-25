import { useTheme } from '../context/ThemeContext';

const BowlIcon = () => {
  const { theme } = useTheme();

  return (
    <svg width="26" height="22" viewBox="0 0 170 140" fill="none">
      <ellipse
        cx="85"
        cy="85"
        rx="75"
        ry="55"
        fill={theme.bowlFill}
        stroke={theme.bowlStroke}
        strokeWidth="2"
      />
      <ellipse
        cx="85"
        cy="30"
        rx="50"
        ry="14"
        fill={theme.bg}
        stroke={theme.bowlStroke}
        strokeWidth="2"
      />
      {/* Notes inside */}
      <rect
        x="55"
        y="65"
        width="22"
        height="16"
        rx="2"
        fill="#e8d5b7"
        transform="rotate(-8 66 73)"
      />
      <rect
        x="85"
        y="75"
        width="24"
        height="16"
        rx="2"
        fill="#d4a574"
        transform="rotate(6 97 83)"
      />
      <rect
        x="62"
        y="95"
        width="20"
        height="14"
        rx="2"
        fill="#c9a87c"
        transform="rotate(-4 72 102)"
      />
      <rect
        x="88"
        y="100"
        width="22"
        height="14"
        rx="2"
        fill="#dcc5a0"
        transform="rotate(8 99 107)"
      />
    </svg>
  );
};

export default BowlIcon;
