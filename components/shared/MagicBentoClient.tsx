"use client";

import dynamic from "next/dynamic";

const MagicBento = dynamic(() => import("./MagicBento"), { ssr: false });

export default MagicBento;
