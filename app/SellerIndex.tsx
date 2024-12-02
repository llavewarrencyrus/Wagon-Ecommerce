import * as React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { ProgressChart, PieChart, LineChart } from "react-native-chart-kit";
import SegmentedControlTab from 'react-native-segmented-control-tab';

type LineChartData = {
    labels: string[];
    datasets: {
        data: number[];
        strokeWidth: number;
    }[];
};

type LineChartDataCollection = {
    [key: string]: LineChartData;
};

export default function SellerIndex() {
    const screenWidth = Dimensions.get('window').width;

    const [selectedPeriod, setSelectedPeriod] = React.useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual'>('Daily');

    const handlePeriodChange = (index: number) => {
        const periods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'] as const;
        setSelectedPeriod(periods[index]);
    };

    const lineChartData: LineChartDataCollection = {
        Daily: {
            labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            datasets: [
                {
                    data: [2340, 1300, 3055, 6320, 1500, 6540, 7870],
                    strokeWidth: 2 
                }
            ]
        },
        Weekly: {
            labels: ["W1", "W2", "W3", "W4", "W5"],
            datasets: [
                {
                    data: [14600, 15600, 15000, 15400, 16200],
                    strokeWidth: 2 
                }
            ]
        },
        Monthly: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
                {
                    data: [10000, 15000, 12000, 18000, 16000, 20000, 17000, 18000, 19000, 20000, 21000, 25000],
                    strokeWidth: 2 
                }
            ]
        },
        Quarterly: {
            labels: ["Q1", "Q2", "Q3", "Q4"],
            datasets: [
                {
                    data: [50000, 60000, 55000, 70000],
                    strokeWidth: 2 
                }
            ]
        },
        Annual: {
            labels: ["2021", "2022", "2023"],
            datasets: [
                {
                    data: [600000, 650000, 700000],
                    strokeWidth: 2 
                }
            ]
        }
    };

  
    const progressChartData = {
        labels: ["Sales", "Inventory"], 
        data: [0.7, 0.5], 
    };

 
    const pieChartData = [
        { name: "Shirt", population: 215, color: "#fabb00", legendFontColor: "#7F7F7F", legendFontSize: 15 },
        { name: "Pants", population: 280, color: "#fcdb00", legendFontColor: "#7F7F7F", legendFontSize: 15 },
        { name: "Pajamas", population: 527, color: "#d4b044", legendFontColor: "#7F7F7F", legendFontSize: 15 },
        { name: "Dress", population: 186, color: "#fce08b", legendFontColor: "#7F7F7F", legendFontSize: 15 },
        { name: "Suit", population: 119, color: "#fff4ad", legendFontColor: "#7F7F7F", legendFontSize: 15 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Section 1: Period Selection */}
                <View style={styles.segmentedControlContainer}>
                    <SegmentedControlTab
                        values={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual']}
                        selectedIndex={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'].indexOf(selectedPeriod)}
                        onTabPress={handlePeriodChange}
                        tabsContainerStyle={styles.segmentedControl}
                        tabStyle={{ backgroundColor: '#fff4ad', borderColor: '#fabb00' }}
                        activeTabStyle={{ backgroundColor: '#fabb00' }}
                        tabTextStyle={{ color: 'black' }}
                    />
                </View>

                {/* Section 2: Line Chart */}
                <View style={styles.section}>
                    <Text style={styles.title}>{selectedPeriod} Sales Growth</Text>
                    <LineChart
                        data={lineChartData[selectedPeriod]}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        segments={4}
                        style={styles.chart}
                        verticalLabelRotation={25}
                        horizontalLabelRotation={-38}
                        xLabelsOffset={-5}
                    />
                </View>

                {/* Section 3: Progress and Pie Charts Side by Side */}
                <View style={styles.chartsContainer}>
                    {/* Progress Chart and Legend */}
                    <View style={styles.chartWrapper}>
                        <Text style={styles.title2}>Inventory and Sales Progress</Text>
                        <ProgressChart
                            data={progressChartData}
                            width={screenWidth / 2.5}  // Adjust width for side-by-side layout
                            height={150}
                            strokeWidth={8}
                            radius={32}
                            chartConfig={chartConfig}
                            hideLegend={true}
                            style={styles.chart}
                        />
                        {/* Custom Legend for Progress Chart */}
                        <View style={styles.legendContainer}>
                            {progressChartData.labels.map((label, index) => (
                                <View key={index} style={styles.legendItem}>
                                    <Text style={styles.dataValue}>
                                        {Math.round(progressChartData.data[index] * 100)}%{"\n"}
                                        <Text style={styles.legendLabel}>{label}</Text>
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    
                    {/* Pie Chart and Legend */}
                    <View style={styles.chartWrapper}>
                        <Text style={styles.title2}>Category Distribution</Text>
                        <PieChart
                            data={pieChartData}
                            width={screenWidth / 2.5}
                            height={150}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"41"}
                            absolute
                            style={styles.chart}
                            hasLegend={false}
                        />
                        {/* Custom Legend for Pie Chart */}
                        <View style={styles.legendContainer}>
                            {pieChartData.map((item, index) => (
                                <View key={index} style={styles.legendItem}>
                                    {/* Display the corresponding pie chart color in the labels */}
                                    <View
                                        style={[
                                            styles.legendColor,
                                            { backgroundColor: item.color },  // Use the color from pieChartData
                                        ]}
                                    />
                                    <Text style={styles.dataValue}>
                                        {item.population}{"\n"}
                                        <Text style={styles.legendLabel}>{item.name}</Text>
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Chart configuration
const chartConfig = {
    backgroundColor: "#f8f8f8",
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 2, // Number of decimal places in data labels
    color: (opacity = 1) => `rgba(234, 167, 0, ${opacity})`, // Bar color
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label color
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726",
    },
    propsForVerticalLabels: {
        fontSize: 10,
    },
    propsForHorizontalLabels: {
        fontSize: 10,
    },
};

// Styling for the component
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5', // Softer background
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    segmentedControlContainer: {
        marginVertical: 20,
    },
    segmentedControl: {
        borderRadius: 10, // Rounded edges
        height: 45,
        marginHorizontal: 10,
        color: '#e6a100',
    },
    section: {
        marginBottom: 20, // Increased spacing
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4, // Elevation for Android
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    title2: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        marginBottom: 10,
    },
    chartsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 30,
    },
    chartWrapper: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 15,
        margin: '1%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    chart: {
        marginVertical: 10,
        borderRadius: 16,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginHorizontal: 5,
    },
    legendLabel: {
        fontSize: 12,
        color: '#555',
        marginLeft: 5, // Space between color and label
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    dataValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
});
