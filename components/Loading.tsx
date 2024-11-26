import React from "react";
import { Image } from 'react-native';
import LottieView from "lottie-react-native";

const Loading: React.FC = () => {
    return (
        // <LottieView
        //     autoPlay
        //     loop
        //     source={require('../assets/loader/load.json')}
        //     style={{ width: '25%', height: '80%', alignSelf: 'center' }}
        // />
        <Image
            source={require('@/assets/loader/cartLoading.gif')}
            style={{ width: '45%', alignSelf: 'center', margin:'auto' }}
        />
    );
};

export default Loading;
