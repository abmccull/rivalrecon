declare module '@chakra-ui/icons' {
  import * as React from 'react';
  
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    boxSize?: string | number;
    color?: string;
    mr?: string | number;
    ml?: string | number;
    mt?: string | number;
    mb?: string | number;
    size?: string | number;
    // Add any other Chakra UI specific props here
  }

  export const HamburgerIcon: React.FC<IconProps>;
  export const ChevronDownIcon: React.FC<IconProps>;
  export const SearchIcon: React.FC<IconProps>;
  export const ChevronLeftIcon: React.FC<IconProps>;
  export const ChevronRightIcon: React.FC<IconProps>;
  export const InfoIcon: React.FC<IconProps>;
  export const ViewIcon: React.FC<IconProps>;
  export const SettingsIcon: React.FC<IconProps>;
  export const CopyIcon: React.FC<IconProps>;
  export const ExternalLinkIcon: React.FC<IconProps>;
  export const DownloadIcon: React.FC<IconProps>;
} 