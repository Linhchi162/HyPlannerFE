import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Icon, ProgressBar, Text } from "react-native-paper";
import { responsiveFont, responsiveHeight, responsiveWidth } from "../../assets/styles/utils/responsive";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { HandCoins } from "lucide-react-native";

type BudgetProgressBarProps = {
    totalBudget: number;
    totalExpectedBudget: number;
    totalActualBudget: number;
};

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
    totalBudget,
    totalExpectedBudget,
    totalActualBudget,
}) => {
    return (
        <View style={styles.container}>
            {/* ProgressBar cho ngân sách dự kiến */}
            <ProgressBar
                progress={totalExpectedBudget / totalBudget}
                color="#D95D74"
                style={styles.progressBar}
            />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 25, height: 25 }}>
                        <FontAwesome5 name="money-bill-wave" size={16} color="#4CAF50" style={{ marginRight: 5 }} />
                    </View>
                    <Text style={[styles.progressText, { color: totalExpectedBudget > totalBudget ? "#D95D74" : "#6B7280" }]}>
                        Ngân sách dự kiến: {totalExpectedBudget.toLocaleString()} / {totalBudget.toLocaleString()} VNĐ
                    </Text>
                </View>
                {totalExpectedBudget > totalBudget && (
                    <View style={{ width: 30, height: 30 }}>
                        <Feather name="alert-triangle" size={20} color="#D95D74" style={styles.warningIcon} />
                    </View>
                )}
            </View>
            {/* ProgressBar cho ngân sách thực tế */}
            <ProgressBar
                progress={totalActualBudget / totalBudget}
                color="#4CAF50"
                style={styles.progressBar}
            />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 30, height: 30 }}>
                        <Icon source="hand-coin-outline" size={20} color="#d33d1eff" />
                    </View>
                    <Text style={[styles.progressText, { color: totalActualBudget > totalBudget ? "#D95D74" : "#6B7280" }]}>
                        Ngân sách thực tế: {totalActualBudget.toLocaleString()} / {totalBudget.toLocaleString()} VNĐ
                    </Text>
                </View>
                {totalActualBudget > totalBudget && (
                    <TouchableOpacity style={{ width: 30, height: 30 }}>
                        <Feather name="alert-triangle" size={20} color="#D95D74" style={styles.warningIcon} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
    },
    title: {
        fontSize: responsiveFont(14),
        fontFamily: "Montserrat-SemiBold",
        color: "#333",
        marginBottom: responsiveHeight(10),
    },
    progressBar: {
        height: responsiveHeight(10),
        borderRadius: 5,
        backgroundColor: "#F9E2E7",
        marginBottom: responsiveHeight(8),
    },
    progressText: {
        fontSize: responsiveFont(12),
        fontFamily: "Montserrat-Regular",
        color: "#6B7280",
        marginBottom: responsiveHeight(10),
    },
    warningIcon: {
        alignSelf: "center",
    },
});

export default BudgetProgressBar;