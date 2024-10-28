import React from 'react';
import { Ionicons, FontAwesome, MaterialIcons, AntDesign, Entypo, FontAwesome6 } from '@expo/vector-icons';

type IconLibrary = 'Ionicons' | 'FontAwesome' | 'MaterialIcons' | 'AntDesign' | 'Entypo';

type IconProps = {
  library: IconLibrary;
  name: string;
  size?: number;
  color?: string;
};

// Define type mappings for icon names based on each library
type IconNameType<T extends IconLibrary> =
  T extends 'Ionicons' ? React.ComponentProps<typeof Ionicons>['name'] :
  T extends 'FontAwesome' ? React.ComponentProps<typeof FontAwesome>['name'] :
  T extends 'MaterialIcons' ? React.ComponentProps<typeof MaterialIcons>['name'] :
  T extends 'AntDesign' ? React.ComponentProps<typeof AntDesign>['name'] :
  T extends 'Entypo' ? React.ComponentProps<typeof Entypo>['name'] :
  T extends 'FontAwesome6' ? React.ComponentProps<typeof FontAwesome6>['name'] :
  never;

function WagonIcon<T extends IconLibrary>({ library, name, size = 24, color = '#000' }: IconProps & { name: IconNameType<T> }) {
  // Mapping libraries to their respective components with type casting
  const iconLibraries = {
    Ionicons,
    FontAwesome,
    MaterialIcons,
    AntDesign,
    Entypo,
    FontAwesome6
  };

  // Cast IconComponent as `unknown` first, then to the appropriate component type
  const IconComponent = iconLibraries[library] as unknown as React.ComponentType<{ name: IconNameType<T>; size: number; color: string }>;

  if (!IconComponent) {
    console.warn(`Icon library "${library}" is not supported`);
    return null;
  }

  return <IconComponent name={name} size={size} color={color} />;
}

export default WagonIcon;
