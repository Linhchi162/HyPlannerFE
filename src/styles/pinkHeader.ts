import { StyleSheet } from "react-native";
import { responsiveFont } from "../../assets/styles/utils/responsive";

export const pinkHeaderStyles = StyleSheet.create({
    title: {
        fontFamily: "MavenPro",
        fontSize: responsiveFont(16),
        fontWeight: "700",
        textAlign: "center",
    },
    titleContainer: {
        flex: 1,
        justifyContent: "center",
        marginHorizontal: 8,
    },
});
