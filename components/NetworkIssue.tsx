import { Colors } from '@/constants/Colors';
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SCREEN_WIDTH as width } from '@/constants/Layout';

interface NetworkIssueProps {
    onRetry: () => void;
}

const NetworkIssue: React.FC<NetworkIssueProps> = ({ onRetry }) => {
    return (
        <View style={{ flex: 1, flexDirection: 'column', marginHorizontal: 'auto', marginTop: 50 }}>
            <View style={{ margin: 5 }}>
                <Image source={require('@/assets/images/network.png')} style={{ width: width *0.5, height: width *0.365, resizeMode: 'contain', marginHorizontal: 'auto' }} />
                <Text style={{ fontSize: 20, margin:'auto', marginTop:0, marginBottom: 50 }}>Network Connection Issue </Text>
                
                <TouchableOpacity onPress={onRetry} >
                    <View style={{backgroundColor:Colors.button, padding: 12, borderRadius: 10}}>
                        <Text style={{ fontSize: 20, textAlign: 'center', color: '#fff' }}>Please try again</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default NetworkIssue;
