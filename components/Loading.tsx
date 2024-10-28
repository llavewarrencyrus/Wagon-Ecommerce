import React from "react";
import LottieView from "lottie-react-native";

const Loading: React.FC = () => {
    return (
        <LottieView
            autoPlay
            loop
            source={require('../assets/loader/load.json')}
            style={{ width: '25%', height: '80%', alignSelf: 'center' }}
        />
    );
};

export default Loading;
