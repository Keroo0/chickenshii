import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { colors } from "../constants/colors";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white px-6">
          <AlertTriangle size={48} color={colors.danger} />
          <Text className="mt-4 text-xl font-outfit_bold text-foreground text-center">
            Terjadi Kesalahan
          </Text>
          <Text className="mt-2 text-sm font-outfit_medium text-neutral-muted text-center leading-relaxed">
            Maaf, aplikasi mengalami gangguan. Silakan coba buka ulang aplikasi.
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="mt-6 h-12 px-8 items-center justify-center rounded-2xl bg-secondary flex-row gap-2"
          >
            <RefreshCw size={18} color="white" />
            <Text className="text-sm font-outfit_bold text-white">
              Coba Lagi
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
