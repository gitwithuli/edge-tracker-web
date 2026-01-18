import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MACRO_LOGS_TO_IMPORT = [
  {
    macroId: "hourly-950",
    date: "2026-01-14",
    pointsMoved: 139,
    direction: "BEARISH",
    displacementQuality: "CLEAN",
    liquiditySweep: "LOWS",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/BaHZoQ9t/"],
  },
  {
    macroId: "hourly-1050",
    date: "2026-01-14",
    pointsMoved: 67,
    direction: "BULLISH",
    displacementQuality: "CHOPPY",
    liquiditySweep: "LOWS",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/09fRg603/"],
  },
  {
    macroId: "hourly-1150",
    date: "2026-01-14",
    pointsMoved: 63,
    direction: "BULLISH",
    displacementQuality: "CLEAN",
    liquiditySweep: "LOWS",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/lQ6ra3fM/"],
  },
  {
    macroId: "hourly-1250",
    date: "2026-01-14",
    pointsMoved: 57,
    direction: "BEARISH",
    displacementQuality: "CLEAN",
    liquiditySweep: "LOWS",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/UKufvCX7/"],
  },
  {
    macroId: "hourly-1350",
    date: "2026-01-14",
    pointsMoved: 57,
    direction: "BULLISH",
    displacementQuality: "CLEAN",
    liquiditySweep: "HIGHS",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/35w19an5/"],
  },
  {
    macroId: "rth-close-1",
    date: "2026-01-14",
    pointsMoved: 133,
    direction: "BULLISH",
    displacementQuality: "CHOPPY",
    liquiditySweep: "BOTH",
    note: "",
    tvLinks: [
      "https://www.tradingview.com/x/8PpnVZFk/",
      "https://www.tradingview.com/x/d9eegCw7/",
      "https://www.tradingview.com/x/cPTVamfD/",
      "https://www.tradingview.com/x/lz6JbnWt/",
    ],
  },
  {
    macroId: "rth-close-2",
    date: "2026-01-14",
    pointsMoved: 115,
    direction: "BULLISH",
    displacementQuality: "CLEAN",
    liquiditySweep: "HIGHS",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/a2R9VNWb/"],
  },
  {
    macroId: "rth-close-3",
    date: "2026-01-14",
    pointsMoved: 93,
    direction: "BULLISH",
    displacementQuality: "CLEAN",
    liquiditySweep: "BOTH",
    note: "",
    tvLinks: ["https://www.tradingview.com/x/vpolgCCa/"],
  },
];

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = [];
    for (const log of MACRO_LOGS_TO_IMPORT) {
      const { data, error } = await supabase
        .from("macro_logs")
        .upsert(
          {
            user_id: user.id,
            macro_id: log.macroId,
            date: log.date,
            points_moved: log.pointsMoved,
            direction: log.direction,
            displacement_quality: log.displacementQuality,
            liquidity_sweep: log.liquiditySweep,
            note: log.note,
            tv_links: log.tvLinks,
          },
          { onConflict: "user_id,macro_id,date" }
        )
        .select();

      if (error) {
        results.push({ macroId: log.macroId, error: error.message });
      } else {
        results.push({ macroId: log.macroId, success: true, data });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.filter((r) => r.success).length} of ${MACRO_LOGS_TO_IMPORT.length} logs`,
      results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
