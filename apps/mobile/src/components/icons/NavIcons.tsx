import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

/**
 * 1. Sections / Architecture Layers Icon
 * Sleek stacked isometric architecture planes
 */
export const SectionsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 17L12 22L22 17"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12L12 17L22 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * 2. Relations / Directed Graph Tree Icon
 * Clean git-branch / node hierarchy graph
 */
export const RelationsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M8.59 13.51L15.42 17.49"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.41 6.51L8.59 10.49"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 3. ADR & Metrics Icon
 * Precision pulse & telemetry chart
 */
export const MetricsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 20V4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 20V14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 20H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 4. Global FTS Search Icon
 * Minimalist geometric search lens
 */
export const SearchNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M20 20L16.2 16.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};

/**
 * 5. System Settings / Sliders Icon
 * Minimalist horizontal adjustment sliders
 */
export const SettingsNavIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#8A8A94',
  focused = false,
}) => {
  const strokeWidth = focused ? 2.2 : 1.75;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21V14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M4 10V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 21V12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 8V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M20 21V16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M20 12V3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M1 14H7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M9 8H15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M17 16H23"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};
