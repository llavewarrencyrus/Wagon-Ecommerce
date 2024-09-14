import React from 'react';
import { View, Image, Dimensions} from 'react-native';
const { width } = Dimensions.get('window');
export default function Construction() {
    return (
      <View style={{flex: 1, justifyContent:'center', backgroundColor:'#fff'}}>
          <Image source = {require('@/assets/images/page-under-construction.jpg')} style={{width:width, objectFit:'contain'}}/>
      </View>
    );
}