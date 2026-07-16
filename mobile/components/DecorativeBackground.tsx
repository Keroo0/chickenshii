import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Palet warna yang spesifik sesuai permintaan
const colors = {
  leaf: "#5FBD38",     // Hijau
  water: "#1159B1",    // Biru
  poop: "#663300",     // Cokelat
  comb: "#ED1C24",     // Merah
  beak: "#FBB03B",     // Kuning
  body: "#9CA3AF",     // Abu-abu netral untuk badan
};

const LeafIcon = ({ size = 200 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill={colors.leaf} />
  </Svg>
);

const WaterIcon = ({ size = 200 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" fill={colors.water} />
  </Svg>
);

const PoopIcon = ({ size = 200 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Tumpukan bawah */}
    <Path d="M5 17h14a2.5 2.5 0 0 0 0-5H5a2.5 2.5 0 0 0 0 5z" fill={colors.poop} />
    {/* Tumpukan tengah */}
    <Path d="M7 12h10a2.5 2.5 0 0 0 0-5H7a2.5 2.5 0 0 0 0 5z" fill={colors.poop} />
    {/* Ujung atas */}
    <Path d="M10 7h4a2 2 0 0 0 -2 -3.5 2 2 0 0 0 -2 3.5z" fill={colors.poop} />
  </Svg>
);

const ChickenIcon = ({ size = 200 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Jengger merah */}
    <Path d="M9 8 a2 2 0 0 1 2.5 -1.5 a2 2 0 0 1 3.5 1.5 v3 h-6 z" fill={colors.comb} />
    {/* Badan ayam */}
    <Path d="M5 18 a7 7 0 0 0 14 0 v-5 a6 6 0 0 0 -12 0 z" fill={colors.body} />
    {/* Paruh */}
    <Path d="M18 13 l4 1 l-4 1 z" fill={colors.beak} />
    {/* Mata */}
    <Circle cx="14.5" cy="12" r="1.5" fill="#1F2937" />
  </Svg>
);

const icons = [ChickenIcon, PoopIcon, WaterIcon, LeafIcon];

export default function DecorativeBackground() {
  const pattern = useMemo(() => {
    // Array konfigurasi statis untuk mensimulasikan "acak" tapi konsisten
    // agar tidak loncat-loncat saat render ulang
    const configs = [
      { Icon: ChickenIcon, size: 280, top: -60, right: -60, rot: -15, op: 0.05 },
      { Icon: LeafIcon, size: 220, top: -40, left: -50, rot: 35, op: 0.05 },
      { Icon: PoopIcon, size: 260, bottom: -60, left: -50, rot: 15, op: 0.04 },
      { Icon: WaterIcon, size: 240, bottom: -50, right: -50, rot: -20, op: 0.05 },
    ];

    return configs.map((conf, i) => (
      <View
        key={i}
        style={{
          position: 'absolute',
          top: conf.top,
          bottom: conf.bottom,
          left: conf.left,
          right: conf.right,
          transform: [{ rotate: `${conf.rot}deg` }],
          opacity: conf.op,
        }}
      >
        <conf.Icon size={conf.size} />
      </View>
    ));
  }, []);

  return (
    <View 
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FAFAFA', overflow: 'hidden' }]} 
      pointerEvents="none"
    >
      {pattern}
    </View>
  );
}
