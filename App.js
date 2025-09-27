import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import ReaderScreen from './src/screens/ReaderScreen';


import EpubReader from './src/screens/EpubReader';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Бібліотека" component={HomeScreen} />
                <Stack.Screen name="Reader" component={ReaderScreen} />
                <Stack.Screen name="EpubReader" component={EpubReader} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
