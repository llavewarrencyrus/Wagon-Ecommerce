import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

export interface ModalButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface CustomAlertModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: ModalButton[];
  onClose?: () => void;
  type?: "info" | "success" | "warning" | "error" | "destructive";
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title = "",
  message = "",
  buttons,
  onClose,
  type,
}) => {
  if (!visible) return null;

  // Resolve active buttons
  const activeButtons: ModalButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: "OK", style: "default" }];

  // Infer type if not specified
  const resolvedType =
    type ||
    (() => {
      const lowerTitle = title.toLowerCase();
      if (
        lowerTitle.includes("delete") ||
        activeButtons.some((b) => b.style === "destructive")
      ) {
        return "destructive";
      }
      if (
        lowerTitle.includes("success") ||
        lowerTitle.includes("welcome") ||
        lowerTitle.includes("updated") ||
        lowerTitle.includes("saved") ||
        lowerTitle.includes("published")
      ) {
        return "success";
      }
      if (
        lowerTitle.includes("error") ||
        lowerTitle.includes("failed") ||
        lowerTitle.includes("invalid") ||
        lowerTitle.includes("denied") ||
        lowerTitle.includes("required") ||
        lowerTitle.includes("missing")
      ) {
        return "error";
      }
      if (lowerTitle.includes("cancel") || lowerTitle.includes("warning")) {
        return "warning";
      }
      return "info";
    })();

  const getIconConfig = () => {
    switch (resolvedType) {
      case "success":
        return {
          name: "checkmark-circle" as const,
          color: "#2E7D32",
          bgColor: "#E8F5E9",
        };
      case "destructive":
        return {
          name: "trash-outline" as const,
          color: "#D32F2F",
          bgColor: "#FFEBEE",
        };
      case "error":
        return {
          name: "alert-circle" as const,
          color: "#C62828",
          bgColor: "#FFEBEE",
        };
      case "warning":
        return {
          name: "warning" as const,
          color: "#E65100",
          bgColor: "#FFF3E0",
        };
      case "info":
      default:
        return {
          name: "information-circle" as const,
          color: Colors.primary || "#5C3A2E",
          bgColor: "#F5EFEA",
        };
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (btn: ModalButton) => {
    if (btn.onPress) {
      btn.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  const isTwoButtons = activeButtons.length === 2;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header Icon */}
              <View style={[styles.iconWrap, { backgroundColor: iconConfig.bgColor }]}>
                <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
              </View>

              {/* Title */}
              {title ? <Text style={styles.title}>{title}</Text> : null}

              {/* Message */}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Buttons Container */}
              <View
                style={[
                  styles.buttonContainer,
                  isTwoButtons ? styles.buttonRow : styles.buttonCol,
                ]}
              >
                {activeButtons.map((btn, index) => {
                  const isCancel = btn.style === "cancel";
                  const isDestructive = btn.style === "destructive";

                  const buttonStyle = [
                    styles.button,
                    isTwoButtons && styles.halfButton,
                    isCancel
                      ? styles.cancelButton
                      : isDestructive
                      ? styles.destructiveButton
                      : styles.primaryButton,
                  ];

                  const textStyle = [
                    styles.buttonText,
                    isCancel
                      ? styles.cancelButtonText
                      : styles.primaryButtonText,
                  ];

                  return (
                    <TouchableOpacity
                      key={index}
                      style={buttonStyle}
                      activeOpacity={0.75}
                      onPress={() => handleButtonPress(btn)}
                    >
                      <Text style={textStyle} numberOfLines={1}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: Math.min(width - 56, 360),
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E1E17",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  buttonCol: {
    flexDirection: "column",
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  halfButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#5C3A2E",
  },
  destructiveButton: {
    backgroundColor: "#D32F2F",
  },
  cancelButton: {
    backgroundColor: "#F0EBE6",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#5C3A2E",
  },
});

export default CustomAlertModal;
